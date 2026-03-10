const BASE = '/api';

export async function apiFetch(path, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Napaka strežnika');
  return data;
}
