/**
 * จานเด็ด SPU - แอปพลิเคชันหลัก (Main Application Engine)
 * ทำงานได้แบบ Standalone 100% เปิดไฟล์ index.html เข้าใช้งานได้ทันที
 */

// ============================================================================
// 1. Data Store & LocalStorage Synchronization
// ============================================================================

const STORAGE_KEYS = {
  SETTINGS: 'spu_food_settings',
  RESTAURANTS: 'spu_food_restaurants',
  REVIEWS: 'spu_food_reviews',
  NEWS: 'spu_food_news',
  USERS: 'spu_food_users',
  CURRENT_USER: 'spu_food_current_user',
  DARK_MODE: 'spu_food_dark_mode',
  ANALYTICS: 'spu_food_analytics'
};

class Store {
  static get(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.warn(`Error reading ${key} from localStorage:`, e);
      return fallback;
    }
  }

  static set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn(`Error writing ${key} to localStorage:`, e);
    }
  }

  static init() {
    const DATA_VERSION = 'spu_v5_backend_analytics';
    const currentVer = localStorage.getItem('spu_data_version');
    if (currentVer !== DATA_VERSION) {
      Store.reset();
      localStorage.setItem('spu_data_version', DATA_VERSION);
      return;
    }

    if (!localStorage.getItem(STORAGE_KEYS.RESTAURANTS)) {
      Store.set(STORAGE_KEYS.RESTAURANTS, INITIAL_RESTAURANTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
      Store.set(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NEWS)) {
      Store.set(STORAGE_KEYS.NEWS, INITIAL_NEWS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      Store.set(STORAGE_KEYS.USERS, INITIAL_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      Store.set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      Store.set(STORAGE_KEYS.CURRENT_USER, null);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ANALYTICS)) {
      Store.set(STORAGE_KEYS.ANALYTICS, {
        pageViews: 1,
        uniqueVisitors: 1,
        dailyVisits: {},
        lastVisit: new Date().toISOString()
      });
    }
  }

  static reset() {
    Store.set(STORAGE_KEYS.RESTAURANTS, INITIAL_RESTAURANTS);
    Store.set(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
    Store.set(STORAGE_KEYS.NEWS, INITIAL_NEWS);
    Store.set(STORAGE_KEYS.USERS, INITIAL_USERS);
    Store.set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    Store.set(STORAGE_KEYS.CURRENT_USER, null);
    Store.set(STORAGE_KEYS.ANALYTICS, {
      pageViews: 1,
      uniqueVisitors: 1,
      dailyVisits: {},
      lastVisit: new Date().toISOString()
    });
  }
}

// Initialize Storage
Store.init();

// ============================================================================
// 1.1 Visitor Analytics & Backend Sync Engine (นับจำนวนคนเข้าชมเว็บ)
// ============================================================================

function getAnalytics() {
  return Store.get(STORAGE_KEYS.ANALYTICS, {
    pageViews: 1,
    uniqueVisitors: 1,
    dailyVisits: {},
    lastVisit: new Date().toISOString()
  });
}

function updatePublicVisitorUI(analytics) {
  const publicCountEl = document.getElementById('publicVisitorCount');
  if (publicCountEl && analytics && analytics.pageViews) {
    publicCountEl.textContent = analytics.pageViews.toLocaleString();
  }
  const publicUniqueEl = document.getElementById('publicUniqueVisitorCount');
  if (publicUniqueEl && analytics && analytics.uniqueVisitors) {
    publicUniqueEl.textContent = analytics.uniqueVisitors.toLocaleString();
  }
}

function syncCloudCounter(analytics, isNewVisitor) {
  // Public real-world multi-client visitor counter API for production hosting
  try {
    fetch('https://api.counterapi.dev/v1/spu-canteen-dishes-review/visits/up')
      .then(res => {
        if (!res.ok) throw new Error('CounterAPI HTTP ' + res.status);
        return res.json();
      })
      .then(cloudData => {
        if (cloudData && typeof cloudData.count === 'number') {
          analytics.pageViews = Math.max(analytics.pageViews || 0, cloudData.count);
          Store.set(STORAGE_KEYS.ANALYTICS, analytics);
          updatePublicVisitorUI(analytics);
        }
      })
      .catch(() => {});

    if (isNewVisitor) {
      fetch('https://api.counterapi.dev/v1/spu-canteen-dishes-review/uniques/up')
        .then(res => {
          if (!res.ok) throw new Error('CounterAPI HTTP ' + res.status);
          return res.json();
        })
        .then(uData => {
          if (uData && typeof uData.count === 'number') {
            analytics.uniqueVisitors = Math.max(analytics.uniqueVisitors || 0, uData.count);
            Store.set(STORAGE_KEYS.ANALYTICS, analytics);
            updatePublicVisitorUI(analytics);
          }
        })
        .catch(() => {});
    }
  } catch (e) {}
}

function trackVisitorHit() {
  const analytics = getAnalytics();
  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  // Track Unique Visitor using local UUID
  let visitorUuid = localStorage.getItem('spu_visitor_uuid');
  let isNewVisitor = false;
  if (!visitorUuid) {
    visitorUuid = 'vis_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    localStorage.setItem('spu_visitor_uuid', visitorUuid);
    analytics.uniqueVisitors = (analytics.uniqueVisitors || 0) + 1;
    isNewVisitor = true;
  }

  // Increment Page Views
  analytics.pageViews = (analytics.pageViews || 0) + 1;
  if (!analytics.dailyVisits) analytics.dailyVisits = {};
  analytics.dailyVisits[todayStr] = (analytics.dailyVisits[todayStr] || 0) + 1;
  analytics.lastVisit = new Date().toISOString();

  Store.set(STORAGE_KEYS.ANALYTICS, analytics);
  updatePublicVisitorUI(analytics);

  // If running via HTTP/HTTPS, attempt Node REST API first
  if (window.location.protocol.startsWith('http')) {
    try {
      fetch('/api/visitors/hit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorUuid,
          isNewVisitor,
          page: window.location.pathname,
          referrer: document.referrer || 'direct'
        })
      }).then(res => {
        if (!res.ok) throw new Error('Localhost backend not responding: ' + res.status);
        return res.json();
      }).then(data => {
        if (data && data.pageViews) {
          analytics.pageViews = data.pageViews;
          analytics.uniqueVisitors = data.uniqueVisitors;
          Store.set(STORAGE_KEYS.ANALYTICS, analytics);
          updatePublicVisitorUI(analytics);
        }
      }).catch(() => {
        // Fallback to Cloud Counter if Node server isn't running or on public web host
        syncCloudCounter(analytics, isNewVisitor);
      });
    } catch (e) {
      syncCloudCounter(analytics, isNewVisitor);
    }
  } else {
    // Standalone file:// mode -> sync with Cloud Counter if network is accessible
    syncCloudCounter(analytics, isNewVisitor);
  }
}

// ============================================================================
// 2. Sound Effects Engine (Web Audio API Synthesizer - Zero External Files!)
// ============================================================================

class SoundFX {
  static ctx = null;

  static init() {
    if (!SoundFX.ctx && (window.AudioContext || window.webkitAudioContext)) {
      SoundFX.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  static playTick() {
    try {
      SoundFX.init();
      if (!SoundFX.ctx) return;
      const osc = SoundFX.ctx.createOscillator();
      const gain = SoundFX.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, SoundFX.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, SoundFX.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, SoundFX.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(SoundFX.ctx.destination);
      osc.start();
      osc.stop(SoundFX.ctx.currentTime + 0.05);
    } catch (e) {}
  }

  static playWin() {
    try {
      SoundFX.init();
      if (!SoundFX.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = SoundFX.ctx.createOscillator();
        const gain = SoundFX.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, SoundFX.ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.12, SoundFX.ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, SoundFX.ctx.currentTime + idx * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(SoundFX.ctx.destination);
        osc.start(SoundFX.ctx.currentTime + idx * 0.1);
        osc.stop(SoundFX.ctx.currentTime + idx * 0.1 + 0.3);
      });
    } catch (e) {}
  }

  static playMatch() {
    try {
      SoundFX.init();
      if (!SoundFX.ctx) return;
      const osc = SoundFX.ctx.createOscillator();
      const gain = SoundFX.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, SoundFX.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, SoundFX.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, SoundFX.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, SoundFX.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(SoundFX.ctx.destination);
      osc.start();
      osc.stop(SoundFX.ctx.currentTime + 0.2);
    } catch (e) {}
  }
}

// ============================================================================
// 3. UI Helpers & Toast Notification System
// ============================================================================

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'info') icon = 'ℹ️';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

function closeModalOnBackdrop(event, backdropElement) {
  if (event.target === backdropElement) {
    backdropElement.classList.remove('active');
  }
}

// ============================================================================
// 4. State Management
// ============================================================================

let currentFilterTag = 'all';
let currentDetailRestaurantId = null;
let currentReviewRating = 5;

// Current User Helpers
function getCurrentUser() {
  return Store.get(STORAGE_KEYS.CURRENT_USER, null);
}

function grantAdminFullRewards(user) {
  if (!user || user.role !== 'admin') return;

  const allFrameIds = PROFILE_FRAMES.map(f => f.id);
  const allTitles = [
    "นักชิมมือใหม่",
    "SPU Food Master",
    ...WEEKLY_REWARDS_CALENDAR.map(w => w.title),
    "เซียนรีวิวอาหาร",
    "ฮีโร่โรงอาหาร"
  ];
  const allBadgeIds = BADGES_LIST.map(b => b.id);

  user.unlockedFrames = Array.from(new Set([...(user.unlockedFrames || []), ...allFrameIds]));
  user.unlockedTitles = Array.from(new Set([...(user.unlockedTitles || []), ...allTitles]));
  user.badges = Array.from(new Set([...(user.badges || []), ...allBadgeIds]));

  // Sync to USERS in local storage
  const users = Store.get(STORAGE_KEYS.USERS, INITIAL_USERS);
  const idx = users.findIndex(u => u.id === user.id);
  if (idx > -1) {
    users[idx] = { ...users[idx], ...user };
    Store.set(STORAGE_KEYS.USERS, users);
  }
}

function setCurrentUser(user) {
  if (user && user.role === 'admin') {
    grantAdminFullRewards(user);
  }
  Store.set(STORAGE_KEYS.CURRENT_USER, user);
  renderNavUser();
  if (typeof renderDailyCheckIn === 'function') renderDailyCheckIn();
  if (typeof renderLeaderboard === 'function') renderLeaderboard();
  if (typeof renderAdminOnlyButtons === 'function') renderAdminOnlyButtons();
}

function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === 'admin';
}

function requireAuth(actionName = "ทำรายการนี้") {
  const user = getCurrentUser();
  if (!user) {
    showToast(`กรุณาเข้าสู่ระบบก่อนเพื่อ${actionName}`, 'info');
    openAuthModal();
    return false;
  }
  return true;
}

// ============================================================================
// 5. Theme & Festival System
// ============================================================================

function applyTheme(themeId) {
  const settings = Store.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  settings.activeTheme = themeId;
  Store.set(STORAGE_KEYS.SETTINGS, settings);

  const themeConfig = THEMES[themeId] || THEMES['spu-classic'];
  document.documentElement.setAttribute('data-festival', themeId);

  // Update Ticker Pill
  const pillIcon = document.getElementById('themePillIcon');
  const pillName = document.getElementById('themePillName');
  if (pillIcon && pillName) {
    pillIcon.textContent = themeConfig.icon;
    pillName.textContent = themeConfig.name;
  }

  // Update Brand Logo Icon
  const brandIcon = document.getElementById('brandLogoIcon');
  if (brandIcon) {
    brandIcon.textContent = themeConfig.particleEmoji;
  }

  // Render Festival Falling Particles
  renderFestivalParticles(themeConfig.particleEmoji);
}

function renderFestivalParticles(emoji = '🍛') {
  const container = document.getElementById('festivalParticles');
  if (!container) return;
  container.innerHTML = '';

  const particleCount = 14;
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.textContent = emoji;
    particle.style.left = `${Math.random() * 95}%`;
    particle.style.fontSize = `${1.2 + Math.random() * 1.5}rem`;
    particle.style.animationDuration = `${8 + Math.random() * 8}s`;
    particle.style.animationDelay = `${Math.random() * 5}s`;
    container.appendChild(particle);
  }
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark-mode');
  document.documentElement.setAttribute('data-theme-mode', isDark ? 'dark' : 'light');
  Store.set(STORAGE_KEYS.DARK_MODE, isDark);
  
  const toggleBtn = document.getElementById('themeToggleBtn');
  if (toggleBtn) {
    toggleBtn.textContent = isDark ? '☀️' : '🌙';
  }
}

function initDarkMode() {
  const savedDark = Store.get(STORAGE_KEYS.DARK_MODE, false);
  if (savedDark) {
    document.body.classList.add('dark-mode');
    document.documentElement.setAttribute('data-theme-mode', 'dark');
    const toggleBtn = document.getElementById('themeToggleBtn');
    if (toggleBtn) toggleBtn.textContent = '☀️';
  }
}

// ============================================================================
// 6. Navigation & User Header
// ============================================================================

function renderNavUser() {
  const container = document.getElementById('navUserContainer');
  if (!container) return;

  const user = getCurrentUser();
  if (user) {
    const adminPill = user.role === 'admin'
      ? `<button type="button" class="btn btn-sm btn-admin" onclick="openAdminModal()" title="แผงควบคุมระบบ (เข้าถึงได้เฉพาะแอดมิน)" style="font-size: 0.8rem; padding: 0.35rem 0.65rem;">
           👑 แผงแอดมิน
         </button>`
      : '';

    container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        ${adminPill}
        <button type="button" class="user-menu-btn" onclick="openProfileModal()">
          <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" class="user-avatar ${user.equippedFrame || ''}" alt="${user.name}">
          <span style="font-weight: 700; font-size: 0.875rem; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${user.name}
          </span>
          <span class="user-title-badge">🎖️ ${user.customTitle || 'นักชิมมือใหม่'}</span>
        </button>
        <button type="button" class="btn btn-sm btn-outline" onclick="handleLogout()" title="ออกจากระบบ">
          🚪
        </button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button type="button" class="btn btn-sm btn-primary" onclick="openAuthModal()">
        🔑 เข้าสู่ระบบ
      </button>
    `;
  }

  // Update dynamic admin-only buttons on the page
  renderAdminOnlyButtons();
}

function renderAdminOnlyButtons() {
  const rstSlot = document.getElementById('adminAddRestaurantSlot');
  const newsSlot = document.getElementById('adminAddNewsSlot');
  const resetSlot = document.getElementById('footerAdminResetSlot');

  if (resetSlot) {
    resetSlot.style.display = isAdmin() ? 'list-item' : 'none';
  }

  if (isAdmin()) {
    if (rstSlot) {
      rstSlot.innerHTML = `
        <button type="button" class="btn btn-outline btn-sm" onclick="openAddRestaurantModal()">
          ➕ เสนอร้านอาหารใหม่ (Admin)
        </button>
      `;
    }
    if (newsSlot) {
      newsSlot.innerHTML = `
        <button type="button" class="btn btn-outline btn-sm" onclick="openAddNewsModal()">
          📢 แอดมินเพิ่มข่าวใหม่
        </button>
      `;
    }
  } else {
    if (rstSlot) rstSlot.innerHTML = '';
    if (newsSlot) newsSlot.innerHTML = '';
  }

  // Refresh empty state when auth status changes
  const allRestaurants = Store.get(STORAGE_KEYS.RESTAURANTS, INITIAL_RESTAURANTS);
  if (allRestaurants.length === 0) {
    if (typeof filterRestaurants === 'function') filterRestaurants();
    if (typeof drawWheel === 'function') drawWheel();
  }
}

function openAdminAccessModal() {
  const errBox = document.getElementById('adminLoginError');
  if (errBox) errBox.style.display = 'none';
  const pwdInput = document.getElementById('adminLoginPassword');
  if (pwdInput) pwdInput.value = '';
  openModal('adminAccessModal');
}

function handleAdminLoginSubmit(event) {
  event.preventDefault();
  const emailInput = document.getElementById('adminLoginEmail')?.value.trim();
  const passwordInput = document.getElementById('adminLoginPassword')?.value;
  const errBox = document.getElementById('adminLoginError');

  const users = Store.get(STORAGE_KEYS.USERS, INITIAL_USERS);
  const adminUser = users.find(u => 
    u.email.toLowerCase() === emailInput.toLowerCase() && 
    u.password === passwordInput && 
    u.role === 'admin'
  );

  if (adminUser) {
    setCurrentUser(adminUser);
    closeModal('adminAccessModal');
    if (errBox) errBox.style.display = 'none';
    SoundFX.playWin();
    showToast(`🔓 เข้าสู่ระบบผู้ดูแลเรียบร้อย ยินดีต้อนรับคุณ ${adminUser.name}!`, 'success');
    setTimeout(() => openAdminModal(), 200);
  } else {
    if (errBox) errBox.style.display = 'block';
    SoundFX.playTick();
  }
}

function openAuthModal() {
  initGoogleSignIn();
  openModal('authModal');
}

function switchAuthTab(tabId, btn) {
  document.querySelectorAll('#authModal .tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#authModal .tab-pane').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const target = document.getElementById(tabId);
  if (target) target.classList.add('active');
}

function handleLoginSubmit(event) {
  event.preventDefault();
  const email = (document.getElementById('loginEmail')?.value || '').trim();
  const password = document.getElementById('loginPassword')?.value || '';

  const users = Store.get(STORAGE_KEYS.USERS, INITIAL_USERS);
  const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

  if (found) {
    setCurrentUser(found);
    closeModal('authModal');
    // Clear inputs
    const elEmail = document.getElementById('loginEmail');
    const elPass = document.getElementById('loginPassword');
    if (elEmail) elEmail.value = '';
    if (elPass) elPass.value = '';
    SoundFX.playWin();
    showToast(`ยินดีต้อนรับคุณ ${found.name}! เข้าสู่ระบบสำเร็จ`, 'success');
  } else {
    SoundFX.playTick();
    showToast('อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง', 'error');
  }
}

function handleRegisterSubmit(event) {
  event.preventDefault();
  const name = (document.getElementById('regName')?.value || '').trim();
  const email = (document.getElementById('regEmail')?.value || '').trim();
  const userType = document.getElementById('regUserType')?.value || 'นักศึกษา';
  const studentId = (document.getElementById('regStudentId')?.value || '').trim() || (userType === 'นักศึกษา' ? '67' + Math.floor(100000 + Math.random() * 900000) : 'SPU-' + Math.floor(1000 + Math.random() * 9000));
  const faculty = document.getElementById('regFaculty')?.value || (userType === 'นักศึกษา' ? 'คณะเทคโนโลยีสารสนเทศ' : 'สำนักวิชาการ / ส่วนกลาง');
  const phone = (document.getElementById('regPhone')?.value || '').trim() || '-';
  const password = document.getElementById('regPassword')?.value || '';

  if (password.length < 8) {
    showToast('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร', 'error');
    return;
  }

  const users = Store.get(STORAGE_KEYS.USERS, INITIAL_USERS);
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    showToast('อีเมลนี้ถูกใช้งานแล้วในระบบ กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ', 'error');
    return;
  }

  const nowStr = new Date().toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });

  const newUser = {
    id: `usr_${Date.now()}`,
    name,
    studentId,
    faculty,
    phone,
    email,
    password,
    role: email.toLowerCase().includes('admin') ? 'admin' : 'student',
    userType,
    status: 'อนุมัติแล้ว',
    applicationNotes: 'สมัครผ่านระบบเว็บไซต์ จานเด็ด SPU',
    avatar: `https://images.unsplash.com/photo-${1534528741775 + (users.length % 100)}?w=150&auto=format&fit=crop&q=80`,
    badges: ["newbie"],
    favorites: [],
    checkInStreak: 0,
    lastCheckInDate: null,
    unlockedFrames: ["frame-none"],
    equippedFrame: "frame-none",
    customTitle: "นักชิมมือใหม่",
    unlockedTitles: ["นักชิมมือใหม่"],
    createdAt: nowStr
  };

  users.push(newUser);
  Store.set(STORAGE_KEYS.USERS, users);
  setCurrentUser(newUser);
  closeModal('authModal');
  SoundFX.playWin();
  showToast(`สมัครสมาชิกสำเร็จ! ยินดีต้อนรับคุณ ${name} สู่จานเด็ด SPU 🎉`, 'success');
  renderLeaderboard();

  // If connected to localhost backend server, notify REST API
  if (window.location.protocol.startsWith('http')) {
    try {
      fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      }).catch(() => {});
    } catch (e) {}
  }
}

