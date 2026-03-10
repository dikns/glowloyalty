// Core Express app — routes mounted WITHOUT /api prefix.
// Local dev server (server.js) mounts this at /api.
// Netlify function (netlify/functions/api.js) uses it directly via redirect.

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const JWT_SECRET = process.env.JWT_SECRET || 'glowloyalty-secret-key-2024';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://avprwynaodyrhwydjywu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_KQA6E4agmgtUSZpYPHrQoQ_SIFlmDEG';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// ── Helpers ───────────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Ni avtorizacije' });
  try {
    req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Neveljaven žeton' });
  }
}

function requireStaff(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'staff') return res.status(403).json({ error: 'Dostop zavrnjen' });
    next();
  });
}

function calcTier(points) {
  if (points >= 1000) return 'Zlata';
  if (points >= 500) return 'Srebrna';
  return 'Bronasta';
}

function safeUser(u) {
  return {
    id: u.id, name: u.name, email: u.email, phone: u.phone,
    role: u.role, points: u.points, tier: u.tier,
    qr_token: u.qr_token, created_at: u.created_at,
  };
}

// ── Auth ──────────────────────────────────────────────────────────────────────
app.post('/auth/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Ime, e-pošta in geslo so obvezni' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { data: user, error } = await supabase
      .from('users')
      .insert({ name, email, phone: phone || '', password_hash: hash, role: 'customer', qr_token: uuidv4() })
      .select().single();
    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'E-pošta je že v uporabi' });
      throw error;
    }
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: safeUser(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Napaka strežnika' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
  if (!user) return res.status(401).json({ error: 'Napačna e-pošta ali geslo' });
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Napačna e-pošta ali geslo' });
  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: safeUser(user) });
});

// ── Customer ──────────────────────────────────────────────────────────────────
app.get('/customer/profile', requireAuth, async (req, res) => {
  const { data: user, error } = await supabase
    .from('users').select('id, name, email, phone, role, points, tier, qr_token, created_at')
    .eq('id', req.user.id).single();
  if (error || !user) return res.status(404).json({ error: 'Uporabnik ni najden' });
  res.json(user);
});

app.get('/customer/visits', requireAuth, async (req, res) => {
  const { data: visits } = await supabase
    .from('visits').select('*, staff:staff_id(name)')
    .eq('customer_id', req.user.id).order('created_at', { ascending: false });
  const flat = (visits || []).map(({ staff, ...v }) => ({ ...v, staff_name: staff?.name || null }));
  res.json(flat);
});

// ── Staff ─────────────────────────────────────────────────────────────────────
app.get('/staff/scan/:qrToken', requireStaff, async (req, res) => {
  const { data: user } = await supabase
    .from('users').select('id, name, email, phone, points, tier, created_at')
    .eq('qr_token', req.params.qrToken).eq('role', 'customer').single();
  if (!user) return res.status(404).json({ error: 'Stranka ni najdena' });
  res.json(user);
});

app.get('/staff/customers', requireStaff, async (req, res) => {
  const { search } = req.query;
  let query = supabase.from('users')
    .select('id, name, email, phone, points, tier, created_at')
    .eq('role', 'customer').order('name');
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.get('/staff/customer/:id/visits', requireStaff, async (req, res) => {
  const { data: visits } = await supabase
    .from('visits').select('*, staff:staff_id(name)')
    .eq('customer_id', req.params.id).order('created_at', { ascending: false });
  const flat = (visits || []).map(({ staff, ...v }) => ({ ...v, staff_name: staff?.name || null }));
  res.json(flat);
});

app.post('/staff/visit', requireStaff, async (req, res) => {
  const { customer_id, service, amount, notes } = req.body;
  if (!customer_id || !service) return res.status(400).json({ error: 'Stranka in storitev sta obvezni' });
  const points_awarded = Math.round(parseFloat(amount) || 0);
  const { error: visitError } = await supabase.from('visits').insert({
    customer_id, staff_id: req.user.id, service,
    amount: parseFloat(amount) || 0, points_awarded, notes: notes || '',
  });
  if (visitError) return res.status(500).json({ error: visitError.message });
  const { data: customer } = await supabase.from('users').select('points').eq('id', customer_id).single();
  const newPoints = (customer?.points || 0) + points_awarded;
  await supabase.from('users').update({ points: newPoints, tier: calcTier(newPoints) }).eq('id', customer_id);
  const { data: updated } = await supabase.from('users')
    .select('id, name, email, points, tier').eq('id', customer_id).single();
  res.json({ success: true, points_awarded, customer: updated });
});

app.get('/staff/analytics', requireStaff, async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const [
    { count: totalCustomers },
    { count: todayVisits },
    { count: totalVisits },
    { data: pointsRows },
    { data: recentVisitsRaw },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('visits').select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`).lte('created_at', `${today}T23:59:59`),
    supabase.from('visits').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('points').eq('role', 'customer'),
    supabase.from('visits').select('*, customer:customer_id(name), staff:staff_id(name)')
      .order('created_at', { ascending: false }).limit(10),
  ]);
  const totalPoints = (pointsRows || []).reduce((s, u) => s + (u.points || 0), 0);
  const recentVisits = (recentVisitsRaw || []).map(({ customer, staff, ...v }) => ({
    ...v, customer_name: customer?.name || null, staff_name: staff?.name || null,
  }));
  res.json({ totalCustomers, todayVisits, totalPoints, totalVisits, recentVisits });
});

// ── Seed helper ───────────────────────────────────────────────────────────────
async function seedStaff() {
  const { data } = await supabase.from('users').select('id').eq('role', 'staff').limit(1).single();
  if (!data) {
    const hash = await bcrypt.hash('osebje123', 10);
    const { error } = await supabase.from('users').insert({
      name: 'Admin Osebje', email: 'osebje@salon.si', phone: '+386 1 234 5678',
      password_hash: hash, role: 'staff', qr_token: uuidv4(),
    });
    if (!error) console.log('✓ Ustvaren privzeti račun osebja: osebje@salon.si / osebje123');
  }
}

module.exports = { app, seedStaff };
