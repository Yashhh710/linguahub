import { get, post, put, del, getCachedUser } from '../api.js';
import { renderShell } from '../shell.js';
import { icon } from '../icons.js';
import { showToast } from '../toast.js';

let cleanupFriendsRoute;

export async function renderFriends() {
  cleanupFriendsRoute?.();
  const view = renderShell('#/friends', 'Friends', 'Learn together, grow together');
  view.innerHTML = '<div class="card skeleton" style="height:320px"></div>';
  let activePeriod = 'week';
  let searchTimer;
  let friendQuery = '';
  let sortMode = 'xp';

  const refreshForSocketEvent = () => {
    if (view.isConnected) load();
  };
  const cleanup = () => {
    window.removeEventListener('linguahub:friends-changed', refreshForSocketEvent);
    window.removeEventListener('linguahub:route-changing', cleanup);
    clearTimeout(searchTimer);
    if (cleanupFriendsRoute === cleanup) cleanupFriendsRoute = null;
  };
  cleanupFriendsRoute = cleanup;
  window.addEventListener('linguahub:friends-changed', refreshForSocketEvent);
  window.addEventListener('linguahub:route-changing', cleanup, { once: true });

  async function load(period = activePeriod) {
    activePeriod = period;
    const [friendsResult, leaderboardResult, progressResult] = await Promise.allSettled([
      get('/friends'),
      get(`/leaderboard?scope=friends&period=${period === 'alltime' ? 'alltime' : 'week'}`),
      get('/progress')
    ]);
    const friendsData = friendsResult.status === 'fulfilled' ? friendsResult.value : {};
    const leaderboard = leaderboardResult.status === 'fulfilled' ? leaderboardResult.value : {};
    const progress = progressResult.status === 'fulfilled' ? progressResult.value : {};
    if (friendsResult.status === 'rejected') showToast(friendsResult.reason.message);
    draw(friendsData, leaderboard, progress);
  }

  function draw(friendsData, leaderboard, progress) {
    const friends = Array.isArray(friendsData?.friends) ? friendsData.friends : [];
    const incomingRequests = Array.isArray(friendsData?.incomingRequests) ? friendsData.incomingRequests : [];
    const outgoingRequests = Array.isArray(friendsData?.outgoingRequests) ? friendsData.outgoingRequests : [];
    const leaderboardRows = Array.isArray(leaderboard?.rows) ? leaderboard.rows : [];
    const recentActivity = Array.isArray(progress?.recent) ? progress.recent : [];
    const periodLabel = activePeriod === 'alltime' ? 'All time' : 'This week';

    view.innerHTML = `
      <div class="friends-page friends-dashboard">
        <div class="friends-layout friends-layout-reference">
          <main class="friends-main">
            <section class="friends-hero card">
              <div class="friends-hero-copy">
                <span class="friends-eyebrow">Your language-learning circle</span>
                <h2>Learn together,<br>grow together!</h2>
                <p>Connect with friends, compare progress, and keep each other moving.</p>
                <div class="friends-hero-actions">
                  <button class="btn" type="button" data-action="find-friends">${icon('friends', 14)} Find friends</button>
                  <button class="btn secondary" type="button" data-action="invite">${icon('plus', 14)} Invite friends</button>
                </div>
              </div>
              <img class="friends-hero-mascot" src="/assets/Friends.png" alt="Friends learning illustration">
            </section>

            <section class="card friends-list-panel friends-roster-panel">
              <div class="friends-panel-heading">
                <div class="friends-panel-title">
                  <span class="friends-panel-icon">${icon('friends', 16)}</span>
                  <h2>My Friends</h2>
                  <span class="friends-count">${friends.length}</span>
                </div>
                <div class="friends-roster-tools">
                  <button class="friends-refresh-button" type="button" data-action="refresh">Refresh</button>
                  <select id="friendSort" class="friends-sort" aria-label="Sort friends">
                    <option value="xp" ${sortMode === 'xp' ? 'selected' : ''}>XP</option>
                    <option value="streak" ${sortMode === 'streak' ? 'selected' : ''}>Streak</option>
                  </select>
                </div>
                <label class="friends-inline-search">
                  ${icon('search', 14)}
                  <input id="searchInput" type="search" value="${escapeHtml(friendQuery)}" placeholder="Search friends..." aria-label="Search learners by name or email">
                </label>
              </div>
              <div id="searchResults" class="friends-search-results"></div>
              <div class="friends-roster">
                ${friends.length ? friends.map(friend => friendCard(friend)).join('') : '<div class="empty-state compact"><h3>No friends yet</h3><p>Search for a learner or invite someone to connect.</p></div>'}
              </div>
              ${outgoingRequests.length ? `
                <div class="friends-outgoing">
                  <strong>Requests sent</strong>
                  ${outgoingRequests.map(request => `<span>${escapeHtml(request.name)} <small>Pending</small></span>`).join('')}
                </div>
              ` : ''}
            </section>

            <section class="card friends-activity-panel">
              <div class="friends-panel-heading">
                <div class="friends-panel-title">
                  <span class="friends-panel-icon">${icon('bolt', 15)}</span>
                  <h2>Your recent learning</h2>
                </div>
                <a class="link-button" href="#/progress">Progress ${icon('chevronRight', 12)}</a>
              </div>
              <div class="friends-activity-list">
                ${recentActivity.length ? recentActivity.slice(0, 3).map(item => `
                  <div class="friends-activity-row">
                    <span class="friends-activity-mark">${icon('learn', 14)}</span>
                    <span class="friends-activity-copy"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></span>
                    <time>${formatActivityTime(item.time)}</time>
                  </div>
                `).join('') : '<p class="friends-muted-empty">Your completed and started lessons will appear here.</p>'}
              </div>
            </section>
          </main>

          <aside class="friends-sidebar friends-sidebar-reference">
            <section class="card friends-requests-panel">
              <div class="friends-panel-heading">
                <div class="friends-panel-title">
                  <span class="friends-panel-icon">${icon('friends', 15)}</span>
                  <h2>Friend Requests</h2>
                  <span class="friends-count">${incomingRequests.length}</span>
                </div>
              </div>
              <div class="friends-request-list">
                ${incomingRequests.length ? incomingRequests.map(request => `
                  <article class="friends-request-row">
                    <span class="friends-avatar">${getInitials(request.name)}</span>
                    <span class="friends-request-copy"><strong>${escapeHtml(request.name)}</strong><small>${formatXp(request.xp || 0)} XP</small></span>
                    <div class="friends-request-actions">
                      <button class="btn small" type="button" data-accept-request="${escapeHtml(request.requestId)}">Accept</button>
                      <button class="btn secondary small" type="button" data-decline-request="${escapeHtml(request.requestId)}" aria-label="Decline ${escapeHtml(request.name)}">Decline</button>
                    </div>
                  </article>
                `).join('') : '<p class="friends-muted-empty">No new requests.</p>'}
              </div>
            </section>

            <section class="card friends-leaderboard-panel">
              <div class="friends-panel-heading">
                <div class="friends-panel-title">
                  <span class="friends-panel-icon">${icon('star', 15)}</span>
                  <h2>Friends leaderboard</h2>
                </div>
                <span class="friends-period-label">${periodLabel}</span>
              </div>
              <div class="friends-period-tabs" role="group" aria-label="Leaderboard period">
                <button class="${activePeriod === 'week' ? 'active' : ''}" type="button" data-period="week">This week</button>
                <button class="${activePeriod === 'alltime' ? 'active' : ''}" type="button" data-period="alltime">All time</button>
              </div>
              <ol class="friends-leaderboard-list">
                ${leaderboardRows.length ? leaderboardRows.slice(0, 5).map((row, index) => `
                  <li class="friends-leaderboard-row ${row.isMe ? 'is-me' : ''}">
                    <span class="friends-leaderboard-rank">${row.rank || index + 1}</span>
                    <span class="friends-avatar">${row.avatar ? `<img class="avatar-photo" src="${escapeHtml(row.avatar)}" alt="">` : getInitials(row.name)}</span>
                    <span class="friends-leaderboard-name">${escapeHtml(row.isMe ? 'You' : row.name)}</span>
                    <strong>${formatXp(row.xp || 0)} <small>XP</small></strong>
                  </li>
                `).join('') : '<li class="friends-muted-empty">No ranking data yet.</li>'}
              </ol>
            </section>

            <section class="friends-invite-panel">
              <div>
                <h2>Learning is better together!</h2>
                <p>Invite a friend and keep your streak alive.</p>
                <button class="btn" type="button" data-action="invite">Invite friends ${icon('chevronRight', 13)}</button>
              </div>
              <img src="/cute/cute-1.png" alt="LinguaHub mascot">
            </section>
          </aside>
        </div>
      </div>
    `;

    const searchInput = view.querySelector('#searchInput');
    const searchResults = view.querySelector('#searchResults');
    const roster = view.querySelector('.friends-roster');

    function renderRoster() {
      const matchingFriends = friends
        .filter(friend => `${friend.name || ''} ${friend.email || ''}`.toLowerCase().includes(friendQuery.toLowerCase()))
        .sort((first, second) => sortMode === 'streak'
          ? (second.currentStreak || 0) - (first.currentStreak || 0)
          : (second.xp || 0) - (first.xp || 0));
      roster.innerHTML = matchingFriends.length
        ? matchingFriends.map(friend => friendCard(friend)).join('')
        : friends.length
          ? '<p class="friends-muted-empty">No friends match this search.</p>'
          : '<div class="empty-state compact"><h3>No friends yet</h3><p>Search for a learner or invite someone to connect.</p></div>';
    }

    renderRoster();

    async function searchFriends() {
      const query = searchInput.value.trim();
      if (query.length < 2) {
        searchResults.innerHTML = query ? '<p class="friends-muted-empty">Enter at least 2 characters.</p>' : '';
        return;
      }
      try {
        const results = await get(`/friends/search?q=${encodeURIComponent(query)}`);
        if (searchInput.value.trim() !== query) return;
        const connectedIds = new Set([
          ...friends.map(friend => String(friend.id)),
          ...incomingRequests.map(request => String(request.id)),
          ...outgoingRequests.map(request => String(request.id))
        ]);
        const matches = (Array.isArray(results) ? results : []).filter(user => !connectedIds.has(String(user.id || user._id)));
        searchResults.innerHTML = matches.length ? matches.map(user => friendSearchCard(user)).join('') : '<p class="friends-muted-empty">No learners found.</p>';
        bindSearchActions();
      } catch (error) {
        searchResults.innerHTML = `<p class="friends-muted-empty">${escapeHtml(error.message)}</p>`;
      }
    }

    searchInput.addEventListener('input', () => {
      friendQuery = searchInput.value.trim();
      renderRoster();
      clearTimeout(searchTimer);
      searchTimer = setTimeout(searchFriends, 250);
    });
    searchInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') searchFriends();
    });

    roster.addEventListener('click', async event => {
      const button = event.target.closest('[data-remove-friend]');
      if (!button) return;
      button.disabled = true;
      try {
        await del(`/friends/${button.dataset.removeFriend}`);
        showToast('Friend removed');
        await load();
      } catch (error) {
        button.disabled = false;
        showToast(error.message);
      }
    });

    view.querySelector('#friendSort')?.addEventListener('change', event => {
      sortMode = event.currentTarget.value;
      renderRoster();
    });

    view.querySelector('[data-action="refresh"]')?.addEventListener('click', async event => {
      event.currentTarget.disabled = true;
      await load();
      showToast('Friends list updated');
    });

    view.querySelectorAll('[data-accept-request], [data-decline-request]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.hasAttribute('data-accept-request') ? 'accept' : 'decline';
        const requestId = button.dataset.acceptRequest || button.dataset.declineRequest;
        button.disabled = true;
        try {
          await put(`/friends/requests/${requestId}`, { action });
          showToast(action === 'accept' ? 'Friend request accepted' : 'Friend request declined');
          await load();
        } catch (error) {
          button.disabled = false;
          showToast(error.message);
        }
      });
    });

    view.querySelectorAll('[data-action="invite"]').forEach(button => {
      button.addEventListener('click', async () => {
        const inviteLink = `${location.origin}${location.pathname}#/register`;
        try {
          await navigator.clipboard.writeText(inviteLink);
          showToast('Invite link copied');
        } catch {
          showToast(inviteLink);
        }
      });
    });

    view.querySelector('[data-action="find-friends"]')?.addEventListener('click', () => searchInput.focus());
    view.querySelectorAll('[data-period]').forEach(button => {
      button.addEventListener('click', () => load(button.dataset.period));
    });
    bindSearchActions();
  }

  function bindSearchActions() {
    view.querySelectorAll('[data-add-friend]').forEach(button => {
      button.addEventListener('click', async () => {
        button.disabled = true;
        try {
          await post('/friends/requests', { userId: button.dataset.userId });
          showToast(`Request sent to ${button.dataset.name}`);
          await load();
        } catch (error) {
          button.disabled = false;
          showToast(error.message);
        }
      });
    });
  }

  await load();
}

