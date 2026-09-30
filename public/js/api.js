// Thin fetch wrapper: attaches the bearer token, always returns parsed JSON, and throws a
// readable Error on failure so callers can just try/catch instead of checking response.ok everywhere.
const BASE = '/api';

export function getToken() { return localStorage.getItem('lh_token'); }
export function setSession(token, user) {
  localStorage.setItem('lh_token', token);
  localStorage.setItem('lh_user', JSON.stringify(user));
}
export function getCachedUser() {
  try { return JSON.parse(localStorage.getItem('lh_user') || 'null'); } catch { return null; }
}
export function clearSession() {
  localStorage.removeItem('lh_token');
  localStorage.removeItem('lh_user');
}

export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const token = getToken();
  const response = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  let json;
  try { json = await response.json(); }
  catch { throw new Error(`Server returned an unexpected response (${response.status}).`); }

  if (response.status === 401 && token) {
    clearSession();
    location.hash = '#/login';
  }
  if (!json.success) throw new Error(json.message || 'Something went wrong.');
  return json.data;
}

export const get = path => api(path);
export const post = (path, body) => api(path, { method: 'POST', body });
export const put = (path, body) => api(path, { method: 'PUT', body });
export const patch = (path, body) => api(path, { method: 'PATCH', body });
export const del = path => api(path, { method: 'DELETE' });