// ----------------------------------------------------------------------------
// Google Cloud Console OAuth 2.0 & Identity Services (GIS)
// ----------------------------------------------------------------------------

function initGoogleSignIn() {
  const settings = Store.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  const clientId = settings.googleClientId ? settings.googleClientId.trim() : "";
  const statusBadge = document.getElementById('googleClientIdStatus');

  if (statusBadge) {
    if (clientId) {
      statusBadge.innerHTML = `🟢 Google OAuth: <strong title="${clientId}">${clientId.substring(0, 16)}...</strong>`;
    } else {
      statusBadge.innerHTML = `⚠️ Google Client ID: <em>ยังไม่ได้ตั้งค่า</em>`;
    }
  }

  const slot = document.getElementById('googleSignInButtonSlot');
  const customBtn = document.getElementById('googleCustomSignInBtn');

  // If Client ID is provided and GIS library is loaded
  if (clientId && window.google && window.google.accounts && window.google.accounts.id) {
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      });

      if (slot) {
        slot.innerHTML = '';
        window.google.accounts.id.renderButton(slot, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          logo_alignment: 'left',
          width: 280
        });
        slot.style.display = 'flex';
      }
      if (customBtn) customBtn.style.display = 'none';
    } catch (err) {
      console.warn("GIS notice (likely running via file:/// origin):", err);
      if (slot) slot.style.display = 'none';
      if (customBtn) customBtn.style.display = 'flex';
    }
  } else {
    if (slot) {
      slot.innerHTML = '';
      slot.style.display = 'none';
    }
    if (customBtn) customBtn.style.display = 'flex';
  }
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.warn("Error decoding Google JWT:", e);
    return null;
  }
}

function handleGoogleCredentialResponse(response) {
  if (!response || !response.credential) {
    showToast('การเชื่อมต่อกับบัญชี Google ล้มเหลว กรุณาลองใหม่อีกครั้ง', 'error');
    return;
  }
  const payload = parseJwt(response.credential);
  if (!payload || !payload.email) {
    showToast('ไม่สามารถดึงข้อมูลบัญชี Google ได้ กรุณาลองใหม่อีกครั้ง', 'error');
    return;
  }

  processGoogleUser({
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
    avatar: payload.picture || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
    googleSub: payload.sub
  });
}

function triggerGoogleSignIn() {
  const settings = Store.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  const clientId = settings.googleClientId ? settings.googleClientId.trim() : "";

  // If running on a web origin with Client ID configured, prompt GIS One Tap
  if (clientId && window.google?.accounts?.id && window.location.protocol.startsWith('http')) {
    try {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          promptSimulatedGoogleLogin();
        }
      });
      return;
    } catch (e) {
      console.warn("GIS prompt fallback:", e);
    }
  }

  promptSimulatedGoogleLogin();
}

