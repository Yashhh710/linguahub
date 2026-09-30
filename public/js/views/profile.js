import { get, patch, put } from '../api.js';
import { renderShell, signOut } from '../shell.js';
import { icon } from '../icons.js';
import { setUser } from '../state.js';
import { showToast } from '../toast.js';

const AVATAR_PRESETS = [
  { value: '/assets/pfp/avatar_maya.jpg', label: 'Maya' },
  { value: '/assets/pfp/avatar_sophie.jpg', label: 'Sophie' },
  { value: '/assets/pfp/avatar_yash.jpg', label: 'Yash' },
  { value: '/assets/pfp/cute-2.jpg', label: 'Cute' }
];

export async function renderProfile() {
  const view = renderShell('#/profile', 'Profile', 'Your account and preferences');
  const user = await get('/auth/me');
  setUser(user);
  let selectedAvatar = user.avatar || '';
  let savedAvatar = selectedAvatar;

  view.innerHTML = `
    <div class="grid grid-2" style="align-items:start">
      <section>
        <div class="card profile-identity">
          <div class="profile-identity-summary">
            <div class="avatar profile-avatar-preview" id="profileAvatarPreview">${avatarMarkup(selectedAvatar, user.name)}</div>
            <div><h2 style="font-size:20px">${escapeHtml(user.name)}</h2><p class="muted" style="margin-top:4px">Level ${user.level} · ${user.xp} XP</p></div>
          </div>
          <div class="profile-avatar-editor">
            <div class="profile-avatar-label">Profile picture</div>
            <div class="avatar-picker" role="group" aria-label="Choose a profile picture">
              ${AVATAR_PRESETS.map(preset => `<button type="button" class="pfp-option ${selectedAvatar === preset.value ? 'selected' : ''}" data-avatar="${preset.value}" aria-label="Use ${preset.label} avatar" aria-pressed="${selectedAvatar === preset.value}" title="${preset.label}"><img src="${preset.value}" alt=""></button>`).join('')}
              <button type="button" class="pfp-option pfp-initials ${selectedAvatar ? '' : 'selected'}" data-avatar="" aria-label="Use initials" aria-pressed="${!selectedAvatar}" title="Initials">${escapeHtml((user.name[0] || '?').toUpperCase())}</button>
              <label class="avatar-upload-option" title="Add a photo from your gallery">${icon('plus', 14)}<span>From gallery</span><input id="profilePhotoInput" type="file" accept="image/jpeg,image/png,image/webp"></label>
            </div>
            <div class="profile-avatar-save-row"><small id="avatarStatus" aria-live="polite">Choose a preset or add a photo.</small><button class="btn small" id="saveAvatarBtn" type="button" disabled>Save photo</button></div>
          </div>
        </div>

        <div class="section-head"><h2>Account details</h2></div>
        <form class="card" id="profileForm">
          <div class="field"><label>Name</label><input name="name" value="${escapeHtml(user.name)}"></div>
          <div class="field"><label>Native language</label><input name="nativeLanguage" value="${escapeHtml(user.nativeLanguage)}"></div>
          <div class="field"><label>Daily goal (minutes)</label><input name="dailyGoalMinutes" type="number" min="5" max="240" value="${user.dailyGoalMinutes}"></div>
          <button class="btn" type="submit">Save changes</button>
        </form>

        <div class="section-head"><h2>Reminders</h2></div>
        <div class="card" style="display:flex;justify-content:space-between;align-items:center">
          <div><b>Daily practice reminder</b><p class="muted" style="margin-top:4px">A push notification if you haven't practiced yet.</p></div>
          <label style="display:flex;align-items:center;gap:8px">
            <input type="checkbox" id="reminderToggle" ${user.reminder?.enabled ? 'checked' : ''}> On
          </label>
        </div>
      </section>

      <section>
        <div class="section-head"><h2>Change password</h2></div>
        <form class="card" id="passwordForm">
          <div class="field"><label>Current password</label><input name="currentPassword" type="password" required></div>
          <div class="field"><label>New password</label><input name="newPassword" type="password" minlength="8" required></div>
          <div class="error-banner" id="pwErr"></div>
          <button class="btn secondary" type="submit">Update password</button>
        </form>

        <div class="section-head"><h2>Statistics</h2></div>
        <div class="grid grid-2">
          <div class="card"><div class="muted">Total XP</div><h3 style="font-size:26px;margin-top:6px">${user.xp}</h3></div>
          <div class="card"><div class="muted">Level</div><h3 style="font-size:26px;margin-top:6px">${user.level}</h3></div>
        </div>

        <button class="btn danger full" id="signOutBtn" style="margin-top:22px">Sign out</button>
      </section>
    </div>
  `;

  const avatarPreview = view.querySelector('#profileAvatarPreview');
  const avatarStatus = view.querySelector('#avatarStatus');
  const saveAvatarButton = view.querySelector('#saveAvatarBtn');

  function updateAvatarPreview(status = 'Choose a preset or add a photo.') {
    avatarPreview.innerHTML = avatarMarkup(selectedAvatar, user.name);
    view.querySelectorAll('.pfp-option').forEach(button => {
      const isSelected = button.dataset.avatar === selectedAvatar;
      button.classList.toggle('selected', isSelected);
      button.setAttribute('aria-pressed', String(isSelected));
    });
    saveAvatarButton.disabled = selectedAvatar === savedAvatar;
    avatarStatus.textContent = status;
  }

  view.querySelectorAll('.pfp-option').forEach(button => button.addEventListener('click', () => {
    selectedAvatar = button.dataset.avatar || '';
    updateAvatarPreview(selectedAvatar === (user.avatar || '') ? 'Current profile picture.' : 'Ready to save this picture.');
  }));

  view.querySelector('#profilePhotoInput').addEventListener('change', async event => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('Choose an image smaller than 10 MB.');
      return;
    }
    try {
      selectedAvatar = await compressAvatar(file);
      updateAvatarPreview('Gallery photo ready to save.');
    } catch {
      showToast('That photo could not be loaded. Choose another image.');
    }
  });

  saveAvatarButton.addEventListener('click', async () => {
    saveAvatarButton.disabled = true;
    saveAvatarButton.textContent = 'Saving...';
    try {
      const updated = await patch('/auth/me', { avatar: selectedAvatar });
      setUser(updated);
      selectedAvatar = updated.avatar || '';
      savedAvatar = selectedAvatar;
      updateAvatarPreview('Profile picture saved.');
      showToast('Profile picture updated');
    } catch (error) {
      saveAvatarButton.disabled = false;
      avatarStatus.textContent = error.message;
    } finally {
      saveAvatarButton.textContent = 'Save photo';
    }
  });

  view.querySelector('#profileForm').addEventListener('submit', async e => {
    e.preventDefault();
    const data = new FormData(e.target);
    const updated = await patch('/auth/me', {
      name: data.get('name'), nativeLanguage: data.get('nativeLanguage'), dailyGoalMinutes: Number(data.get('dailyGoalMinutes'))
    });
    setUser(updated);
    showToast('Profile updated');
  });

  view.querySelector('#reminderToggle').addEventListener('change', async e => {
    await put('/auth/me/reminder', { enabled: e.target.checked });
    showToast(e.target.checked ? 'Reminders on' : 'Reminders off');
  });

  view.querySelector('#passwordForm').addEventListener('submit', async e => {
    e.preventDefault();
    const err = view.querySelector('#pwErr');
    const data = new FormData(e.target);
    try {
      await put('/auth/me/password', { currentPassword: data.get('currentPassword'), newPassword: data.get('newPassword') });
      showToast('Password updated');
      e.target.reset();
      err.classList.remove('show');
    } catch (error) { err.textContent = error.message; err.classList.add('show'); }
  });

  view.querySelector('#signOutBtn').addEventListener('click', signOut);
}
function avatarMarkup(avatar, name) {
  if (avatar) return `<img class="avatar-photo" src="${escapeHtml(avatar)}" alt="">`;
  return escapeHtml((name || '?').trim()[0]?.toUpperCase() || '?');
}
async function compressAvatar(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.82, 0.72, 0.62, 0.52]) {
    const result = canvas.toDataURL('image/jpeg', quality);
    if (result.length <= 145000) return result;
  }
  throw new Error('Image is too large after resizing.');
}
function escapeHtml(v) { return String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