function friendSearchCard(user) {
  const id = user._id || user.id;
  const name = user.name || 'User';
  const email = user.email || '';

  return `
    <article class="friend-search-card">
      <div class="search-card-header">
        <div class="mini-avatar">${getInitials(name)}</div>
        <div class="search-card-copy">
          <strong>${escapeHtml(name)}</strong>
          <span>${escapeHtml(email)}</span>
        </div>
      </div>
      <button class="btn small" type="button" data-add-friend data-user-id="${escapeHtml(id)}" data-name="${escapeHtml(name)}">Add Friend</button>
    </article>
  `;
}

function friendCard(friend) {
  return `
    <article class="friends-roster-row">
      <span class="friends-avatar">${getInitials(friend.name)}</span>
      <span class="friends-roster-name"><strong>${escapeHtml(friend.name)}</strong><small>${escapeHtml(friend.email || '')}</small></span>
      <span class="friends-roster-stat">${icon('bolt', 13)} ${formatXp(friend.xp || 0)} XP</span>
      <span class="friends-roster-stat">${icon('flame', 13)} ${friend.currentStreak || 0} day streak</span>
      <button class="friends-remove-button" type="button" data-remove-friend="${escapeHtml(friend.id)}">Remove</button>
    </article>
  `;
}

function formatActivityTime(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

function formatXp(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num.toLocaleString('en-US') : '0';
}

function getInitials(name) {
  return String(name || '').split(' ').slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}