function promptSimulatedGoogleLogin() {
  const emailInput = prompt("🔑 เข้าสู่ระบบด้วย Google Cloud Console\n\nกรุณาระบุอีเมล Google ของคุณ (เช่น somchai@spu.ac.th):", "student@spu.ac.th");
  if (!emailInput || !emailInput.trim()) return;

  const email = emailInput.trim();
  const defaultName = email.split('@')[0];
  const nameInput = prompt(`👤 ชื่อที่ต้องการให้แสดงในระบบจานเด็ด SPU:`, defaultName) || defaultName;

  processGoogleUser({
    email: email,
    name: nameInput.trim(),
    avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`
  });
}

function processGoogleUser(profile) {
  const users = Store.get(STORAGE_KEYS.USERS, INITIAL_USERS);
  const emailLower = profile.email.toLowerCase();
  let user = users.find(u => u.email.toLowerCase() === emailLower);

  if (!user) {
    const nowStr = new Date().toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
    user = {
      id: `usr_g_${Date.now()}`,
      name: profile.name || profile.email.split('@')[0],
      studentId: emailLower.endsWith('@spu.ac.th') ? '67' + Math.floor(100000 + Math.random() * 900000) : 'SPU-G-' + Date.now().toString().slice(-4),
      faculty: emailLower.endsWith('@spu.ac.th') ? 'คณะเทคโนโลยีสารสนเทศ (Google Account)' : 'บุคคลทั่วไป / ผู้มาเยือน',
      phone: '-',
      status: 'อนุมัติแล้ว',
      applicationNotes: 'เข้าสู่ระบบด้วย Google Cloud Console OAuth 2.0',
      email: profile.email,
      password: '',
      role: emailLower.includes('admin') ? 'admin' : 'student',
      userType: emailLower.endsWith('@spu.ac.th') ? 'นักศึกษา' : 'บุคคลทั่วไป',
      avatar: profile.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
      badges: ["newbie"],
      favorites: [],
      checkInStreak: 0,
      lastCheckInDate: null,
      unlockedFrames: ["frame-none"],
      equippedFrame: "frame-none",
      customTitle: "นักชิมมือใหม่",
      unlockedTitles: ["นักชิมมือใหม่"],
      createdAt: nowStr
    };
    users.push(user);
    Store.set(STORAGE_KEYS.USERS, users);
  } else {
    // Preserve existing user streak, check-in, and rewards! Only update avatar if needed
    if (profile.avatar && (!user.avatar || user.avatar.includes('photo-1534528741775'))) {
      user.avatar = profile.avatar;
      Store.set(STORAGE_KEYS.USERS, users);
    }
  }

  setCurrentUser(user);
  closeModal('authModal');
  SoundFX.playWin();
  showToast(`เข้าสู่ระบบด้วย Google สำเร็จ! ยินดีต้อนรับคุณ ${user.name} 🎉`, 'success');
}

function openGoogleConfigModal() {
  const settings = Store.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  const input = document.getElementById('googleConfigClientIdInput');
  if (input) input.value = settings.googleClientId || '';
  openModal('googleConfigModal');
}

function saveGoogleConfigClientId() {
  const input = document.getElementById('googleConfigClientIdInput');
  if (!input) return;
  const newClientId = input.value.trim();
  const settings = Store.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  settings.googleClientId = newClientId;
  Store.set(STORAGE_KEYS.SETTINGS, settings);
  initGoogleSignIn();
  closeModal('googleConfigModal');
  SoundFX.playWin();
  showToast('บันทึก Google Cloud Console Web Client ID สำเร็จเรียบร้อย!', 'success');
}

function saveGoogleClientIdFromAdmin() {
  if (!isAdmin()) return;
  const input = document.getElementById('adminGoogleClientIdInput');
  if (!input) return;
  const newClientId = input.value.trim();
  const settings = Store.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  settings.googleClientId = newClientId;
  Store.set(STORAGE_KEYS.SETTINGS, settings);
  initGoogleSignIn();
  SoundFX.playWin();
  showToast('บันทึก Google OAuth 2.0 Web Client ID จากการตั้งค่าแอดมินเรียบร้อย!', 'success');
}

// Fallback stubs for backward compatibility
function demoLogin(role) {
  if (role === 'admin') {
    openAdminAccessModal();
  } else {
    openAuthModal();
  }
}

function mockGoogleLogin() {
  triggerGoogleSignIn();
}

function handleLogout() {
  Store.set(STORAGE_KEYS.CURRENT_USER, null);
  renderNavUser();
  if (typeof renderDailyCheckIn === 'function') renderDailyCheckIn();
  if (typeof renderLeaderboard === 'function') renderLeaderboard();
  if (typeof renderAdminOnlyButtons === 'function') renderAdminOnlyButtons();
  closeModal('profileModal');
  showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
}

// ============================================================================
// 7. Restaurant Directory & Search / Filter Engine
// ============================================================================

function populateFilterDropdowns() {
  const locationSelect = document.getElementById('locationFilter');
  const wheelLocationSelect = document.getElementById('wheelLocationSelect');
  const rstLocation = document.getElementById('rstLocation');
  
  const categorySelect = document.getElementById('categoryFilter');
  const rstCategory = document.getElementById('rstCategory');

  if (locationSelect) {
    locationSelect.innerHTML = '<option value="all">📍 ทุกพิกัดใน ม.ศรีปทุม</option>';
    SPU_LOCATIONS.forEach(loc => {
      locationSelect.innerHTML += `<option value="${loc}">${loc}</option>`;
    });
  }

  if (wheelLocationSelect) {
    wheelLocationSelect.innerHTML = '<option value="all">🎲 ทุกร้านในและรอบ ม.ศรีปทุม</option>';
    SPU_LOCATIONS.forEach(loc => {
      wheelLocationSelect.innerHTML += `<option value="${loc}">${loc}</option>`;
    });
  }

  if (rstLocation) {
    rstLocation.innerHTML = '';
    SPU_LOCATIONS.forEach(loc => {
      rstLocation.innerHTML += `<option value="${loc}">${loc}</option>`;
    });
  }

  if (categorySelect) {
    categorySelect.innerHTML = '<option value="all">🍛 ทุกหมวดหมู่อาหาร</option>';
    FOOD_CATEGORIES.forEach(cat => {
      categorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
  }

  if (rstCategory) {
    rstCategory.innerHTML = '';
    FOOD_CATEGORIES.forEach(cat => {
      rstCategory.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
  }
}

function calculateRestaurantRating(restaurantId) {
  const reviews = Store.get(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
  const restReviews = reviews.filter(r => r.restaurantId === restaurantId);
  if (restReviews.length === 0) return { avg: 0, count: 0 };
  const sum = restReviews.reduce((acc, r) => acc + Number(r.rating), 0);
  const avg = (sum / restReviews.length).toFixed(1);
  return { avg: parseFloat(avg), count: restReviews.length };
}

function filterRestaurants() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const location = document.getElementById('locationFilter')?.value || 'all';
  const category = document.getElementById('categoryFilter')?.value || 'all';
  const price = document.getElementById('priceFilter')?.value || 'all';
  const sort = document.getElementById('sortBy')?.value || 'rating';

  const restaurants = Store.get(STORAGE_KEYS.RESTAURANTS, INITIAL_RESTAURANTS);
  const currentUser = getCurrentUser();

  const filtered = restaurants.filter(r => {
    // Search keyword
    const matchSearch = !search || 
      r.name.toLowerCase().includes(search) || 
      r.description.toLowerCase().includes(search) || 
      (r.tags && r.tags.some(t => t.toLowerCase().includes(search))) ||
      (r.menus && r.menus.some(m => m.name.toLowerCase().includes(search)));

    // Quick tag
    const matchTag = currentFilterTag === 'all' || 
      (r.tags && r.tags.some(t => t.toLowerCase().includes(currentFilterTag.toLowerCase()))) ||
      r.name.toLowerCase().includes(currentFilterTag.toLowerCase()) ||
      r.category.toLowerCase().includes(currentFilterTag.toLowerCase());

    // Location
    const matchLoc = location === 'all' || r.location === location;

    // Category
    const matchCat = category === 'all' || r.category === category;

    // Price
    let matchPrice = true;
    if (price === 'under40') matchPrice = r.avgPrice < 40;
    else if (price === '40-60') matchPrice = r.avgPrice >= 40 && r.avgPrice <= 60;
    else if (price === '60-100') matchPrice = r.avgPrice > 60 && r.avgPrice <= 100;
    else if (price === 'over100') matchPrice = r.avgPrice > 100;

    return matchSearch && matchTag && matchLoc && matchCat && matchPrice;
  });

  // Calculate dynamic ratings and sort
  filtered.forEach(r => {
    const stats = calculateRestaurantRating(r.id);
    r.computedRating = stats.count > 0 ? stats.avg : (r.rating || 0);
    r.computedCount = stats.count > 0 ? stats.count : (r.reviewCount || 0);
  });

  if (sort === 'rating') {
    filtered.sort((a, b) => b.computedRating - a.computedRating);
  } else if (sort === 'reviews') {
    filtered.sort((a, b) => b.computedCount - a.computedCount);
  } else if (sort === 'priceAsc') {
    filtered.sort((a, b) => a.avgPrice - b.avgPrice);
  } else if (sort === 'priceDesc') {
    filtered.sort((a, b) => b.avgPrice - a.avgPrice);
  }

  renderRestaurantGrid(filtered);

  const countText = document.getElementById('restaurantCountText');
  if (countText) {
    countText.textContent = `พบร้านอาหาร ${filtered.length} ร้าน (จากทั้งหมด ${restaurants.length} ร้านในระบบ SPU)`;
  }
}

function applyQuickFilter(tag, element) {
  currentFilterTag = tag;
  document.querySelectorAll('.quick-filter-chip').forEach(c => c.classList.remove('active'));
  if (element) element.classList.add('active');
  filterRestaurants();
}

function renderRestaurantGrid(list) {
  const grid = document.getElementById('restaurantGrid');
  if (!grid) return;

  const allRestaurants = Store.get(STORAGE_KEYS.RESTAURANTS, INITIAL_RESTAURANTS);

  if (allRestaurants.length === 0) {
    if (isAdmin()) {
      grid.innerHTML = `
        <div class="empty-state" style="border: 2px dashed var(--border-color); border-radius: var(--radius-lg); padding: 3.5rem 1.5rem; text-align: center; background: var(--bg-card); grid-column: 1 / -1; box-shadow: var(--shadow-sm);">
          <div class="empty-icon" style="font-size: 3.8rem; margin-bottom: 0.85rem;">🍽️</div>
          <div class="empty-title" style="font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--text-color);">ยังไม่มีร้านอาหารในระบบ (กล่องว่างพร้อมให้ใส่ข้อมูล)</div>
          <div class="empty-desc" style="font-size: 0.95rem; color: var(--text-muted); max-width: 540px; margin: 0 auto 1.5rem auto; line-height: 1.6;">
            ข้อมูลร้านอาหารตัวอย่างถูกล้างออกเรียบร้อยแล้ว คุณสามารถเริ่มเพิ่มร้านอาหารจริงใน ม.ศรีปทุม (SPU) เช่น โรงเย็น (อาคาร 10) หรือโรงร้อน (หลังอาคาร 5) ได้ทันที!
          </div>
          <button type="button" class="btn btn-primary btn-lg" onclick="openAddRestaurantModal()">
            ➕ เพิ่มร้านอาหารแรกของคุณเลย!
          </button>
        </div>
      `;
    } else {
      grid.innerHTML = `
        <div class="empty-state" style="border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 3.5rem 1.5rem; text-align: center; background: var(--bg-card); grid-column: 1 / -1; box-shadow: var(--shadow-sm);">
          <div class="empty-icon" style="font-size: 3.8rem; margin-bottom: 0.85rem;">🍽️</div>
          <div class="empty-title" style="font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--text-color);">ตอนนี้ยังไม่มีร้านแนะนำลองมาใหม่ในรอบหน้านะครับ</div>
          <div class="empty-desc" style="font-size: 0.95rem; color: var(--text-muted); max-width: 480px; margin: 0 auto; line-height: 1.6;">
            ผู้ดูแลระบบกำลังเตรียมข้อมูลร้านอาหารอร่อยๆ ในโรงอาหาร SPU ไว้ให้คุณ กรุณากลับมาติดตามชมในรอบถัดไปนะครับ 😋
          </div>
        </div>
      `;
    }
    return;
  }

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">ไม่พบร้านอาหารที่ตรงกับเงื่อนไขการค้นหา</div>
        <div class="empty-desc">ลองปรับตัวกรอง หรือค้นหาด้วยชื่อเมนูอื่น เช่น กะเพรา, ชาไทย, สเต็ก</div>
        <button type="button" class="btn btn-outline" onclick="resetFilters()">ล้างตัวกรองทั้งหมด</button>
      </div>
    `;
    return;
  }

  const currentUser = getCurrentUser();
  const userFavs = currentUser?.favorites || [];

  grid.innerHTML = list.map(rst => {
    const isFav = userFavs.includes(rst.id);
    const tagsHtml = (rst.tags || []).slice(0, 3).map(t => `<span class="card-tag">#${t}</span>`).join('');

    return `
      <div class="restaurant-card" data-id="${rst.id}">
        <div class="card-img-wrapper">
          <img src="${rst.image}" alt="${rst.name}" class="card-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'">
          <div class="card-badge-rating">
            ⭐ ${rst.computedRating.toFixed(1)} <span style="font-size: 0.7rem; opacity: 0.8;">(${rst.computedCount})</span>
          </div>
          <button type="button" class="card-fav-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite('${rst.id}', event)" title="${isFav ? 'นำออกจากร้านโปรด' : 'บันทึกเป็นร้านโปรด'}">
            ${isFav ? '❤️' : '🤍'}
          </button>
        </div>

        <div class="card-body">
          <div class="card-location">📍 ${rst.location}</div>
          <h3 class="card-title">${rst.name}</h3>
          <p class="card-desc">${rst.description}</p>
          <div class="card-tags">${tagsHtml}</div>

          <div class="card-footer">
            <div class="card-price">
              <span>ช่วงราคา:</span> ${rst.priceRange}
            </div>
            <button type="button" class="btn btn-primary btn-sm" onclick="openRestaurantDetail('${rst.id}')">
              ดูเมนู & รีวิว 💬
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function resetFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('locationFilter').value = 'all';
  document.getElementById('categoryFilter').value = 'all';
  document.getElementById('priceFilter').value = 'all';
  currentFilterTag = 'all';
  document.querySelectorAll('.quick-filter-chip').forEach((c, i) => {
    if (i === 0) c.classList.add('active');
    else c.classList.remove('active');
  });
  filterRestaurants();
}

function toggleFavorite(restaurantId, event) {
  if (event) event.stopPropagation();
  if (!requireAuth("บันทึกร้านอาหารโปรด")) return;

  const users = Store.get(STORAGE_KEYS.USERS, INITIAL_USERS);
  const currentUser = getCurrentUser();
  const user = users.find(u => u.id === currentUser.id);

  if (!user) return;
  if (!user.favorites) user.favorites = [];

  const idx = user.favorites.indexOf(restaurantId);
  if (idx > -1) {
    user.favorites.splice(idx, 1);
    showToast('นำออกจากร้านโปรดแล้ว', 'info');
  } else {
    user.favorites.push(restaurantId);
    showToast('บันทึกลงในร้านโปรดเรียบร้อย ❤️', 'success');
  }

  Store.set(STORAGE_KEYS.USERS, users);
  setCurrentUser(user);
  filterRestaurants();
}

// ============================================================================
// 8. Restaurant Detail Modal & User Review Engine & Photo Lightbox
// ============================================================================

let activeLightboxImages = [];
let activeLightboxIndex = 0;
let currentDetailGalleryIdx = 0;

function openPhotoLightbox(index = 0) {
  if (!activeLightboxImages || activeLightboxImages.length === 0) return;
  activeLightboxIndex = Math.max(0, Math.min(index, activeLightboxImages.length - 1));
  renderLightboxContent();
  openModal('imageLightboxModal');
}

function openPhotoLightboxWithSrc(src, caption = 'ภาพรีวิว') {
  if (!src) return;
  activeLightboxImages = [src];
  activeLightboxIndex = 0;
  const capEl = document.getElementById('lightboxCaption');
  if (capEl) capEl.textContent = caption;
  renderLightboxContent();
  openModal('imageLightboxModal');
}

function renderLightboxContent() {
  const imgEl = document.getElementById('lightboxImage');
  const prevBtn = document.getElementById('lightboxPrevBtn');
  const nextBtn = document.getElementById('lightboxNextBtn');
  const thumbsRow = document.getElementById('lightboxThumbsRow');
  const capEl = document.getElementById('lightboxCaption');

  if (imgEl && activeLightboxImages[activeLightboxIndex]) {
    imgEl.src = activeLightboxImages[activeLightboxIndex];
  }
  if (capEl && activeLightboxImages.length > 1) {
    capEl.textContent = `📷 ภาพที่ ${activeLightboxIndex + 1} จาก ${activeLightboxImages.length}`;
  }

  if (prevBtn) prevBtn.style.display = activeLightboxImages.length > 1 ? 'flex' : 'none';
  if (nextBtn) nextBtn.style.display = activeLightboxImages.length > 1 ? 'flex' : 'none';

  if (thumbsRow) {
    if (activeLightboxImages.length > 1) {
      thumbsRow.innerHTML = activeLightboxImages.map((img, idx) => `
        <img src="${img}" onclick="activeLightboxIndex = ${idx}; renderLightboxContent();" 
             style="width: 52px; height: 38px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 2px solid ${idx === activeLightboxIndex ? 'var(--primary)' : 'rgba(255,255,255,0.3)'}; opacity: ${idx === activeLightboxIndex ? '1' : '0.6'}; transition: all var(--transition-fast);">
      `).join('');
    } else {
      thumbsRow.innerHTML = '';
    }
  }
}

function navigateLightbox(direction) {
  if (!activeLightboxImages || activeLightboxImages.length <= 1) return;
  activeLightboxIndex = (activeLightboxIndex + direction + activeLightboxImages.length) % activeLightboxImages.length;
  renderLightboxContent();
}

function switchDetailMainPhoto(index, btn) {
  currentDetailGalleryIdx = index;
  activeLightboxIndex = index;
  const banner = document.getElementById('detailMainBanner');
  const counter = document.getElementById('detailGalleryCounter');
  if (banner && activeLightboxImages[index]) {
    banner.style.backgroundImage = `url('${activeLightboxImages[index]}')`;
  }
  if (counter) {
    counter.textContent = index + 1;
  }
  document.querySelectorAll('.gallery-thumb-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function openRestaurantDetail(restaurantId) {
  currentDetailRestaurantId = restaurantId;
  const restaurants = Store.get(STORAGE_KEYS.RESTAURANTS, INITIAL_RESTAURANTS);
  const rst = restaurants.find(r => r.id === restaurantId);
  if (!rst) return;

  const modal = document.getElementById('restaurantDetailModal');
  const modalTitle = document.getElementById('detailModalTitle');
  const body = document.getElementById('restaurantDetailBody');

  if (modalTitle) modalTitle.textContent = rst.name;

  const stats = calculateRestaurantRating(rst.id);
  const reviews = Store.get(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS).filter(r => r.restaurantId === rst.id);
  const currentUser = getCurrentUser();
  const userExistingReview = currentUser ? reviews.find(r => r.userId === currentUser.id) : null;

  // Setup Gallery Images (up to 5 images)
  const galleryImages = (rst.images && rst.images.length > 0)
    ? rst.images
    : (rst.image ? [rst.image] : ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600']);
  activeLightboxImages = galleryImages;
  activeLightboxIndex = 0;
  currentDetailGalleryIdx = 0;

  // Render Tabs
  body.innerHTML = `
    <!-- Cover Banner & Interactive Photo Gallery -->
    <div style="position: relative; margin-bottom: 0.75rem;">
      <div id="detailMainBanner" class="detail-banner" style="background-image: url('${galleryImages[0]}'); cursor: pointer;" onclick="openPhotoLightbox(currentDetailGalleryIdx)" title="🔍 คลิกเพื่อเปิดดูภาพขนาดเต็ม">
        <div class="detail-banner-overlay">
          <div style="margin-top: auto;">
            <h2 class="detail-title">${rst.name}</h2>
            <div class="detail-meta-row">
              <span>📍 ${rst.location}</span>
              <span>🍛 ${rst.category}</span>
              <span>⏰ ${rst.openHours}</span>
              <span>💰 ${rst.priceRange}</span>
            </div>
          </div>
        </div>
        <div style="position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.68); color: #fff; padding: 0.25rem 0.65rem; border-radius: var(--radius-full); font-size: 0.775rem; font-weight: 700; display: flex; align-items: center; gap: 0.35rem; backdrop-filter: blur(4px);">
          🔍 คลิกดูรูปเต็ม (<span id="detailGalleryCounter">1</span>/${galleryImages.length})
        </div>
      </div>

      <!-- Thumbnails row if multiple images exist -->
      ${galleryImages.length > 1 ? `
        <div class="gallery-thumbs-row">
          ${galleryImages.map((img, idx) => `
            <button type="button" class="gallery-thumb-btn ${idx === 0 ? 'active' : ''}" onclick="switchDetailMainPhoto(${idx}, this)" title="ดูรูปที่ ${idx + 1}">
              <img src="${img}" alt="รูปที่ ${idx + 1}">
            </button>
          `).join('')}
        </div>
      ` : ''}
    </div>

    <!-- Inner Tab Navigation -->
    <div class="tab-nav">
      <button type="button" class="tab-btn active" onclick="switchDetailTab('detailMenuTab', this)">📋 รายการเมนูแนะนำ (${rst.menus ? rst.menus.length : 0})</button>
      <button type="button" class="tab-btn" onclick="switchDetailTab('detailReviewTab', this)">⭐ รีวิวจากเพื่อน SPU (${stats.count})</button>
    </div>

    <!-- TAB 1: Menu Items -->
    <div class="tab-pane active" id="detailMenuTab">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
        <div style="color: var(--text-muted); font-size: 0.9rem; max-width: 650px;">
          ${rst.description}
        </div>
        ${isAdmin() ? `
          <button type="button" class="btn btn-sm btn-outline" onclick="openAddMenuPrompt('${rst.id}')">
            ➕ เพิ่มเมนูอาหาร (Admin)
          </button>
        ` : ''}
      </div>
      <div class="menu-items-grid">
        ${(rst.menus || []).map((m, mIdx) => `
          <div class="menu-card">
            <img src="${m.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'}" class="menu-thumb" alt="${m.name}" style="cursor: pointer;" onclick="openPhotoLightboxWithSrc(this.src, 'เมนู ${m.name}')" title="🔍 คลิกดูรูปเมนู" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'">
            <div class="menu-info">
              ${m.isRecommended ? '<span class="menu-badge">⭐ เมนูแนะนำ</span>' : ''}
              <div class="menu-name">${m.name}</div>
              <div class="menu-price">${m.price} บาท</div>
            </div>
            ${isAdmin() ? `
              <button type="button" style="color: #ef4444; font-size: 1rem; padding: 0.25rem 0.5rem;" onclick="adminDeleteMenu('${rst.id}', ${mIdx})" title="ลบเมนูนี้">✕</button>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>

    <!-- TAB 2: Reviews & Write Review -->
    <div class="tab-pane" id="detailReviewTab">
      <!-- Ratings Summary -->
      <div class="reviews-summary">
        <div>
          <div class="rating-big-num">${stats.count > 0 ? stats.avg.toFixed(1) : '0.0'}</div>
          <div style="color: #f59e0b; font-size: 1.25rem;">
            ${getStarSymbols(Math.round(stats.avg || 0))}
          </div>
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">
            จากทั้งหมด ${stats.count} รีวิว
          </div>
        </div>
        <div style="flex-grow: 1; border-left: 1px solid var(--border-color); padding-left: 1.5rem; font-size: 0.875rem;">
          <div style="margin-bottom: 0.25rem;">✨ <strong>เงื่อนไขของระบบ:</strong> สมาชิก 1 คน สามารถเขียนรีวิวได้ 1 ครั้งต่อร้าน โดยสามารถแก้ไขหรือลบรีวิวของตนเองได้ตลอดเวลา</div>
          <div style="color: var(--primary); font-weight: 700;">🎁 เขียนรีวิววันนี้ ช่วยเพื่อนๆ เลือกร้านอร่อยและรับบัดจ์นักรีวิว!</div>
        </div>
      </div>

      <!-- Write / Edit Review Box -->
      <div style="background: var(--bg-surface-alt); padding: 1.25rem; border-radius: var(--radius-lg); margin-bottom: 2rem; border: 1.5px solid var(--border-color);">
        <h4 style="margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between;">
          <span>✍️ ${userExistingReview ? 'แก้ไขรีวิวของคุณ' : 'เขียนรีวิวร้านนี้'}</span>
          ${userExistingReview ? `
            <button type="button" class="btn btn-sm btn-outline btn-danger" onclick="deleteMyReview('${userExistingReview.id}')">
              🗑️ ลบรีวิวของฉัน
            </button>
          ` : ''}
        </h4>

        <div style="margin-bottom: 1rem;">
          <label class="form-label required">ให้คะแนนความพึงพอใจ:</label>
          <div class="star-picker" id="reviewStarPicker">
            ${[1, 2, 3, 4, 5].map(star => `
              <span class="star ${(userExistingReview?.rating || 5) >= star ? 'active' : ''}" onclick="setReviewRating(${star})">★</span>
            `).join('')}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label required" for="reviewCommentInput">บอกต่อเพื่อน SPU (รสชาติ, ปริมาณ, ความคุ้มค่า):</label>
          <textarea id="reviewCommentInput" class="form-control" rows="3" placeholder="เขียนรีวิวอย่างน้อย 10 ตัวอักษร เช่น ป้าพรผัดกะเพราเด็ดมาก ให้เยอะ คุ้มค่าเงิน 50 บาท...">${userExistingReview ? userExistingReview.comment : ''}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label" for="reviewImageUrlInput">แนบลิงก์รูปภาพอาหาร (ถ้ามี):</label>
          <input type="url" id="reviewImageUrlInput" class="form-control" placeholder="https://images.unsplash.com/..." value="${userExistingReview?.image || ''}">
        </div>

        <button type="button" class="btn btn-primary" onclick="submitReview('${rst.id}')">
          🚀 ${userExistingReview ? 'อัปเดตรีวิว' : 'โพสต์รีวิว'}
        </button>
      </div>

      <!-- Reviews Feed -->
      <h4 style="margin-bottom: 1rem;">ความคิดเห็นทั้งหมด (${reviews.length})</h4>
      <div class="reviews-list">
        ${reviews.length === 0 ? '<div style="color: var(--text-muted); text-align: center; padding: 2rem;">ยังไม่มีรีวิวสำหรับร้านนี้ เป็นคนแรกที่รีวิวเลย!</div>' : ''}
        ${reviews.map(rev => {
          const isMyReview = currentUser && rev.userId === currentUser.id;
          return `
            <div class="review-item">
              <div class="review-header">
                <div class="reviewer-meta">
                  <img src="${rev.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" class="reviewer-avatar" alt="${rev.userName}">
                  <div>
                    <div class="reviewer-name">${rev.userName} ${isMyReview ? '<span style="font-size: 0.7rem; background: var(--primary-light); color: var(--primary); padding: 0.1rem 0.4rem; border-radius: 4px;">คุณ</span>' : ''}</div>
                    <div class="review-date">${rev.date}</div>
                  </div>
                </div>
                <div class="review-stars">${getStarSymbols(rev.rating)}</div>
              </div>

              <div class="review-content">${rev.comment}</div>
              ${rev.image ? `
                <div style="margin-top: 0.5rem;">
                  <img src="${rev.image}" class="review-img" alt="ภาพรีวิว" style="cursor: pointer; max-height: 160px; border-radius: var(--radius-md); border: 2px solid var(--border-color); object-fit: cover; transition: transform var(--transition-fast);" onclick="openPhotoLightboxWithSrc('${rev.image}', 'ภาพรีวิวโดย ${rev.userName}')" title="🔍 คลิกดูรูปขนาดเต็ม" onerror="this.style.display='none'">
                  <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">🔍 คลิกที่ภาพเพื่อดูขนาดเต็ม</div>
                </div>
              ` : ''}

              <div class="review-actions-row">
                <button type="button" class="btn btn-outline btn-sm" onclick="voteHelpful('${rev.id}')">
                  👍 มีประโยชน์ (${rev.helpfulCount || 0})
                </button>
                <button type="button" class="btn btn-outline btn-sm" onclick="reportReview('${rev.id}')" title="รายงานรีวิวที่ไม่เหมาะสม">
                  🚩 รายงาน
                </button>
                ${isAdmin() ? `
                  <button type="button" class="btn btn-danger btn-sm" onclick="adminDeleteReview('${rev.id}', '${rst.id}')">
                    🗑️ ประหารคอมเมนต์ (Admin)
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  openModal('restaurantDetailModal');
}

function switchDetailTab(tabId, btn) {
  document.querySelectorAll('#restaurantDetailBody .tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#restaurantDetailBody .tab-pane').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const target = document.getElementById(tabId);
  if (target) target.classList.add('active');
}

function openAddMenuPrompt(restaurantId) {
  if (!isAdmin()) {
    showToast("เฉพาะแอดมินเท่านั้นที่สามารถเพิ่มเมนูได้", "error");
    return;
  }
  const name = prompt("กรุณาระบุชื่อเมนูอาหารใหม่:");
  if (!name || !name.trim()) return;
  const priceStr = prompt("กรุณาระบุราคาอาหาร (บาท):", "50");
  const price = Number(priceStr);
  if (isNaN(price) || price <= 0) {
    showToast("ราคาเมนูต้องเป็นตัวเลขที่มากกว่า 0 บาท", "error");
    return;
  }
  const isRecommended = confirm("ต้องการตั้งเป็น '⭐ เมนูแนะนำ' หรือไม่?");

  const restaurants = Store.get(STORAGE_KEYS.RESTAURANTS, INITIAL_RESTAURANTS);
  const rst = restaurants.find(r => r.id === restaurantId);
  if (rst) {
    if (!rst.menus) rst.menus = [];
    rst.menus.push({
      name: name.trim(),
      price,
      isRecommended,
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300"
    });
    Store.set(STORAGE_KEYS.RESTAURANTS, restaurants);
    showToast(`เพิ่มเมนู "${name}" สำเร็จแล้ว!`, "success");
    openRestaurantDetail(restaurantId);
  }
}

function adminDeleteMenu(restaurantId, menuIndex) {
  if (!isAdmin()) return;
  if (!confirm("คุณต้องการลบเมนูนี้ออกจากร้านใช่หรือไม่?")) return;

  const restaurants = Store.get(STORAGE_KEYS.RESTAURANTS, INITIAL_RESTAURANTS);
  const rst = restaurants.find(r => r.id === restaurantId);
  if (rst && rst.menus && rst.menus[menuIndex]) {
    const deleted = rst.menus.splice(menuIndex, 1);
    Store.set(STORAGE_KEYS.RESTAURANTS, restaurants);
    showToast(`ลบเมนู "${deleted[0].name}" เรียบร้อยแล้ว`, "info");
    openRestaurantDetail(restaurantId);
  }
}

function setReviewRating(star) {
  currentReviewRating = star;
  SoundFX.playTick();
  const stars = document.querySelectorAll('#reviewStarPicker .star');
  stars.forEach((s, idx) => {
    if (idx < star) s.classList.add('active');
    else s.classList.remove('active');
  });
}

function getStarSymbols(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += i <= rating ? '★' : '☆';
  }
  return stars;
}

function submitReview(restaurantId) {
  if (!requireAuth("เขียนรีวิวร้านอาหาร")) return;

  const comment = document.getElementById('reviewCommentInput')?.value.trim();
  const imageUrl = document.getElementById('reviewImageUrlInput')?.value.trim();

  if (!comment || comment.length < 10) {
    showToast('กรุณาเขียนรีวิวอย่างน้อย 10 ตัวอักษร เพื่อให้ข้อมูลเป็นประโยชน์แก่เพื่อนๆ', 'error');
    return;
  }

  const currentUser = getCurrentUser();
  const reviews = Store.get(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
  const existingIdx = reviews.findIndex(r => r.restaurantId === restaurantId && r.userId === currentUser.id);

  const nowStr = new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });

  if (existingIdx > -1) {
    // Update existing review
    reviews[existingIdx].rating = currentReviewRating;
    reviews[existingIdx].comment = comment;
    reviews[existingIdx].image = imageUrl || null;
    reviews[existingIdx].date = nowStr;
    showToast('แก้ไขรีวิวสำเร็จแล้ว!', 'success');
  } else {
    // Create new review
    const newReview = {
      id: `rev_${Date.now()}`,
      restaurantId,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      rating: currentReviewRating,
      comment,
      date: nowStr,
      helpfulCount: 0,
      reported: false,
      image: imageUrl || null
    };
    reviews.unshift(newReview);

    // Award badge for writing reviews
    checkAndAwardBadges(currentUser.id);
    SoundFX.playWin();
    showToast('โพสต์รีวิวสำเร็จ! ขอบคุณที่ช่วยเพื่อนๆ เลือกร้านอร่อย 🎉', 'success');
  }

  Store.set(STORAGE_KEYS.REVIEWS, reviews);
  openRestaurantDetail(restaurantId);
  filterRestaurants();
  renderLeaderboard();
}

function deleteMyReview(reviewId) {
  if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรีวิวนี้?')) return;
  const reviews = Store.get(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
  const updated = reviews.filter(r => r.id !== reviewId);
  Store.set(STORAGE_KEYS.REVIEWS, updated);
  showToast('ลบรีวิวเรียบร้อยแล้ว', 'info');
  if (currentDetailRestaurantId) {
    openRestaurantDetail(currentDetailRestaurantId);
  }
  filterRestaurants();
}

function voteHelpful(reviewId) {
  if (!requireAuth("โหวตรีวิวมีประโยชน์")) return;
  const reviews = Store.get(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
  const rev = reviews.find(r => r.id === reviewId);
  if (!rev) return;

  rev.helpfulCount = (rev.helpfulCount || 0) + 1;
  Store.set(STORAGE_KEYS.REVIEWS, reviews);

  SoundFX.playMatch();
  showToast('ขอบคุณสำหรับคะแนนโหวต! 👍', 'success');
  if (currentDetailRestaurantId) {
    openRestaurantDetail(currentDetailRestaurantId);
  }
}

function reportReview(reviewId) {
  const reviews = Store.get(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
  const rev = reviews.find(r => r.id === reviewId);
  if (!rev) return;

  rev.reported = true;
  Store.set(STORAGE_KEYS.REVIEWS, reviews);
  showToast('รายงานรีวิวไปยังทีมแอดมินเรียบร้อยแล้ว ขอบคุณที่ช่วยดูแลระบบ', 'info');
}

function adminDeleteReview(reviewId, restaurantId) {
  if (!isAdmin()) {
    showToast('เฉพาะแอดมินเท่านั้นที่มีสิทธิประหารคอมเมนต์', 'error');
    return;
  }
  if (!confirm('⚠️ แอดมินยืนยันที่จะ "ประหารคอมเมนต์" (ลบรีวิวนี้ออกจากระบบถาวร)?')) return;

  const reviews = Store.get(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
  const updated = reviews.filter(r => r.id !== reviewId);
  Store.set(STORAGE_KEYS.REVIEWS, updated);
  showToast('ประหารคอมเมนต์เรียบร้อยแล้ว (ลบสำเร็จ)', 'success');

  if (currentDetailRestaurantId) {
    openRestaurantDetail(currentDetailRestaurantId);
  }
  renderAdminReviews();
  filterRestaurants();
}

// ============================================================================
// 9. Badges & Leaderboard Engine (based on streaks & reviews, no points)
// ============================================================================

function checkAndAwardBadges(userId) {
  const users = Store.get(STORAGE_KEYS.USERS, INITIAL_USERS);
  const user = users.find(u => u.id === userId);
  if (!user) return;

  if (!user.badges) user.badges = ["newbie"];
  const reviews = Store.get(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
  const userReviewCount = reviews.filter(r => r.userId === userId).length;
  const userStreak = user.checkInStreak || 0;

  let newBadgeUnlocked = false;

  BADGES_LIST.forEach(b => {
    if (user.badges.includes(b.id)) return;
    let earned = false;
    if (b.reqType === 'register') earned = true;
    else if (b.reqType === 'streak' && userStreak >= (b.minStreak || 0)) earned = true;
    else if (b.reqType === 'reviews' && userReviewCount >= (b.minReviews || 0)) earned = true;

    if (earned) {
      user.badges.push(b.id);
      showToast(`🏆 ยินดีด้วย! ปลดล็อกบัดจ์ใหม่: "${b.name}" ${b.icon}`, 'success');
      newBadgeUnlocked = true;
    }
  });

  // Check frame unlocks based on reviews
  if (!user.unlockedFrames) user.unlockedFrames = ["frame-none"];
  if (userReviewCount >= 2 && !user.unlockedFrames.includes("frame-flame")) {
    user.unlockedFrames.push("frame-flame");
    showToast('🖼️ ปลดล็อกกรอบ "Flame Food Master" จากการรีวิวครบ 2 ร้าน!', 'success');
  }

  if (newBadgeUnlocked || user.unlockedFrames.length > 0) {
    Store.set(STORAGE_KEYS.USERS, users);
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(user);
    }
  }
}

function renderLeaderboard() {
  const listEl = document.getElementById('leaderboardList');
  if (!listEl) return;

  const users = Store.get(STORAGE_KEYS.USERS, INITIAL_USERS);
  const reviews = Store.get(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);

  // Sort by streak first, then by review count
  const sorted = [...users].sort((a, b) => {
    const streakDiff = (b.checkInStreak || 0) - (a.checkInStreak || 0);
    if (streakDiff !== 0) return streakDiff;
    const aReviews = reviews.filter(r => r.userId === a.id).length;
    const bReviews = reviews.filter(r => r.userId === b.id).length;
    return bReviews - aReviews;
  });

  listEl.innerHTML = sorted.slice(0, 5).map((user, idx) => {
    let rankBadge = `${idx + 1}`;
    let rankClass = '';
    if (idx === 0) { rankBadge = '🥇'; rankClass = 'rank-1'; }
    else if (idx === 1) { rankBadge = '🥈'; rankClass = 'rank-2'; }
    else if (idx === 2) { rankBadge = '🥉'; rankClass = 'rank-3'; }

    const userReviewCount = reviews.filter(r => r.userId === user.id).length;

    return `
      <div class="leader-item">
        <div class="leader-rank ${rankClass}">${rankBadge}</div>
        <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" class="user-avatar leader-avatar ${user.equippedFrame || 'frame-none'}" alt="${user.name}">
        <div class="leader-info">
          <div class="leader-name">${user.name}</div>
          <div class="leader-role">${user.customTitle || user.userType || 'สมาชิก SPU'}</div>
        </div>
        <div class="leader-points">🔥 ${user.checkInStreak || 0} วัน | 💬 ${userReviewCount} รีวิว</div>
      </div>
    `;
  }).join('');
}

function renderBadgesShowcase() {
  const grid = document.getElementById('badgesGrid');
  if (!grid) return;

  const currentUser = getCurrentUser();
  const myBadges = currentUser?.badges || ["newbie"];

  grid.innerHTML = BADGES_LIST.map(badge => {
    const isUnlocked = myBadges.includes(badge.id);
    return `
      <div class="badge-item ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="badge-icon">${badge.icon}</div>
        <div class="badge-name">${badge.name}</div>
        <div class="badge-desc">${badge.desc}</div>
      </div>
    `;
  }).join('');
}

// ============================================================================
// 10. Mini-Game 1: Food Roulette Wheel Canvas Engine
// ============================================================================

let wheelRestaurants = [];
let wheelAngle = 0;
let isSpinning = false;

function initWheel() {
  const canvas = document.getElementById('wheelCanvas');
  if (!canvas) return;

  const locSelect = document.getElementById('wheelLocationSelect');
  const selectedLoc = locSelect ? locSelect.value : 'all';

  const allRestaurants = Store.get(STORAGE_KEYS.RESTAURANTS, INITIAL_RESTAURANTS);
  wheelRestaurants = allRestaurants.filter(r => selectedLoc === 'all' || r.location === selectedLoc);

  if (wheelRestaurants.length === 0) {
    wheelRestaurants = allRestaurants;
  }

  drawWheel();
}

function drawWheel() {
  const canvas = document.getElementById('wheelCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const center = width / 2;
  const radius = center - 10;

  ctx.clearRect(0, 0, width, height);

  const numSlices = wheelRestaurants.length;
  if (numSlices === 0) {
    ctx.save();
    ctx.translate(center, center);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(150, 150, 150, 0.08)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = 'rgba(150, 150, 150, 0.4)';
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    if (isAdmin()) {
      ctx.font = 'bold 15px Prompt, Kanit, sans-serif';
      ctx.fillText('ยังไม่มีร้านอาหารในระบบ', 0, -8);
      ctx.font = '12px Prompt, Kanit, sans-serif';
      ctx.fillText('➕ เพิ่มร้านอาหารเพื่อเริ่มหมุนวงล้อ', 0, 16);
    } else {
      ctx.font = 'bold 13px Prompt, Kanit, sans-serif';
      ctx.fillText('ตอนนี้ยังไม่มีร้านแนะนำ', 0, -8);
      ctx.font = '12px Prompt, Kanit, sans-serif';
      ctx.fillText('ลองมาใหม่ในรอบหน้านะครับ 🎲', 0, 16);
    }
    ctx.restore();
    return;
  }
  const sliceAngle = (2 * Math.PI) / numSlices;

  const colors = [
    '#f97316', '#ea580c', '#f59e0b', '#d97706',
    '#0ea5e9', '#0284c7', '#10b981', '#059669',
    '#8b5cf6', '#7c3aed', '#ec4899', '#db2777'
  ];

  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(wheelAngle);

  for (let i = 0; i < numSlices; i++) {
    const startAngle = i * sliceAngle;
    const endAngle = startAngle + sliceAngle;

    // Draw slice
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Draw text
    ctx.save();
    ctx.rotate(startAngle + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Prompt, Kanit, sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;

    let text = wheelRestaurants[i].name;
    if (text.length > 14) text = text.substring(0, 13) + '...';
    ctx.fillText(text, radius - 20, 5);
    ctx.restore();
  }

  ctx.restore();
}

function spinWheel() {
  if (isSpinning) return;
  if (wheelRestaurants.length === 0) {
    if (isAdmin()) {
      showToast('ยังไม่มีร้านอาหารในระบบ กรุณาเพิ่มร้านอาหารก่อนเริ่มหมุนวงล้อ!', 'info');
      openAddRestaurantModal();
    } else {
      showToast('ตอนนี้ยังไม่มีร้านแนะนำ ลองมาใหม่ในรอบหน้านะครับ 🎲', 'info');
    }
    return;
  }

  isSpinning = true;
  const spinBtn = document.getElementById('spinBtn');
  if (spinBtn) spinBtn.disabled = true;

  const resultBox = document.getElementById('rouletteResultBox');
  if (resultBox) resultBox.style.display = 'none';

  const startAngle = wheelAngle;
  // 6 to 9 full spins + random slice target offset
  const fullRotations = 6 + Math.floor(Math.random() * 4);
  const randomOffset = Math.random() * (2 * Math.PI);
  const totalRotation = (fullRotations * 2 * Math.PI) + randomOffset;
  const targetAngle = startAngle + totalRotation;

  const duration = 4500; // 4.5 seconds for a realistic cinematic spin
  const startTime = performance.now();

  const numSlices = wheelRestaurants.length;
  const sliceAngle = (2 * Math.PI) / numSlices;
  let lastSliceTracked = Math.floor(startAngle / sliceAngle);

  function animateSpin(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Quintic ease-out: smooth deceleration matching physical wheel inertia
    const easeOut = 1 - Math.pow(1 - progress, 5);
    wheelAngle = startAngle + (totalRotation * easeOut);

    // Audio tick sound: physically synchronized with slice crossings
    const currentSlice = Math.floor(wheelAngle / sliceAngle);
    if (currentSlice !== lastSliceTracked) {
      SoundFX.playTick();
      lastSliceTracked = currentSlice;
    }

    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animateSpin);
    } else {
      wheelAngle = targetAngle % (2 * Math.PI);
      drawWheel();
      isSpinning = false;
      if (spinBtn) spinBtn.disabled = false;
      finalizeWheelResult();
    }
  }

  requestAnimationFrame(animateSpin);
}

function finalizeWheelResult() {
  const numSlices = wheelRestaurants.length;
  if (numSlices === 0) return;
  const sliceAngle = (2 * Math.PI) / numSlices;
  
  // Normalize angle
  const normalizedAngle = (wheelAngle % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI);
  // Pointer is at 270 deg (1.5 * PI)
  const pointerAngle = (1.5 * Math.PI - normalizedAngle + (2 * Math.PI)) % (2 * Math.PI);
  const winningIndex = Math.floor(pointerAngle / sliceAngle) % numSlices;

  const winner = wheelRestaurants[winningIndex];
  if (!winner) return;

  SoundFX.playWin();

  const resultBox = document.getElementById('rouletteResultBox');
  if (resultBox) {
    const winnerImg = winner.image || (winner.images && winner.images[0]) || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
    const recMenus = (winner.menus || []).filter(m => m.isRecommended);
    const displayMenus = recMenus.length > 0 ? recMenus : (winner.menus || []).slice(0, 3);

    resultBox.innerHTML = `
      <div class="result-badge" style="display: inline-flex; align-items: center; gap: 0.35rem; margin-bottom: 0.85rem;">
        <span>🎉</span> <span>ผลการสุ่มมื้อนี้สำเร็จแล้ว!</span>
      </div>
      
      <div style="background: var(--bg-surface); border: 1.5px solid var(--primary-light); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-md); margin-bottom: 1rem; text-align: left;">
        <div style="position: relative; height: 160px; overflow: hidden; background: #0f172a; cursor: pointer;" onclick="openRestaurantDetail('${winner.id}')" title="คลิกดูรายละเอียดร้าน">
          <img src="${winnerImg}" alt="${winner.name}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.95;">
          <div style="position: absolute; top: 0.75rem; right: 0.75rem; background: rgba(0,0,0,0.65); backdrop-filter: blur(4px); color: #fff; padding: 0.25rem 0.65rem; border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 700;">
            📍 ${winner.location}
          </div>
          <div style="position: absolute; bottom: 0.75rem; left: 0.75rem; background: var(--primary); color: #fff; padding: 0.25rem 0.65rem; border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 700;">
            💵 ${winner.priceRange || 'ราคาประหยัด'}
          </div>
        </div>

        <div style="padding: 1.15rem;">
          <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-color); margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <span>🍽️ ${winner.name}</span>
            <span style="font-size: 0.85rem; color: #f59e0b; font-weight: 700;">⭐ ${(winner.rating || 5.0).toFixed(1)}</span>
          </h3>

          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.85rem; line-height: 1.5;">
            ${winner.description || 'ร้านอาหารยอดนิยมใน SPU เมนูหลากหลาย รสชาติจัดจ้าน ถูกใจนักศึกษา'}
          </p>

          <!-- Recommended Menus Section -->
          <div style="background: var(--bg-surface-alt); padding: 0.85rem; border-radius: var(--radius-md); border: 1px dashed var(--border-color); margin-bottom: 1rem;">
            <div style="font-size: 0.825rem; font-weight: 800; color: var(--primary); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.35rem;">
              <span>⭐</span> <span>เมนูแนะนำห้ามพลาดของร้านนี้:</span>
            </div>
            ${displayMenus.length > 0 ? `
              <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                ${displayMenus.map(m => `
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem; background: var(--bg-surface); padding: 0.4rem 0.65rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                    <span style="font-weight: 700; color: var(--text-color);">✨ ${m.name}</span>
                    <span style="color: var(--primary); font-weight: 800; white-space: nowrap;">${m.price} บาท</span>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div style="font-size: 0.825rem; color: var(--text-muted);">มีเมนูหลากหลายให้เลือกสั่งหน้าร้าน</div>
            `}
          </div>

          <!-- Action Buttons -->
          <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
            <button type="button" class="btn btn-primary btn-sm" onclick="openRestaurantDetail('${winner.id}')" style="flex: 1 1 180px; justify-content: center;">
              👉 ดูเมนูและรีวิวทั้งหมด
            </button>
            <button type="button" class="btn btn-outline btn-sm" onclick="spinWheel()" style="justify-content: center;">
              🎲 สุ่มอีกรอบ
            </button>
          </div>
        </div>
      </div>
    `;
    resultBox.style.display = 'block';
  }

  showToast(`🎉 ได้ร้านแล้ว: "${winner.name}" พร้อมเมนูแนะนำ!`, 'success');
}

// ============================================================================
// 11. Daily Check-In & Profile Frames Engine (ระบบเช็กอินรายวันสะสมฉายาและกรอบ)
// ============================================================================

function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function hasUserCheckedInToday(user) {
  if (!user) return false;
  const todayStr = getTodayDateString();

  // 1. Check user object attribute
  if (user.lastCheckInDate === todayStr) return true;

  // 2. Check persistent localStorage key by user ID
  if (user.id && localStorage.getItem(`spu_last_checkin_${user.id}`) === todayStr) {
    user.lastCheckInDate = todayStr;
    return true;
  }

  // 3. Check persistent localStorage key by user Email
  if (user.email && localStorage.getItem(`spu_last_checkin_email_${user.email.toLowerCase()}`) === todayStr) {
    user.lastCheckInDate = todayStr;
    return true;
  }

  return false;
}

function renderDailyCheckIn() {
  const container = document.getElementById('checkinContainer');
  if (!container) return;

  const user = getCurrentUser();
  const checkedInToday = user ? hasUserCheckedInToday(user) : false;
  const currentStreak = user ? (user.checkInStreak || 0) : 0;
  const isAdminUser = user && user.role === 'admin';

  // Calculate current week and day in current 7-day cycle
  // If user checked in today: they are at currentStreak
  // If user hasn't checked in today: they are targeting currentStreak + 1
  const targetStreak = checkedInToday ? Math.max(1, currentStreak) : (currentStreak + 1);
  const currentWeek = Math.max(1, Math.floor((targetStreak - 1) / 7) + 1);
  const weekRewardIndex = Math.min(currentWeek - 1, WEEKLY_REWARDS_CALENDAR.length - 1);
  const currentWeekReward = WEEKLY_REWARDS_CALENDAR[weekRewardIndex];

  // Day inside current 7-day cycle (1 to 7)
  const dayInCycle = currentStreak === 0 ? 0 : (((currentStreak - 1) % 7) + 1);
  const activeDay = checkedInToday ? dayInCycle : ((currentStreak % 7) + 1);

  // Generate 7-day cards for current week
  const icons = ["🌱", "🥢", "🍱", "🍜", "🍛", "🍲"];
  const daysHtml = [1, 2, 3, 4, 5, 6, 7].map(dayNum => {
    const absoluteDay = (currentWeek - 1) * 7 + dayNum;
    const isCompleted = checkedInToday ? (dayNum <= dayInCycle) : (dayNum < activeDay);
    const isToday = !checkedInToday && (dayNum === activeDay);

    if (dayNum === 7) {
      return `
        <div class="checkin-day-card ${isCompleted ? 'completed' : ''} ${isToday ? 'active-today' : ''}" style="border-color: ${currentWeekReward.color};">
          <div class="checkin-day-number">วันที่ 7 (ครบ ${absoluteDay} วัน)</div>
          <div class="checkin-day-icon">${isCompleted ? '✅' : currentWeekReward.frameIcon}</div>
          <div class="checkin-day-reward" style="color: ${currentWeekReward.color}; font-size: 0.8rem; font-weight: 800;">
            ${currentWeekReward.frameName}
          </div>
          <div class="checkin-day-bonus">👑 ฉายา '${currentWeekReward.title}'</div>
        </div>
      `;
    }

    return `
      <div class="checkin-day-card ${isCompleted ? 'completed' : ''} ${isToday ? 'active-today' : ''}">
        <div class="checkin-day-number">วันที่ ${dayNum} (${absoluteDay} วัน)</div>
        <div class="checkin-day-icon">${isCompleted ? '✅' : icons[dayNum - 1]}</div>
        <div class="checkin-day-reward">สะสมสตรีค 🔥</div>
        <div class="checkin-day-bonus">วันที่ ${dayNum}/7 ของสัปดาห์ที่ ${currentWeek}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="checkin-header">
      <div>
        <h3 style="font-size: 1.35rem; margin-bottom: 0.25rem;">🗓️ ตารางล็อกอินสะสมรายวัน</h3>
        <p style="font-size: 0.875rem; color: var(--text-muted);">
          ${user ? `ผู้ใช้งาน: <strong>${user.name}</strong> ${isAdminUser ? '<span style="color: #eab308; font-weight: 800;">(👑 ผู้ดูแลระบบ - เข้าถึงของรางวัลทั้งหมดได้ทันที)</span>' : ''} | กำลังอยู่ที่: <strong>สัปดาห์ที่ ${currentWeek} (วันที่ ${dayInCycle || 1}/7)</strong> | เลขไฟสะสม: <strong>🔥 ${currentStreak} วัน</strong>` : 'กรุณาเข้าสู่ระบบเพื่อเริ่มล็อกอินสะสมสตรีคและรับของรางวัล'}
        </p>
      </div>
      <div>
        <div class="checkin-streak-badge">
          🔥 สตรีคสะสมต่อเนื่อง: ${currentStreak} วัน
        </div>
      </div>
    </div>

    <!-- Current Week 7-Day Cycle Grid -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
      <div style="font-weight: 800; font-size: 1.05rem;">
        📅 ปฏิทินสัปดาห์ที่ ${currentWeek}: <span style="color: ${currentWeekReward.color};">${currentWeekReward.weekName}</span>
      </div>
      <div style="font-size: 0.825rem; color: var(--text-muted);">
        เป้าหมายรางวัลใหญ่สัปดาห์นี้: <strong>${currentWeekReward.frameName}</strong> + ฉายา <strong>"${currentWeekReward.title}"</strong>
      </div>
    </div>

    <div class="checkin-days-grid">
      ${daysHtml}
    </div>

    <div style="text-align: center; margin-bottom: 1.75rem;">
      <button type="button" class="btn ${checkedInToday ? 'btn-outline' : 'btn-primary'} btn-lg" 
              onclick="handleDailyCheckIn()" ${checkedInToday ? 'disabled' : ''}>
        ${checkedInToday 
          ? `✅ วันนี้คุณจุดไฟสตรีคแล้ว 🔥 ${currentStreak} วัน (กลับมาเช็กอินใหม่พรุ่งนี้นะครับ!)` 
          : `🎁 กดเช็กอินสะสมสตรีควันนี้ (ก้าวสู่สตรีค 🔥 ${currentStreak + 1} วัน)`}
      </button>
    </div>

    <!-- Profile Frames Closet Showcase -->
    <div class="frames-closet-container">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <h4 style="font-size: 1.15rem;">🖼️ ตู้เสื้อผ้ากรอบรูปโปรไฟล์และฉายา (Profile Frames & Titles)</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted);">สมาชิกใหม่เริ่มต้นที่กรอบพื้นฐาน และปลดล็อกกรอบสีสะท้อนแสงสำหรับทั้ง 2 เดือนได้จากการล็อกอินครบ 7 วันในแต่ละสัปดาห์ ${isAdminUser ? '<strong style="color: #eab308;">(👑 คุณเป็นแอดมิน: สามารถสวมใส่ได้ทุกกรอบทันที)</strong>' : ''}</p>
        </div>
        <button type="button" class="btn btn-sm btn-outline" onclick="openProfileModal()">
          👤 ไปที่โปรไฟล์เพื่อเลือกกรอบ
        </button>
      </div>

      <div class="frames-closet-grid">
        ${PROFILE_FRAMES.map(f => {
          const isUnlocked = isAdminUser || (user && (user.unlockedFrames || ["frame-none"]).includes(f.id));
          const isEquipped = user && (user.equippedFrame || "frame-none") === f.id;
          return `
            <div class="frame-closet-card ${isEquipped ? 'equipped' : ''}">
              <img src="${user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" class="user-avatar ${f.id}" style="width: 52px; height: 52px; border-radius: 50%;">
              <div style="font-weight: 700; font-size: 0.9rem;">${f.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${f.desc}</div>
              <div style="margin-top: 0.25rem;">
                ${isEquipped 
                  ? '<span style="font-size: 0.75rem; color: #10b981; font-weight: 700;">✅ กำลังสวมใส่</span>' 
                  : (isUnlocked 
                      ? `<button type="button" class="btn btn-sm btn-outline" onclick="equipProfileFrame('${f.id}')">สวมใส่กรอบนี้ ${isAdminUser ? '👑' : ''}</button>`
                      : `<span style="font-size: 0.75rem; color: var(--text-muted);">🔒 ${f.unlockDesc || 'ยังไม่ปลดล็อก'}</span>`
                    )}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function handleDailyCheckIn() {
  if (!requireAuth("เช็กอินรายสัปดาห์")) return;

  const users = Store.get(STORAGE_KEYS.USERS, INITIAL_USERS);
  const currentUser = getCurrentUser();
  const user = users.find(u => u.id === currentUser.id);
  if (!user) return;

  const todayStr = getTodayDateString();

  // Strict check-in verification across logins/logouts
  if (hasUserCheckedInToday(user)) {
    showToast("วันนี้คุณได้ทำการล็อกอิน/เช็กอินประจำวันเรียบร้อยแล้ว! กลับมาใหม่ในวันพรุ่งนี้นะครับ 🎉", "info");
    return;
  }

  // Calculate continuous streak (เลขไฟเพิ่มขึ้นเรื่อยๆ)
  let newStreak = 1;
  if (user.lastCheckInDate) {
    const lastDate = new Date(user.lastCheckInDate);
    const todayDate = new Date(todayStr);
    const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      // Consecutive check-in: streak climbs continuously (1, 2, 3, ... 7, 8, ... 14, ... 56+)
      newStreak = (user.checkInStreak || 0) + 1;
    } else if (diffDays === 0) {
      newStreak = user.checkInStreak || 1;
    } else {
      // Missed streak: restart from 1
      newStreak = 1;
    }
  } else {
    newStreak = (user.checkInStreak || 0) + 1;
  }

  user.lastCheckInDate = todayStr;
  user.checkInStreak = newStreak;

  // Persist lock keys in localStorage to prevent repeated check-in across logouts/logins
  localStorage.setItem(`spu_last_checkin_${user.id}`, todayStr);
  if (user.email) {
    localStorage.setItem(`spu_last_checkin_email_${user.email.toLowerCase()}`, todayStr);
  }

  if (!user.unlockedFrames) user.unlockedFrames = ["frame-none"];
  if (!user.unlockedTitles) user.unlockedTitles = ["นักชิมมือใหม่"];

  let rewardMsg = "";
  // Check if Day 7 grand reward of any week (every multiple of 7: 7, 14, 21, 28, 35, 42, 49, 56, etc.)
  if (newStreak % 7 === 0) {
    const weekNum = Math.floor(newStreak / 7);
    const rewardIndex = Math.min(weekNum - 1, WEEKLY_REWARDS_CALENDAR.length - 1);
    const calendarReward = WEEKLY_REWARDS_CALENDAR[rewardIndex];

    if (calendarReward) {
      if (!user.unlockedFrames.includes(calendarReward.frameId)) {
        user.unlockedFrames.push(calendarReward.frameId);
      }
      user.equippedFrame = calendarReward.frameId;
      user.customTitle = calendarReward.title;
      if (!user.unlockedTitles.includes(calendarReward.title)) {
        user.unlockedTitles.push(calendarReward.title);
      }
      rewardMsg = ` 👑 ยินดีด้วยอย่างยิ่ง! สตรีคสะสมต่อเนื่องครบ ${newStreak} วัน (สัปดาห์ที่ ${weekNum}) ได้รับรางวัลใหญ่ [${calendarReward.frameName}] และฉายาสุดเท่ [${calendarReward.title}]!`;
    }
  } else {
    const dayInWeek = ((newStreak - 1) % 7) + 1;
    const currentWeek = Math.floor((newStreak - 1) / 7) + 1;
    rewardMsg = ` สะสมสตรีคต่อเนื่องวันที่ ${newStreak} (วันที่ ${dayInWeek}/7 ของสัปดาห์ที่ ${currentWeek}) ล็อกอินต่อเนื่องให้ครบ 7 วันเพื่อรับรางวัลใหญ่ประจำสัปดาห์!`;
  }

  // Check badges for streak milestone (e.g. canteen_hero on day 7)
  checkAndAwardBadges(user.id);

  // Save changes
  Store.set(STORAGE_KEYS.USERS, users);
  setCurrentUser(user);

  SoundFX.playWin();
  showToast(`🎉 เช็กอินสะสมสตรีคสำเร็จ! 🔥 เลขไฟสะสม: ${newStreak} วัน${rewardMsg}`, 'success');

  renderDailyCheckIn();
  renderLeaderboard();
  renderNavUser();
}

function equipProfileFrame(frameId) {
  if (!requireAuth("สวมใส่กรอบโปรไฟล์")) return;

  const users = Store.get(STORAGE_KEYS.USERS, INITIAL_USERS);
  const currentUser = getCurrentUser();
  const user = users.find(u => u.id === currentUser.id);
  if (!user) return;

  const isAdminUser = user.role === 'admin';

  if (!isAdminUser && (!user.unlockedFrames || !user.unlockedFrames.includes(frameId))) {
    showToast("กรอบนี้ยังไม่ได้ปลดล็อก กรุณาเช็กอินสะสมเพื่อปลดล็อกก่อน", "error");
    return;
  }

  if (isAdminUser) {
    if (!user.unlockedFrames) user.unlockedFrames = [];
    if (!user.unlockedFrames.includes(frameId)) user.unlockedFrames.push(frameId);
  }

  user.equippedFrame = frameId;
  Store.set(STORAGE_KEYS.USERS, users);
  setCurrentUser(user);

  SoundFX.playMatch();
  showToast(isAdminUser ? "👑 สวมใส่กรอบรูปโปรไฟล์สำเร็จด้วยสิทธิ์ผู้ดูแลระบบ (Admin)!" : "เปลี่ยนกรอบรูปโปรไฟล์เรียบร้อยแล้ว!", "success");

  renderNavUser();
  renderDailyCheckIn();
  const profileModal = document.getElementById('profileModal');
  if (profileModal && profileModal.classList.contains('active')) {
    openProfileModal();
  }
}

// ============================================================================
// 12. News & Campus Promotions Section
// ============================================================================

function renderNewsGrid() {
  const grid = document.getElementById('newsGrid');
  if (!grid) return;

  const newsList = Store.get(STORAGE_KEYS.NEWS, INITIAL_NEWS);

  grid.innerHTML = newsList.map(item => `
    <div class="news-card">
      <img src="${item.image}" alt="${item.title}" class="news-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500'">
      <div class="news-body">
        <span class="news-tag">${item.tag}</span>
        <h3 class="news-title">${item.title}</h3>
        <p class="news-desc">${item.content}</p>
        <div class="news-date">📅 ${item.date}</div>
      </div>
    </div>
  `).join('');
}

function openAddNewsModal() {
  if (!isAdmin()) {
    showToast('ฟีเจอร์นี้สงวนไว้สำหรับผู้ดูแลระบบ (Admin) เท่านั้น', 'error');
    openAuthModal();
    return;
  }
  openModal('newsFormModal');
}

function handleNewsSubmit(event) {
  event.preventDefault();
  if (!isAdmin()) return;

  const title = document.getElementById('newsTitle').value.trim();
  const tag = document.getElementById('newsTag').value.trim();
  const content = document.getElementById('newsContent').value.trim();
  const image = document.getElementById('newsImage').value.trim();

  const newsList = Store.get(STORAGE_KEYS.NEWS, INITIAL_NEWS);
  const nowStr = new Date().toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });

  const newItem = {
    id: `news_${Date.now()}`,
    title,
    tag,
    content,
    image,
    date: nowStr,
    active: true
  };

  newsList.unshift(newItem);
  Store.set(STORAGE_KEYS.NEWS, newsList);
  closeModal('newsFormModal');
  showToast('เผยแพร่ข่าวสารเรียบร้อยแล้ว!', 'success');
  renderNewsGrid();
  renderAdminNews();
}

// ============================================================================
// 13. User Profile Modal & Avatar Upload
// ============================================================================

function triggerProfilePhotoUpload() {
  const fileInput = document.getElementById('profilePhotoFileInput');
  if (fileInput) fileInput.click();
}

function handleProfilePhotoUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (file.size > 3 * 1024 * 1024) {
    showToast("ไฟล์รูปภาพมีขนาดใหญ่เกินไป (กรุณาเลือกรูปขนาดไม่เกิน 3MB)", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64Url = e.target.result;
    saveUserProfileAvatar(base64Url);
  };
  reader.readAsDataURL(file);
}

function promptProfilePhotoUrl() {
  const currentUser = getCurrentUser();
  const url = prompt("กรุณาระบุลิงก์รูปภาพโปรไฟล์ของคุณ (Image URL):", currentUser?.avatar || "");
  if (url && url.trim()) {
    saveUserProfileAvatar(url.trim());
  }
}

function saveUserProfileAvatar(imageUrl) {
  const users = Store.get(STORAGE_KEYS.USERS, INITIAL_USERS);
  const currentUser = getCurrentUser();
  const user = users.find(u => u.id === currentUser.id);
  if (!user) return;

  user.avatar = imageUrl;
  Store.set(STORAGE_KEYS.USERS, users);
  setCurrentUser(user);

  SoundFX.playMatch();
  showToast("อัปเดตรูปโปรไฟล์ของคุณเรียบร้อยแล้ว! 📸", "success");

  renderNavUser();
  renderDailyCheckIn();
  renderLeaderboard();
  openProfileModal();
}

function openProfileModal() {
  const user = getCurrentUser();
  if (!user) {
    openAuthModal();
    return;
  }

  const body = document.getElementById('profileModalBody');
  if (!body) return;

  const restaurants = Store.get(STORAGE_KEYS.RESTAURANTS, INITIAL_RESTAURANTS);
  const userFavs = restaurants.filter(r => (user.favorites || []).includes(r.id));
  const reviews = Store.get(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS).filter(r => r.userId === user.id);
  const isAdminUser = user.role === 'admin';
  const userUnlockedFrames = isAdminUser ? PROFILE_FRAMES.map(f => f.id) : (user.unlockedFrames || ["frame-none"]);
  const allAvailableTitles = isAdminUser
    ? Array.from(new Set([
        ...(user.unlockedTitles || []),
        "นักชิมมือใหม่",
        "SPU Food Master",
        ...WEEKLY_REWARDS_CALENDAR.map(w => w.title),
        "เซียนรีวิวอาหาร",
        "ฮีโร่โรงอาหาร"
      ]))
    : (user.unlockedTitles || ["นักชิมมือใหม่"]);

  body.innerHTML = `
    <div style="display: flex; align-items: center; gap: 1.5rem; padding-bottom: 1.5rem; border-bottom: 2px solid var(--border-color); margin-bottom: 1.5rem; flex-wrap: wrap;">
      <div style="position: relative; display: inline-block;">
        <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" class="user-avatar ${user.equippedFrame || ''}" style="width: 86px; height: 86px; border-radius: 50%; object-fit: cover;">
      </div>
      <div style="flex-grow: 1;">
        <h3 style="font-size: 1.4rem; margin-bottom: 0.25rem;">${user.name}</h3>
        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.35rem;">
          📧 ${user.email} | สถานะ: <span style="color: var(--primary); font-weight: 700;">${user.userType || 'นักศึกษา'}</span> (${user.role === 'admin' ? '👑 ผู้ดูแลระบบ (Admin)' : user.role})
        </div>
        <div style="font-size: 0.85rem; color: var(--primary); font-weight: 700; margin-bottom: 0.5rem;">
          🎖️ ฉายาปัจจุบัน: ${user.customTitle || 'นักชิมมือใหม่'} | 🔥 สตรีคเช็กอิน: ${user.checkInStreak || 0} วัน
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
          <span style="background: var(--primary-light); color: var(--primary); font-weight: 700; padding: 0.2rem 0.6rem; border-radius: var(--radius-full); font-size: 0.85rem;">
            🔥 สตรีค: ${user.checkInStreak || 0} วัน
          </span>
          <span style="background: var(--bg-surface-alt); border: 1.5px solid var(--border-color); color: var(--text-main); font-weight: 700; padding: 0.2rem 0.6rem; border-radius: var(--radius-full); font-size: 0.85rem;">
            💬 รีวิวแล้ว: ${reviews.length} ร้าน
          </span>
          <span style="background: var(--bg-surface-alt); border: 1.5px solid var(--border-color); color: var(--text-main); font-weight: 700; padding: 0.2rem 0.6rem; border-radius: var(--radius-full); font-size: 0.85rem;">
            🎖️ ปลดล็อกแล้ว ${(user.badges || []).length} บัดจ์
          </span>
        </div>

        <!-- Custom Title Selector -->
        <div style="margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">เลือกสวมใส่ฉายา:</span>
          <select class="form-control" style="width: auto; padding: 0.25rem 0.65rem; font-size: 0.85rem;" onchange="setUserActiveTitle(this.value)">
            ${allAvailableTitles.map(t => `
              <option value="${t}" ${user.customTitle === t ? 'selected' : ''}>🎖️ ${t} ${isAdminUser ? '👑' : ''}</option>
            `).join('')}
          </select>
        </div>

        <!-- Photo Upload Controls -->
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button type="button" class="btn btn-sm btn-outline" onclick="triggerProfilePhotoUpload()">
            📷 อัปโหลดรูปภาพตัวเอง (จากเครื่อง)
          </button>
          <input type="file" id="profilePhotoFileInput" accept="image/*" style="display: none;" onchange="handleProfilePhotoUpload(event)">
          <button type="button" class="btn btn-sm btn-outline" onclick="promptProfilePhotoUrl()">
            🌐 ใส่ลิงก์รูป (URL)
          </button>
        </div>
      </div>
    </div>

    <!-- Tabs inside Profile -->
    <div class="tab-nav">
      <button type="button" class="tab-btn active" onclick="switchProfileTab('profFavsTab', this)">❤️ ร้านโปรดของฉัน (${userFavs.length})</button>
      <button type="button" class="tab-btn" onclick="switchProfileTab('profReviewsTab', this)">💬 รีวิวของฉัน (${reviews.length})</button>
      <button type="button" class="tab-btn" onclick="switchProfileTab('profFramesTab', this)">🖼️ กรอบรูปโปรไฟล์ (${userUnlockedFrames.length})</button>
    </div>

    <div class="tab-pane active" id="profFavsTab">
      ${userFavs.length === 0 ? '<div style="color: var(--text-muted); padding: 1.5rem; text-align: center;">คุณยังไม่มีร้านโปรด กดไอคอนหัวใจที่หน้าร้านอาหารเพื่อบันทึกร้านโปรดได้เลย</div>' : ''}
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem;">
        ${userFavs.map(rst => `
          <div style="display: flex; gap: 0.75rem; background: var(--bg-surface-alt); padding: 0.75rem; border-radius: var(--radius-md); border: 2px solid var(--border-color); align-items: center;">
            <img src="${rst.image}" style="width: 50px; height: 50px; border-radius: var(--radius-sm); object-fit: cover;">
            <div style="flex-grow: 1;">
              <div style="font-weight: 700; font-size: 0.9rem;">${rst.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${rst.location}</div>
            </div>
            <button type="button" class="btn btn-sm btn-outline" onclick="closeModal('profileModal'); openRestaurantDetail('${rst.id}')">ดู</button>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="tab-pane" id="profReviewsTab">
      ${reviews.length === 0 ? '<div style="color: var(--text-muted); padding: 1.5rem; text-align: center;">คุณยังไม่เคยเขียนรีวิว ร่วมรีวิวร้านโปรดเพื่อช่วยเพื่อนๆ เลือกร้านอร่อยและรับบัดจ์นักรีวิวกันเถอะ!</div>' : ''}
      ${reviews.map(rev => {
        const targetRst = restaurants.find(r => r.id === rev.restaurantId);
        return `
          <div style="padding: 1rem; border-bottom: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
              <strong>${targetRst ? targetRst.name : 'ร้านอาหารใน SPU'}</strong>
              <span style="color: #f59e0b;">${getStarSymbols(rev.rating)}</span>
            </div>
            <div style="font-size: 0.875rem; color: var(--text-main); margin-bottom: 0.5rem;">${rev.comment}</div>
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted);">
              <span>📅 ${rev.date}</span>
              <button type="button" style="color: #ef4444; font-weight: 600;" onclick="deleteMyReview('${rev.id}'); openProfileModal();">🗑️ ลบรีวิวนี้</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- TAB 3: Profile Frames Closet -->
    <div class="tab-pane" id="profFramesTab">
      <div style="margin-bottom: 1rem; font-size: 0.875rem; color: var(--text-muted);">
        เลือกกรอบรูปโปรไฟล์ที่คุณต้องการสวมใส่ กรอบที่สวมใส่จะแสดงบนรูปโปรไฟล์ของคุณทั่วทั้งเว็บไซต์ ${isAdminUser ? '<strong style="color: #eab308;">(👑 ยศแอดมิน: คุณมีสิทธิ์เข้าถึงและสวมใส่ได้ทุกกรอบทันที)</strong>' : ''}
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">
        ${PROFILE_FRAMES.map(f => {
          const isUnlocked = isAdminUser || userUnlockedFrames.includes(f.id);
          const isEquipped = (user.equippedFrame || 'frame-none') === f.id;
          return `
            <div style="background: var(--bg-surface-alt); border: 2px solid ${isEquipped ? 'var(--primary)' : 'var(--border-color)'}; padding: 1rem; border-radius: var(--radius-lg); text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.4rem;">
              <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" class="user-avatar ${f.id}" style="width: 52px; height: 52px; border-radius: 50%; margin-bottom: 0.25rem;">
              <div style="font-weight: 700; font-size: 0.875rem;">${f.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${f.desc}</div>
              <div style="margin-top: 0.5rem;">
                ${isEquipped 
                  ? '<span style="font-size: 0.8rem; color: #10b981; font-weight: 800;">✅ กำลังสวมใส่</span>' 
                  : (isUnlocked 
                      ? `<button type="button" class="btn btn-sm btn-primary" onclick="equipProfileFrame('${f.id}')">สวมใส่กรอบนี้ ${isAdminUser ? '👑' : ''}</button>` 
                      : `<span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">🔒 ${f.unlockDesc || 'ยังไม่ปลดล็อก'}</span>`
                    )}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  openModal('profileModal');
}

function setUserActiveTitle(title) {
  const users = Store.get(STORAGE_KEYS.USERS, INITIAL_USERS);
  const currentUser = getCurrentUser();
  const user = users.find(u => u.id === currentUser.id);
  if (!user) return;

  user.customTitle = title;
  Store.set(STORAGE_KEYS.USERS, users);
  setCurrentUser(user);

  showToast(`เปลี่ยนฉายาเป็น "${title}" เรียบร้อยแล้ว! ✨`, "success");
  renderNavUser();
  renderLeaderboard();
  openProfileModal();
}

function switchProfileTab(tabId, btn) {
  document.querySelectorAll('#profileModalBody .tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#profileModalBody .tab-pane').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const target = document.getElementById(tabId);
  if (target) target.classList.add('active');
}

// ============================================================================
// 14. Comprehensive Admin Dashboard Engine
// ============================================================================

function openAdminModal() {
  if (!isAdmin()) {
    openAdminAccessModal();
    return;
  }

  renderAdminStats();
  renderAdminUsers();
  renderAdminRestaurantsTable();
  renderAdminReviews();
  renderAdminNews();
  renderAdminThemePicker();
  populateAdminSiteTexts();
  openModal('adminModal');
}

function switchAdminTab(tabId, btn) {
  document.querySelectorAll('#adminModal .tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#adminModal .tab-pane').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const target = document.getElementById(tabId);
  if (target) target.classList.add('active');
}

function renderAdminStats() {
  const container = document.getElementById('adminStatsGrid');
  if (!container) return;

  const restaurants = Store.get(STORAGE_KEYS.RESTAURANTS, INITIAL_RESTAURANTS);
  const reviews = Store.get(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
  const news = Store.get(STORAGE_KEYS.NEWS, INITIAL_NEWS);
  const users = Store.get(STORAGE_KEYS.USERS, INITIAL_USERS);
  const analytics = getAnalytics();
  const reportedReviews = reviews.filter(r => r.reported);

  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon" style="color: #0284c7; background: #e0f2fe;">👀</div>
      <div>
        <div class="stat-val" style="color: #0369a1;">${(analytics.pageViews || 1).toLocaleString()}</div>
        <div class="stat-label">ยอดเข้าชมเว็บทั้งหมด (Page Views)</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="color: #059669; background: #d1fae5;">👥</div>
      <div>
        <div class="stat-val" style="color: #047857;">${(analytics.uniqueVisitors || 1).toLocaleString()}</div>
        <div class="stat-label">ผู้เข้าชมไม่ซ้ำ (Unique Visitors)</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🏬</div>
      <div>
        <div class="stat-val">${restaurants.length}</div>
        <div class="stat-label">ร้านอาหารใน SPU</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">💬</div>
      <div>
        <div class="stat-val">${reviews.length}</div>
        <div class="stat-label">รีวิวทั้งหมด</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="color: #ef4444; background: #fee2e2;">⚠️</div>
      <div>
        <div class="stat-val" style="color: #dc2626;">${reportedReviews.length}</div>
        <div class="stat-label">รีวิวที่ถูกรายงาน</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🎓</div>
      <div>
        <div class="stat-val">${users.length}</div>
        <div class="stat-label">สมาชิกและผู้สมัคร</div>
      </div>
    </div>
  `;
}

function renderAdminUsers() {
  const tbody = document.getElementById('adminUsersTableBody');
  const statsRow = document.getElementById('adminUserStatsRow');
  if (!tbody) return;

  const users = Store.get(STORAGE_KEYS.USERS, INITIAL_USERS);
  const roleFilter = document.getElementById('adminUserRoleFilter')?.value || 'all';
  const facultyFilter = document.getElementById('adminUserFacultyFilter')?.value || 'all';
  const searchQuery = (document.getElementById('adminUserSearch')?.value || '').toLowerCase().trim();

  // Filter
  const filtered = users.filter(u => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchFaculty = facultyFilter === 'all' || (u.faculty && u.faculty.includes(facultyFilter));
    const matchSearch = !searchQuery || 
      (u.name && u.name.toLowerCase().includes(searchQuery)) ||
      (u.studentId && u.studentId.toLowerCase().includes(searchQuery)) ||
      (u.faculty && u.faculty.toLowerCase().includes(searchQuery)) ||
      (u.email && u.email.toLowerCase().includes(searchQuery)) ||
      (u.userType && u.userType.toLowerCase().includes(searchQuery));
    return matchRole && matchFaculty && matchSearch;
  });

  // Calculate user stats
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const studentCount = users.filter(u => u.userType === 'นักศึกษา').length;
  const totalStreaks = users.reduce((sum, u) => sum + (Number(u.checkInStreak) || 0), 0);

  if (statsRow) {
    statsRow.innerHTML = `
      <div style="background: var(--bg-surface-alt); padding: 0.75rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">ผู้สมัครและสมาชิกทั้งหมด</div>
        <div style="font-size: 1.3rem; font-weight: 800; color: var(--text-main);">${totalUsers} คน</div>
      </div>
      <div style="background: var(--bg-surface-alt); padding: 0.75rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">ผู้ดูแล (Admins)</div>
        <div style="font-size: 1.3rem; font-weight: 800; color: #7c3aed;">${adminCount} คน</div>
      </div>
      <div style="background: var(--bg-surface-alt); padding: 0.75rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">นักศึกษา SPU</div>
        <div style="font-size: 1.3rem; font-weight: 800; color: var(--primary);">${studentCount} คน</div>
      </div>
      <div style="background: var(--bg-surface-alt); padding: 0.75rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">สตรีคล็อกอินสะสมรวม</div>
        <div style="font-size: 1.3rem; font-weight: 800; color: var(--primary);">🔥 ${totalStreaks} วัน</div>
      </div>
    `;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          ไม่พบสมาชิกหรือผู้สมัครที่ตรงกับเงื่อนไขการค้นหา
        </td>
      </tr>
    `;
    return;
  }

  const currentUser = getCurrentUser();

  tbody.innerHTML = filtered.map(u => {
    const isSelf = currentUser && currentUser.id === u.id;
    const isAdminUser = u.role === 'admin';
    const roleBadge = isAdminUser
      ? `<span style="background: #ede9fe; color: #6d28d9; padding: 0.2rem 0.5rem; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700;">👑 Admin</span>`
      : `<span style="background: var(--bg-surface-alt); color: var(--text-muted); padding: 0.2rem 0.5rem; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600;">🎓 Member</span>`;

    const registerDate = u.createdAt || "01 พ.ย. 2026";
    const studentId = u.studentId || '-';
    const faculty = u.faculty || 'ม.ศรีปทุม';
    const phone = u.phone || '-';

    return `
      <tr>
        <td>
          <img src="${u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" class="user-avatar ${u.equippedFrame || ''}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
        </td>
        <td>
          <div style="font-weight: 700;">${u.name} ${isSelf ? '<span style="font-size: 0.7rem; color: var(--primary); font-weight: 700;">(คุณ)</span>' : ''}</div>
          <div style="font-size: 0.75rem; color: var(--primary); font-family: monospace;">🆔 ${studentId}</div>
        </td>
        <td>
          <div style="font-size: 0.85rem; font-weight: 600;">${faculty}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${u.status || 'อนุมัติแล้ว'}</div>
        </td>
        <td>
          <div style="font-family: monospace; font-size: 0.8rem;">✉️ ${u.email}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">📞 ${phone}</div>
        </td>
        <td><span style="font-size: 0.8rem; background: var(--bg-surface-alt); padding: 0.2rem 0.5rem; border-radius: 4px;">${u.userType || 'นักศึกษา'}</span></td>
        <td>${roleBadge}</td>
        <td>
          <span style="font-weight: 700; color: var(--primary);">🔥 ${u.checkInStreak || 0}/7 วัน</span>
          <div style="font-size: 0.75rem; color: var(--text-muted);">🏷️ ${u.customTitle || 'นักชิมมือใหม่'}</div>
        </td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${registerDate}</td>
        <td>
          <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
            <button type="button" class="btn btn-sm btn-primary" onclick="openApplicantDetailModal('${u.id}')" title="ดูข้อมูลใบสมัครและโปรไฟล์">
              👁️ ใบสมัคร
            </button>
            <button type="button" class="btn btn-sm btn-outline" onclick="adminToggleUserRole('${u.id}')" title="สลับสิทธิ์ Admin / User">
              ${isAdminUser ? 'ปลดแอดมิน' : 'แต่งตั้งแอดมิน'}
            </button>
            <button type="button" class="btn btn-sm btn-outline" onclick="adminResetUserPassword('${u.id}')" title="รีเซ็ตรหัสผ่าน">
              🔑 รหัส
            </button>
            ${!isSelf ? `
              <button type="button" class="btn btn-sm btn-outline btn-danger" onclick="adminDeleteUser('${u.id}')" title="ลบบัญชีผู้ใช้นี้">
                🗑️ ลบ
              </button>
            ` : '<span style="font-size: 0.75rem; color: var(--text-muted); padding: 0.3rem;">คุณ</span>'}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openApplicantDetailModal(userId) {
  const users = Store.get(STORAGE_KEYS.USERS, INITIAL_USERS);
  const u = users.find(user => user.id === userId);
  if (!u) return;

  const reviews = Store.get(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
  const userReviews = reviews.filter(r => r.userId === userId);
  const body = document.getElementById('applicantDetailBody');
  if (!body) return;

  body.innerHTML = `
    <div style="display: flex; gap: 1.5rem; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
      <img src="${u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" class="user-avatar ${u.equippedFrame || ''}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">
      <div>
        <div style="font-size: 1.35rem; font-weight: 800; color: var(--text-color);">${u.name}</div>
        <div style="color: var(--primary); font-weight: 700; font-size: 0.95rem; margin-top: 2px;">🆔 รหัสนักศึกษา/สมาชิก: ${u.studentId || '-'}</div>
        <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">🏛️ สังกัด: ${u.faculty || 'ม.ศรีปทุม'} | ประเภท: ${u.userType || 'นักศึกษา'}</div>
        <div style="margin-top: 0.5rem; display: flex; gap: 0.4rem; flex-wrap: wrap;">
          <span style="background: ${u.role === 'admin' ? '#ede9fe' : 'var(--primary-light)'}; color: ${u.role === 'admin' ? '#6d28d9' : 'var(--primary)'}; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">
            ${u.role === 'admin' ? '👑 ผู้ดูแลระบบ (Admin)' : '🎓 สมาชิกทั่วไป (Student/Member)'}
          </span>
          <span style="background: #ecfdf5; color: #047857; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">
            ✅ ${u.status || 'อนุมัติแล้ว'}
          </span>
          <span style="background: var(--bg-surface-alt); color: var(--text-color); padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
            🏷️ ${u.customTitle || 'นักชิมมือใหม่'}
          </span>
        </div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
      <div style="background: var(--bg-surface-alt); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.35rem;">ข้อมูลการติดต่อ (Contact Info)</div>
        <div style="font-size: 0.9rem; margin-bottom: 0.25rem;"><strong>อีเมล:</strong> ${u.email}</div>
        <div style="font-size: 0.9rem;"><strong>เบอร์โทรศัพท์:</strong> ${u.phone || '-'}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem;"><strong>วันที่สมัคร:</strong> ${u.createdAt || '-'}</div>
      </div>

      <div style="background: var(--bg-surface-alt); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.35rem;">สถิติการใช้งาน (Engagement Stats)</div>
        <div style="font-size: 0.9rem; margin-bottom: 0.25rem;"><strong>สตรีคล็อกอินรายสัปดาห์:</strong> 🔥 ${u.checkInStreak || 0}/7 วัน</div>
        <div style="font-size: 0.9rem; margin-bottom: 0.25rem;"><strong>รีวิวที่เขียน:</strong> 💬 ${userReviews.length} รีวิว</div>
        <div style="font-size: 0.9rem;"><strong>ร้านโปรดที่บันทึก:</strong> ❤️ ${(u.favorites || []).length} ร้าน</div>
      </div>
    </div>

    <div style="background: var(--bg-surface-alt); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 1.5rem;">
      <div style="font-size: 0.85rem; font-weight: 700; margin-bottom: 0.5rem;">🎖️ บัดจ์เกียรติยศและกรอบรูปที่ครอบครอง</div>
      <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">
        บัดจ์: ${(u.badges || []).map(bId => {
          const b = BADGES_LIST.find(x => x.id === bId);
          return `<span style="display: inline-block; background: var(--bg-card); padding: 0.2rem 0.5rem; border-radius: 4px; margin: 2px; border: 1px solid var(--border-color); font-weight: 600;">${b ? b.icon + ' ' + b.name : bId}</span>`;
        }).join(' ')}
      </div>
      <div style="font-size: 0.85rem; color: var(--text-muted);">
        กรอบที่ปลดล็อก: ${(u.unlockedFrames || ['frame-none']).map(fId => {
          const f = PROFILE_FRAMES.find(x => x.id === fId);
          return `<span style="display: inline-block; background: var(--bg-card); padding: 0.2rem 0.5rem; border-radius: 4px; margin: 2px; border: 1px solid var(--border-color);">${f ? f.name : fId}</span>`;
        }).join(' ')}
      </div>
    </div>

    <div style="text-align: right;">
      <button type="button" class="btn btn-outline btn-sm" onclick="closeModal('applicantDetailModal')">ปิดหน้าต่าง</button>
    </div>
  `;

  openModal('applicantDetailModal');
}

function adminToggleUserRole(userId) {
  const users = Store.get(STORAGE_KEYS.USERS, INITIAL_USERS);
  const target = users.find(u => u.id === userId);
  if (!target) return;

  const newRole = target.role === 'admin' ? 'student' : 'admin';
  const roleName = newRole === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'ผู้ใช้ทั่วไป (Student)';
  
  if (!confirm(`คุณต้องการเปลี่ยนสิทธิ์ของ "${target.name}" เป็น "${roleName}" ใช่หรือไม่?`)) return;

  target.role = newRole;
  Store.set(STORAGE_KEYS.USERS, users);

  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    currentUser.role = newRole;
    setCurrentUser(currentUser);
  }

  showToast(`อัปเดตสิทธิ์ของ "${target.name}" เป็น ${roleName} เรียบร้อยแล้ว`, 'success');
  renderAdminUsers();
  renderAdminStats();
  renderNavUser();
}

function adminEditUserTitle(userId) {
  const users = Store.get(STORAGE_KEYS.USERS, INITIAL_USERS);
  const target = users.find(u => u.id === userId);
  if (!target) return;

  const current = target.customTitle || "นักชิมมือใหม่";
  const input = prompt(`แก้ไขฉายาของ "${target.name}":`, current);
  if (input === null || !input.trim()) return;

  const newTitle = input.trim();
  target.customTitle = newTitle;
  if (!target.unlockedTitles) target.unlockedTitles = ["นักชิมมือใหม่"];
  if (!target.unlockedTitles.includes(newTitle)) {
    target.unlockedTitles.push(newTitle);
  }

  Store.set(STORAGE_KEYS.USERS, users);

  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    currentUser.customTitle = newTitle;
    currentUser.unlockedTitles = target.unlockedTitles;
    setCurrentUser(currentUser);
  }

  showToast(`อัปเดตฉายาของ "${target.name}" เป็น "${newTitle}" สำเร็จ`, 'success');
  renderAdminUsers();
  renderLeaderboard();
  renderNavUser();
}

function adminResetUserPassword(userId) {
  const users = Store.get(STORAGE_KEYS.USERS, INITIAL_USERS);
  const target = users.find(u => u.id === userId);
  if (!target) return;

  const newPassword = prompt(`ตั้งรหัสผ่านใหม่สำหรับ "${target.name}" (อย่างน้อย 8 ตัวอักษร):`, "password123");
  if (!newPassword) return;

  if (newPassword.length < 8) {
    showToast('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร', 'error');
    return;
  }

  target.password = newPassword;
  Store.set(STORAGE_KEYS.USERS, users);

  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    currentUser.password = newPassword;
    setCurrentUser(currentUser);
  }

  showToast(`รีเซ็ตรหัสผ่านของ "${target.name}" เรียบร้อยแล้ว`, 'success');
}

function adminDeleteUser(userId) {
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    showToast('ไม่สามารถลบบัญชีแอดมินที่กำลังใช้งานอยู่ในขณะนี้ได้', 'error');
    return;
  }

  const users = Store.get(STORAGE_KEYS.USERS, INITIAL_USERS);
  const target = users.find(u => u.id === userId);
  if (!target) return;

  if (!confirm(`⚠️ ยืนยันการลบบัญชี "${target.name}" (${target.email}) ออกจากระบบอย่างถาวร?`)) return;

  const updated = users.filter(u => u.id !== userId);
  Store.set(STORAGE_KEYS.USERS, updated);

  showToast(`ลบบัญชี "${target.name}" เรียบร้อยแล้ว`, 'info');
  renderAdminUsers();
  renderAdminStats();
  renderLeaderboard();
}

function renderAdminRestaurantsTable() {
  const tbody = document.getElementById('adminRestaurantTableBody');
  if (!tbody) return;

  const restaurants = Store.get(STORAGE_KEYS.RESTAURANTS, INITIAL_RESTAURANTS);

  tbody.innerHTML = restaurants.map(rst => {
    const stats = calculateRestaurantRating(rst.id);
    return `
      <tr>
        <td>
          <img src="${rst.image}" style="width: 44px; height: 44px; border-radius: var(--radius-sm); object-fit: cover;">
        </td>
        <td><strong>${rst.name}</strong></td>
        <td>${rst.location}</td>
        <td><span style="font-size: 0.8rem; background: var(--bg-surface-alt); padding: 0.2rem 0.5rem; border-radius: 4px;">${rst.category}</span></td>
        <td>⭐ ${stats.count > 0 ? stats.avg.toFixed(1) : rst.rating.toFixed(1)}</td>
        <td>${(rst.menus || []).length} เมนู</td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button type="button" class="btn btn-sm btn-outline" onclick="openEditRestaurantModal('${rst.id}')">✏️ แก้ไข</button>
            <button type="button" class="btn btn-sm btn-outline btn-danger" onclick="adminDeleteRestaurant('${rst.id}')">🗑️ ลบ</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

let rstFormCurrentImages = [];

function renderRestaurantFormImages() {
  const grid = document.getElementById('rstFormImagesGrid');
  const countBadge = document.getElementById('rstImageCountBadge');
  const hiddenInput = document.getElementById('rstImage');

  if (countBadge) {
    countBadge.textContent = `${rstFormCurrentImages.length}/5 รูป`;
  }
  if (hiddenInput) {
    hiddenInput.value = rstFormCurrentImages[0] || '';
  }

  if (!grid) return;

  if (rstFormCurrentImages.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.825rem; background: var(--bg-surface); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
        ยังไม่มีรูปภาพที่เลือก กรุณาอัปโหลดไฟล์รูปภาพหรือใส่ลิงก์รูปภาพ (เพิ่มได้สูงสุด 5 รูป)
      </div>
    `;
    return;
  }

  grid.innerHTML = rstFormCurrentImages.map((img, idx) => `
    <div style="position: relative; border-radius: var(--radius-md); overflow: hidden; border: 2px solid ${idx === 0 ? 'var(--primary)' : 'var(--border-color)'}; background: #000; aspect-ratio: 4/3; box-shadow: var(--shadow-sm);">
      <img src="${img}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'">
      
      <!-- Cover Badge for 1st image -->
      ${idx === 0 ? `
        <span style="position: absolute; top: 4px; left: 4px; background: var(--primary); color: #fff; font-size: 0.65rem; font-weight: 800; padding: 0.15rem 0.45rem; border-radius: var(--radius-full); box-shadow: 0 1px 3px rgba(0,0,0,0.4);">
          ⭐ หน้าปก
        </span>
      ` : `
        <button type="button" onclick="setRestaurantPrimaryImage(${idx})" style="position: absolute; top: 4px; left: 4px; background: rgba(0,0,0,0.65); color: #fff; border: none; font-size: 0.65rem; font-weight: 700; padding: 0.15rem 0.4rem; border-radius: var(--radius-full); cursor: pointer;" title="ตั้งรูปนี้เป็นรูปหน้าปก">
          ตั้งเป็นปก
        </button>
      `}

      <!-- Delete Button -->
      <button type="button" onclick="removeRestaurantFormImage(${idx})" style="position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border-radius: 50%; background: rgba(239, 68, 68, 0.85); color: #fff; border: none; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; cursor: pointer; line-height: 1;" title="ลบรูปนี้">
        ✕
      </button>

      <!-- Image number -->
      <span style="position: absolute; bottom: 4px; right: 4px; background: rgba(0,0,0,0.6); color: #fff; font-size: 0.65rem; padding: 0.1rem 0.35rem; border-radius: 3px;">
        #${idx + 1}
      </span>
    </div>
  `).join('');
}

function handleRestaurantMultiFileUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  const remainingSlots = 5 - rstFormCurrentImages.length;
  if (remainingSlots <= 0) {
    showToast('คุณเพิ่มรูปภาพครบจำนวนสูงสุด 5 รูปแล้ว หากต้องการเพิ่มรูปใหม่ กรุณาลบรูปเดิมออกก่อน', 'warning');
    return;
  }

  const filesToRead = Array.from(files).slice(0, remainingSlots);
  let readCount = 0;

  filesToRead.forEach(file => {
    if (!file.type.startsWith('image/')) {
      showToast(`ข้ามไฟล์ "${file.name}" เนื่องจากไม่ใช่รูปภาพ`, 'warning');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast(`ไฟล์ "${file.name}" มีขนาดใหญ่เกิน 8MB`, 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      if (rstFormCurrentImages.length < 5) {
        rstFormCurrentImages.push(e.target.result);
      }
      readCount++;
      if (readCount === filesToRead.length) {
        renderRestaurantFormImages();
        SoundFX.playMatch();
        showToast(`อัปโหลดรูปภาพร้านเรียบร้อยแล้ว (${rstFormCurrentImages.length}/5 รูป)`, 'success');
      }
    };
    reader.readAsDataURL(file);
  });

  // Reset file inputs
  event.target.value = '';
}

// Backward compatibility alias
function handleRestaurantImageFileUpload(event) {
  return handleRestaurantMultiFileUpload(event);
}

function addRestaurantImageFromUrl() {
  const input = document.getElementById('rstImageUrlInput');
  if (!input) return;
  const url = input.value.trim();

  if (!url) {
    showToast('กรุณากรอกลิงก์รูปภาพ (Image URL)', 'warning');
    return;
  }
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image')) {
    showToast('ลิงก์รูปภาพต้องขึ้นต้นด้วย http:// หรือ https://', 'error');
    return;
  }
  if (rstFormCurrentImages.length >= 5) {
    showToast('สามารถเพิ่มรูปภาพได้สูงสุด 5 รูปเท่านั้น', 'warning');
    return;
  }

  rstFormCurrentImages.push(url);
  input.value = '';
  renderRestaurantFormImages();
  SoundFX.playTick();
  showToast(`เพิ่มลิงก์รูปภาพสำเร็จ (${rstFormCurrentImages.length}/5 รูป)`, 'success');
}

function removeRestaurantFormImage(index) {
  if (index >= 0 && index < rstFormCurrentImages.length) {
    rstFormCurrentImages.splice(index, 1);
    renderRestaurantFormImages();
    SoundFX.playTick();
    showToast('ลบรูปภาพเรียบร้อยแล้ว', 'info');
  }
}

function setRestaurantPrimaryImage(index) {
  if (index > 0 && index < rstFormCurrentImages.length) {
    const chosen = rstFormCurrentImages.splice(index, 1)[0];
    rstFormCurrentImages.unshift(chosen);
    renderRestaurantFormImages();
    SoundFX.playMatch();
    showToast('ตั้งเป็นรูปหน้าปกหลักเรียบร้อย ⭐', 'success');
  }
}

function clearRestaurantImageUpload() {
  rstFormCurrentImages = [];
  const fileInput1 = document.getElementById('rstImageFilesInput');
  const fileInput2 = document.getElementById('rstImageFile');
  const rstImageInput = document.getElementById('rstImage');
  const urlInput = document.getElementById('rstImageUrlInput');

  if (fileInput1) fileInput1.value = '';
  if (fileInput2) fileInput2.value = '';
  if (rstImageInput) rstImageInput.value = '';
  if (urlInput) urlInput.value = '';
  renderRestaurantFormImages();
}

function previewRestaurantImageUrl(url) {
  if (url && url.trim().length > 5) {
    if (!rstFormCurrentImages.includes(url.trim())) {
      rstFormCurrentImages.push(url.trim());
    }
    renderRestaurantFormImages();
  }
}

function openAddRestaurantModal() {
  if (!isAdmin()) {
    showToast('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถเพิ่มร้านอาหารได้ กรุณาเข้าสู่ระบบด้วยบัญชีแอดมิน', 'info');
    openAdminAccessModal();
    return;
  }

  document.getElementById('restaurantForm').reset();
  document.getElementById('editRestaurantId').value = '';
  rstFormCurrentImages = [];
  renderRestaurantFormImages();
  document.getElementById('restaurantFormModalTitle').textContent = '➕ เพิ่มร้านอาหารใหม่ใน SPU';
  openModal('restaurantFormModal');
}

function openEditRestaurantModal(restaurantId) {
  const restaurants = Store.get(STORAGE_KEYS.RESTAURANTS, INITIAL_RESTAURANTS);
  const rst = restaurants.find(r => r.id === restaurantId);
  if (!rst) return;

  document.getElementById('editRestaurantId').value = rst.id;
  document.getElementById('rstName').value = rst.name;
  document.getElementById('rstLocation').value = rst.location;
  document.getElementById('rstCategory').value = rst.category;
  document.getElementById('rstPriceRange').value = rst.priceRange;
  document.getElementById('rstAvgPrice').value = rst.avgPrice;
  document.getElementById('rstOpenHours').value = rst.openHours;
  document.getElementById('rstDesc').value = rst.description;
  document.getElementById('rstTags').value = (rst.tags || []).join(', ');

  // Load existing images (up to 5)
  if (Array.isArray(rst.images) && rst.images.length > 0) {
    rstFormCurrentImages = [...rst.images];
  } else if (rst.image) {
    rstFormCurrentImages = [rst.image];
  } else {
    rstFormCurrentImages = [];
  }
  renderRestaurantFormImages();

  document.getElementById('restaurantFormModalTitle').textContent = '✏️ แก้ไขข้อมูลร้านอาหาร';
  openModal('restaurantFormModal');
}

function handleRestaurantFormSubmit(event) {
  event.preventDefault();
  if (!isAdmin()) return;

  const id = document.getElementById('editRestaurantId').value;
  const name = document.getElementById('rstName').value.trim();
  const location = document.getElementById('rstLocation').value;
  const category = document.getElementById('rstCategory').value;
  const priceRange = document.getElementById('rstPriceRange').value;
  const avgPrice = Number(document.getElementById('rstAvgPrice').value) || 50;
  const openHours = document.getElementById('rstOpenHours').value.trim();
  const description = document.getElementById('rstDesc').value.trim();
  const tagsStr = document.getElementById('rstTags').value;
  const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);

  // Take images from gallery manager (up to 5)
  const images = [...rstFormCurrentImages];
  let primaryImage = images[0];
  if (!primaryImage) {
    primaryImage = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80';
    images.push(primaryImage);
  }

  const restaurants = Store.get(STORAGE_KEYS.RESTAURANTS, INITIAL_RESTAURANTS);

  if (id) {
    // Edit
    const idx = restaurants.findIndex(r => r.id === id);
    if (idx > -1) {
      restaurants[idx] = {
        ...restaurants[idx],
        name, location, category, priceRange, avgPrice, openHours,
        image: primaryImage,
        images,
        description, tags
      };
      showToast('อัปเดตข้อมูลร้านอาหารสำเร็จ!', 'success');
    }
  } else {
    // Add New
    const newRst = {
      id: `rst_${Date.now()}`,
      name,
      location,
      category,
      priceRange,
      avgPrice,
      rating: 5.0,
      reviewCount: 0,
      image: primaryImage,
      images,
      description,
      openHours,
      tags,
      menus: [
        { name: "เมนูซิกเนเจอร์จานเด็ด", price: avgPrice, isRecommended: true, image: primaryImage }
      ]
    };
    restaurants.unshift(newRst);
    showToast('เพิ่มร้านอาหารใหม่ใน SPU เรียบร้อย!', 'success');
  }

  Store.set(STORAGE_KEYS.RESTAURANTS, restaurants);
  closeModal('restaurantFormModal');
  filterRestaurants();
  renderAdminRestaurantsTable();
  initWheel();
}

function adminDeleteRestaurant(restaurantId) {
  if (!confirm('⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบร้านอาหารนี้ออกจากระบบ SPU?')) return;
  const restaurants = Store.get(STORAGE_KEYS.RESTAURANTS, INITIAL_RESTAURANTS);
  const updated = restaurants.filter(r => r.id !== restaurantId);
  Store.set(STORAGE_KEYS.RESTAURANTS, updated);
  showToast('ลบร้านอาหารเรียบร้อยแล้ว', 'info');
  filterRestaurants();
  renderAdminRestaurantsTable();
  initWheel();
}

function renderAdminReviews() {
  const container = document.getElementById('adminReviewsContainer');
  if (!container) return;

  const status = document.getElementById('reviewFilterStatus')?.value || 'all';
  const reviews = Store.get(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
  const restaurants = Store.get(STORAGE_KEYS.RESTAURANTS, INITIAL_RESTAURANTS);

  let filtered = reviews;
  if (status === 'reported') {
    filtered = reviews.filter(r => r.reported);
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="padding: 2rem; text-align: center; color: var(--text-muted); background: var(--bg-surface-alt); border-radius: var(--radius-lg);">
        🎉 ยอดเยี่ยม! ไม่พบรีวิวที่ไม่เหมาะสม หรือไม่มีรีวิวที่ถูกรายงานในขณะนี้
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(rev => {
    const rst = restaurants.find(r => r.id === rev.restaurantId);
    return `
      <div style="padding: 1.25rem; border: 1.5px solid ${rev.reported ? '#fca5a5' : 'var(--border-color)'}; background: ${rev.reported ? '#fff5f5' : 'var(--bg-surface-alt)'}; border-radius: var(--radius-lg); margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
          <div>
            ${rev.reported ? '<span style="background: #ef4444; color: #fff; font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 4px; margin-right: 0.5rem;">⚠️ ถูกรายงาน</span>' : ''}
            <strong>ร้าน: ${rst ? rst.name : 'ร้านในระบบ'}</strong> 
            <span style="font-size: 0.85rem; color: var(--text-muted);">โดย ${rev.userName} (${rev.date})</span>
          </div>
          <div style="color: #f59e0b;">${getStarSymbols(rev.rating)}</div>
        </div>

        <div style="font-size: 0.95rem; margin-bottom: 0.75rem; line-height: 1.5;">${rev.comment}</div>

        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button type="button" class="btn btn-sm btn-danger" onclick="adminDeleteReview('${rev.id}')">
            🗡️ ประหารคอมเมนต์ (ลบรีวิวนี้)
          </button>
          ${rev.reported ? `
            <button type="button" class="btn btn-sm btn-outline" onclick="adminDismissReport('${rev.id}')">
              ✅ รีวิวนี้เหมาะสมแล้ว (ยกเลิกรายงาน)
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function adminDismissReport(reviewId) {
  const reviews = Store.get(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
  const rev = reviews.find(r => r.id === reviewId);
  if (rev) {
    rev.reported = false;
    Store.set(STORAGE_KEYS.REVIEWS, reviews);
    showToast('ยกเลิกสถานะรายงานของรีวิวนี้แล้ว', 'success');
    renderAdminReviews();
  }
}

function renderAdminNews() {
  const container = document.getElementById('adminNewsListContainer');
  if (!container) return;

  const newsList = Store.get(STORAGE_KEYS.NEWS, INITIAL_NEWS);

  container.innerHTML = newsList.map(item => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: var(--bg-surface-alt); border-radius: var(--radius-md); margin-bottom: 0.5rem; border: 1px solid var(--border-color);">
      <div>
        <span style="font-size: 0.75rem; background: var(--primary-light); color: var(--primary); font-weight: 700; padding: 0.15rem 0.4rem; border-radius: 4px;">${item.tag}</span>
        <strong>${item.title}</strong>
        <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 0.5rem;">(${item.date})</span>
      </div>
      <div>
        <button type="button" class="btn btn-sm btn-outline btn-danger" onclick="adminDeleteNews('${item.id}')">🗑️ ลบข่าว</button>
      </div>
    </div>
  `).join('');
}

function adminDeleteNews(newsId) {
  if (!confirm('ยืนยันลบข่าวนี้ออกจากระบบ?')) return;
  const newsList = Store.get(STORAGE_KEYS.NEWS, INITIAL_NEWS);
  const updated = newsList.filter(n => n.id !== newsId);
  Store.set(STORAGE_KEYS.NEWS, updated);
  showToast('ลบข่าวสารเรียบร้อยแล้ว', 'info');
  renderNewsGrid();
  renderAdminNews();
}

function renderAdminThemePicker() {
  const grid = document.getElementById('themePickerGrid');
  if (!grid) return;

  const settings = Store.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  const currentTheme = settings.activeTheme || 'spu-classic';

  grid.innerHTML = Object.values(THEMES).map(t => {
    const isActive = t.id === currentTheme;
    return `
      <div class="theme-card-option ${isActive ? 'active' : ''}" onclick="changeThemeFromAdmin('${t.id}')">
        <div class="theme-card-icon">${t.icon}</div>
        <div class="theme-card-name">${t.name}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
          โทนสีหลัก: <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${t.primary}; vertical-align: middle;"></span>
        </div>
      </div>
    `;
  }).join('');
}

function changeThemeFromAdmin(themeId) {
  applyTheme(themeId);
  renderAdminThemePicker();
  showToast(`เปลี่ยนธีมเว็บไซต์เป็น "${THEMES[themeId].name}" เรียบร้อย 🎉`, 'success');
}

function populateAdminSiteTexts() {
  const settings = Store.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  const tagline = document.getElementById('editTagline');
  const ticker = document.getElementById('editTicker');
  const banner = document.getElementById('editBannerText');
  const googleClientIdInput = document.getElementById('adminGoogleClientIdInput');

  if (tagline) tagline.value = settings.tagline || '';
  if (ticker) ticker.value = settings.announcementTicker || '';
  if (banner) banner.value = settings.festivalBannerText || '';
  if (googleClientIdInput) googleClientIdInput.value = settings.googleClientId || '';
}

function handleSiteTextSave(event) {
  event.preventDefault();
  if (!isAdmin()) return;

  const settings = Store.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  settings.tagline = document.getElementById('editTagline').value.trim();
  settings.announcementTicker = document.getElementById('editTicker').value.trim();
  settings.festivalBannerText = document.getElementById('editBannerText').value.trim();

  Store.set(STORAGE_KEYS.SETTINGS, settings);
  applySiteSettings();
  showToast('บันทึกข้อความหน้าเว็บไซต์เรียบร้อยแล้ว!', 'success');
}

function applySiteSettings() {
  const settings = Store.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);

  const tickerText = document.getElementById('tickerText');
  if (tickerText) tickerText.textContent = settings.announcementTicker || '';

  const heroDescText = document.getElementById('heroDescText');
  if (heroDescText && settings.tagline) heroDescText.textContent = settings.tagline;

  const heroFestivalBadge = document.getElementById('heroFestivalBadge');
  if (heroFestivalBadge && settings.festivalBannerText) {
    heroFestivalBadge.textContent = settings.festivalBannerText;
  }
}

function resetAllDemoData() {
  if (!confirm('⚠️ ยืนยันการคืนค่าข้อมูลเริ่มต้นของระบบ SPU ทั้งหมด? (ข้อมูลทดสอบใหม่จะถูกรีเซ็ต)')) return;
  Store.reset();
  location.reload();
}

// ============================================================================
// 15. Secret Admin Access Listeners (ซ่อนปุ่ม ไม่แสดงให้คนทั่วไปเห็น)
// ============================================================================

let secretLogoClicks = 0;
let secretLogoTimer = null;

function setupSecretAdminTriggers() {
  // 1. Keyboard Shortcut: Ctrl + Shift + A (or Cmd + Shift + A on Mac)
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      SoundFX.playTick();
      if (isAdmin()) {
        openAdminModal();
      } else {
        openAdminAccessModal();
      }
    }
  });

  // 2. Secret Easter Egg: Click Logo 5 times quickly within 2.5 seconds
  const logo = document.querySelector('.brand-logo');
  if (logo) {
    logo.addEventListener('click', (e) => {
      secretLogoClicks++;
      clearTimeout(secretLogoTimer);
      secretLogoTimer = setTimeout(() => {
        secretLogoClicks = 0;
      }, 2500);

      if (secretLogoClicks >= 5) {
        secretLogoClicks = 0;
        SoundFX.playMatch();
        showToast('🔐 ช่องทางเข้าสู่ระบบผู้ดูแลระบบ (Secret Admin Portal)', 'info');
        if (isAdmin()) {
          openAdminModal();
        } else {
          openAdminAccessModal();
        }
      }
    });
  }

  // 3. URL Hash Trigger: opening with or navigating to #admin
  function checkAdminHash() {
    if (window.location.hash === '#admin') {
      if (isAdmin()) {
        openAdminModal();
      } else {
        openAdminAccessModal();
      }
    }
  }

  checkAdminHash();
  window.addEventListener('hashchange', checkAdminHash);
}

// ============================================================================
// 16. App Initialization on DOM Ready
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 0. Track Visitor Analytics (Visitor Counter)
  trackVisitorHit();

  // 1. Init Theme & Dark mode
  const settings = Store.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  applyTheme(settings.activeTheme || 'spu-classic');
  initDarkMode();
  applySiteSettings();

  // 2. Populate Dropdowns & Filter
  populateFilterDropdowns();
  filterRestaurants();

  // 3. Render Navigation User & Google Identity
  renderNavUser();
  initGoogleSignIn();

  // 4. Init Mini-Games & Daily Check-In
  initWheel();
  renderDailyCheckIn();

  // 5. Render News & Gamification
  renderNewsGrid();
  renderLeaderboard();
  renderBadgesShowcase();

  // 6. Setup Secret Admin Access Triggers
  setupSecretAdminTriggers();

  console.log("จานเด็ด SPU พร้อมทำงานเต็มรูปแบบ 🚀");
});
