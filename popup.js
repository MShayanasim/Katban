// ──────────────────────────────────────────────
// KATBAN POPUP SCRIPT
// Handles mascot animation, timer UI, clipboard
// ──────────────────────────────────────────────

const catSvg       = document.getElementById('cat-svg');
const pupils       = document.getElementById('pupils');
const pupilLeft    = document.getElementById('pupil-left');
const pupilRight   = document.getElementById('pupil-right');
const shineLeft    = document.getElementById('shine-left');
const shineRight   = document.getElementById('shine-right');
const catStatus    = document.getElementById('cat-status');
const mascotWrap   = document.getElementById('mascot-wrap');

// Base positions for rect pupils
const BASE_PUPIL = { lx: 30, ly: 54, rx: 60, ry: 54, slx: 38, sly: 55, srx: 68, sry: 55 };

const timerInput   = document.getElementById('timer-input');
const btnStart     = document.getElementById('btn-start');
const btnStop      = document.getElementById('btn-stop');
const blockedInput = document.getElementById('blocked-input');
const btnSaveSites = document.getElementById('btn-save-sites');

const clipList     = document.getElementById('clipboard-list');
const btnClearHist = document.getElementById('btn-clear-history');
const pageCatToggle    = document.getElementById('page-cat-toggle');
const meaningCatToggle = document.getElementById('meaning-cat-toggle');
const sharedCatToggle  = document.getElementById('shared-cat-toggle');
const catStyleSelect   = document.getElementById('cat-style-select');

// Overlay elements
const btnSettingsOpen  = document.getElementById('btn-settings-open');
const btnSettingsClose = document.getElementById('btn-settings-close');
const settingsOverlay  = document.getElementById('settings-overlay');

btnSettingsOpen.addEventListener('click', () => {
  settingsOverlay.classList.add('katban-open');
});

btnSettingsClose.addEventListener('click', () => {
  settingsOverlay.classList.remove('katban-open');
});

// ── Mascot Eye Tracking ────────────────────────
document.addEventListener('mousemove', (e) => {
  const rect = mascotWrap.getBoundingClientRect();
  const cx = rect.left + rect.width  / 2;
  const cy = rect.top  + rect.height / 2;

  const dx = e.clientX - cx;
  const dy = e.clientY - cy;
  const dist  = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const maxPupilMove = 3;
  const move = Math.min(dist / 30, maxPupilMove);

  const ox = +(Math.cos(angle) * move).toFixed(2);
  const oy = +(Math.sin(angle) * move).toFixed(2);

  // Move pupil rects via transform on the group
  pupils.style.transform = `translate(${ox}px, ${oy}px)`;

  // Proximity scared state
  if (dist < 55) {
    setCatState('scared');
  } else if (!currentFocusState) {
    setCatState('idle');
  }
});

let currentFocusState = null;

function setCatState(state) {
  catSvg.className.baseVal = '';          // clear all state classes
  catStatus.className      = 'cat-status';

  switch (state) {
    case 'focus':
      catSvg.classList.add('focused');
      catStatus.classList.add('focus');
      catStatus.textContent = 'Focused';
      currentFocusState = 'focus';
      break;
    case 'break':
      catSvg.classList.add('break-mode');
      catStatus.classList.add('break');
      catStatus.textContent = 'Break!';
      currentFocusState = 'break';
      break;
    case 'scared':
      catSvg.classList.add('scared');
      catStatus.classList.add('scared');
      catStatus.textContent = 'Too close!';
      break;
    case 'idle':
    default:
      catStatus.textContent = 'Idle';
      currentFocusState = null;
      break;
  }
}

// ── Timer UI ────────────────────────────────────
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function parseTimeInput(val) {
  val = val.trim();
  if (val === '-') return -1; // unlimited
  // Try MM:SS
  const match = val.match(/^(\d{1,3}):([0-5]\d)$/);
  if (match) {
    return parseInt(match[1]) * 60 + parseInt(match[2]);
  }
  // Try just minutes
  const minOnly = val.match(/^(\d{1,3})$/);
  if (minOnly) {
    return parseInt(minOnly[1]) * 60;
  }
  return null; // invalid
}

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  if (h > 0) return `${h}:${m}:${s}`;
  return `${m}:${s}`;
}

function refreshTimerUI(timerState, timeRemaining, isUnlimited) {
  timerInput.className = 'timer-input';

  if (timerState === 'focus') {
    if (isUnlimited) {
      // timeRemaining counts UP for unlimited
      timerInput.value = '∞  ' + formatElapsed(timeRemaining);
      timerInput.classList.add('unlimited');
    } else {
      timerInput.value = formatTime(timeRemaining);
    }
    timerInput.classList.add('focus');
    timerInput.readOnly = true;
    btnStart.textContent = 'Focusing…';
    btnStart.disabled    = true;
    setCatState('focus');
  } else if (timerState === 'break') {
    timerInput.value = formatTime(timeRemaining);
    timerInput.classList.add('break');
    timerInput.readOnly = true;
    btnStart.textContent = 'On Break…';
    btnStart.disabled    = true;
    setCatState('break');
  } else {
    // Idle — only reset the display if user isn't actively editing
    if (document.activeElement !== timerInput) {
      // Restore saved custom duration or default
      chrome.storage.local.get(['customDuration'], (data) => {
        const dur = data.customDuration;
        if (dur === -1) {
          timerInput.value = '-';
        } else if (dur && dur !== 1500) {
          timerInput.value = formatTime(dur);
        } else if (timerInput.value === '∞' || timerInput.classList.contains('unlimited') || timerInput.readOnly) {
          timerInput.value = '25:00';
        }
      });
    }
    timerInput.readOnly = false;
    btnStart.textContent = 'Start Focus';
    btnStart.disabled    = false;
    setCatState('idle');
  }
}

