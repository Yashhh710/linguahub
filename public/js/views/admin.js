import { get, put } from '../api.js';
import { renderShell } from '../shell.js';
import { skeletonFor } from '../skeleton.js';
import { showToast } from '../toast.js';

export async function renderAdmin() {
  const view = renderShell('#/admin', 'Admin', 'Platform overview and user management');
  view.innerHTML = skeletonFor('admin');

  const [stats, users] = await Promise.all([get('/admin/stats'), get('/admin/users')])
    .catch(err => { view.innerHTML = `<div class="empty">${err.message}</div>`; throw err; });

  view.innerHTML = `
    <div class="grid grid-4">
      ${stat(stats.users, 'Users')}
      ${stat(stats.students, 'Students')}
      ${stat(stats.lessons, 'Lessons')}
      ${stat(stats.attempts, 'Quiz attempts')}
    </div>
    <div class="section-head"><h2>Users</h2></div>
    <div class="card">
      ${users.map(u => `
        <div class="list-row">
          <div class="grow"><b>${escapeHtml(u.name)}</b><div class="muted">${escapeHtml(u.email)}</div></div>
          <select data-user="${u._id}" style="border:1.5px solid var(--line);border-radius:8px;padding:6px 10px">
            ${['student', 'teacher', 'admin'].map(r => `<option value="${r}" ${r === u.role ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
        </div>`).join('')}
    </div>
  `;

  view.querySelectorAll('select[data-user]').forEach(select => select.addEventListener('change', async () => {
    try { await put(`/admin/users/${select.dataset.user}/role`, { role: select.value }); showToast('Role updated'); }
    catch (error) { showToast(error.message); }
  }));
}
function stat(value, label) { return `<div class="card"><h3 style="font-size:24px">${value}</h3><div class="label" style="color:var(--ink-soft);font-size:12.5px;font-weight:600;margin-top:4px">${label}</div></div>`; }
function escapeHtml(v) { return String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
