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
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2cHJ3eW5hb2R5cmh3eWRqeXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzEyMjcsImV4cCI6MjA4ODc0NzIyN30.ECWehUWQ0UJxG-7MXSzpQf8g9EQrgpOVsojLa6-IE5U';
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

// ── Profile & Password ────────────────────────────────────────────────────────
app.get('/auth/profile', requireAuth, async (req, res) => {
  const { data: user, error } = await supabase
    .from('users').select('id, name, email, phone, role, points, tier, qr_token, created_at')
    .eq('id', req.user.id).single();
  if (error || !user) return res.status(404).json({ error: 'Uporabnik ni najden' });
  res.json(user);
});

app.put('/auth/profile', requireAuth, async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Ime in e-pošta sta obvezna' });
  try {
    const { data: existing } = await supabase
      .from('users').select('id').eq('email', email).neq('id', req.user.id).maybeSingle();
    if (existing) return res.status(409).json({ error: 'E-pošta je že v uporabi' });
    const { data: user, error } = await supabase
      .from('users').update({ name, email, phone: phone || '' })
      .eq('id', req.user.id).select().single();
    if (error) throw error;
    res.json(safeUser(user));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Napaka strežnika' });
  }
});

app.put('/auth/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Vsa polja so obvezna' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Geslo mora imeti vsaj 6 znakov' });
  try {
    const { data: user } = await supabase.from('users').select('*').eq('id', req.user.id).single();
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Trenutno geslo je napačno' });
    const hash = await bcrypt.hash(newPassword, 10);
    await supabase.from('users').update({ password_hash: hash }).eq('id', req.user.id);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Napaka strežnika' });
  }
});

// ── Appointments ──────────────────────────────────────────────────────────────
app.get('/staff/appointments', requireStaff, async (req, res) => {
  const { year, month } = req.query;
  let query = supabase.from('appointments')
    .select('*').order('date').order('time');
  if (year && month) {
    const y = parseInt(year), m = parseInt(month);
    const start = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const end = `${y}-${String(m).padStart(2, '0')}-${lastDay}`;
    query = query.gte('date', start).lte('date', end);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/staff/appointment', requireStaff, async (req, res) => {
  const { customer_name, customer_id, service, date, time, notes } = req.body;
  if (!customer_name || !service || !date || !time)
    return res.status(400).json({ error: 'Stranka, storitev, datum in ura so obvezni' });
  const { data, error } = await supabase.from('appointments').insert({
    staff_id: req.user.id,
    customer_name,
    customer_id: customer_id || null,
    service, date, time,
    notes: notes || '',
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/staff/appointment/:id', requireStaff, async (req, res) => {
  const { error } = await supabase.from('appointments').delete()
    .eq('id', req.params.id).eq('staff_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
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