btnStart.addEventListener('click', () => {
  const parsed = parseTimeInput(timerInput.value);
  if (parsed === null || parsed === 0) {
    timerInput.value = '25:00';
    return;
  }
  // Save the custom duration and tell background
  chrome.storage.local.set({ customDuration: parsed });
  chrome.runtime.sendMessage({ type: 'START_FOCUS', duration: parsed });
});

btnStop.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'STOP_TIMER' });
});

// Poll storage for timer updates every second while popup is open
function pollTimer() {
  chrome.storage.local.get(['timerState', 'timeRemaining', 'isUnlimited'], (data) => {
    refreshTimerUI(data.timerState || 'idle', data.timeRemaining ?? 1500, data.isUnlimited === true);
  });
}
pollTimer();
setInterval(pollTimer, 1000);

// ── Blocked Sites ───────────────────────────────
chrome.storage.local.get(['blockedSites'], (data) => {
  blockedInput.value = (data.blockedSites || []).join(', ');
});

btnSaveSites.addEventListener('click', () => {
  const sites = blockedInput.value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  chrome.storage.local.set({ blockedSites: sites });
  btnSaveSites.textContent = 'Saved!';
  setTimeout(() => { btnSaveSites.textContent = 'Save'; }, 1200);
});

// ── Clipboard History ───────────────────────────
function renderClipboard(history) {
  clipList.innerHTML = '';
  if (!history || history.length === 0) {
    clipList.innerHTML = '<li class="clip-empty">Nothing copied yet.</li>';
    return;
  }
  history.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'clip-item';

    const label = document.createElement('div');
    label.className = 'clip-label';
    label.textContent = new Date(item.timestamp).toLocaleTimeString();

    const preview = document.createElement('div');
    preview.textContent = item.text.slice(0, 100) + (item.text.length > 100 ? '…' : '');

    li.appendChild(label);
    li.appendChild(preview);
    clipList.appendChild(li);
  });
}

chrome.storage.local.get(['clipboardHistory'], (data) => {
  renderClipboard(data.clipboardHistory || []);
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.clipboardHistory) {
    renderClipboard(changes.clipboardHistory.newValue || []);
  }
  if (changes.timerState || changes.timeRemaining || changes.isUnlimited) {
    chrome.storage.local.get(['timerState', 'timeRemaining', 'isUnlimited'], (data) => {
      refreshTimerUI(data.timerState || 'idle', data.timeRemaining ?? 1500, data.isUnlimited === true);
    });
  }
});

btnClearHist.addEventListener('click', () => {
  chrome.storage.local.set({ clipboardHistory: [] });
});

// ── Settings ───────────────────────────
chrome.storage.local.get(['pageCatEnabled', 'meaningCatEnabled', 'sharedCatEnabled', 'catStyle'], (data) => {
  pageCatToggle.checked = data.pageCatEnabled !== false;
  meaningCatToggle.checked = data.meaningCatEnabled !== false;
  sharedCatToggle.checked = data.sharedCatEnabled === true;
  catStyleSelect.value = data.catStyle || 'primary';
  document.body.className = `cat-style-${data.catStyle || 'primary'}`;
});

function broadcastSettings() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'SETTINGS_UPDATE',
        pageCatEnabled: pageCatToggle.checked,
        meaningCatEnabled: meaningCatToggle.checked,
        sharedCatEnabled: sharedCatToggle.checked,
        catStyle: catStyleSelect.value
      }).catch(() => {});
    });
  });
}

pageCatToggle.addEventListener('change', () => {
  chrome.storage.local.set({ pageCatEnabled: pageCatToggle.checked });
  broadcastSettings();
});

meaningCatToggle.addEventListener('change', () => {
  chrome.storage.local.set({ meaningCatEnabled: meaningCatToggle.checked });
  broadcastSettings();
});

sharedCatToggle.addEventListener('change', () => {
  chrome.storage.local.set({ sharedCatEnabled: sharedCatToggle.checked });
  chrome.runtime.sendMessage({ type: 'UPDATE_SHARED_SETTING', enabled: sharedCatToggle.checked });
  broadcastSettings();
});

catStyleSelect.addEventListener('change', () => {
  const style = catStyleSelect.value;
  chrome.storage.local.set({ catStyle: style });
  document.body.className = `cat-style-${style}`;
  broadcastSettings();
});
