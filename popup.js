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
  if (isHappy) return;
  if (dist < 55) {
    setCatState('scared');
  } else if (!currentFocusState) {
    setCatState('idle');
  }
});

let currentFocusState = null;

let isHappy = false;

function setCatState(state) {
  if (state === 'focus') {
    currentFocusState = 'focus';
  } else if (state === 'break') {
    currentFocusState = 'break';
  } else if (state === 'idle') {
    currentFocusState = null;
  }

  if (isHappy) return;

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

function triggerHappyCat() {
  if (isHappy) return;
  isHappy = true;
  catSvg.classList.add('happy');
  catStatus.textContent = 'Good job!';
  setTimeout(() => {
    isHappy = false;
    catSvg.classList.remove('happy');
    setCatState(currentFocusState ? currentFocusState : 'idle');
  }, 1000);
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

let lastKnownState = null;

function refreshTimerUI(timerState, timeRemaining, isUnlimited, customDur) {
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
    // Idle — only reset the display when transitioning to idle or on first load
    if (lastKnownState !== 'idle') {
      const dur = customDur || 1500;
      if (dur === -1) {
        timerInput.value = '-';
      } else {
        timerInput.value = formatTime(dur);
      }
    }
    timerInput.readOnly = false;
    btnStart.textContent = 'Start Focus';
    btnStart.disabled    = false;
    setCatState('idle');
  }

  lastKnownState = timerState;
}

btnStart.addEventListener('click', () => {
  const parsed = parseTimeInput(timerInput.value);
  if (parsed === null || parsed === 0) {
    timerInput.value = '25:00';
    return;
  }
  // Cap at 3 hours (180 minutes)
  if (parsed !== -1 && parsed > 180 * 60) {
    timerInput.value = '180:00';
    return;
  }
  // Save the custom duration and tell background
  chrome.storage.local.set({ customDuration: parsed });
  chrome.runtime.sendMessage({ type: 'START_FOCUS', duration: parsed });
});

btnStop.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'STOP_TIMER' });
});

// Poll storage for timer display every second while popup is open
function pollTimer() {
  chrome.storage.local.get(['timerState', 'endTime', 'startTime', 'isUnlimited', 'customDuration'], (data) => {
    if (chrome.runtime.lastError) return;
    const timerState = data.timerState || 'idle';
    const isUnlimited = data.isUnlimited === true;

    const customDur = data.customDuration;

    if (timerState === 'focus' || timerState === 'break') {
      if (isUnlimited) {
        const elapsed = Math.floor((Date.now() - (data.startTime || Date.now())) / 1000);
        refreshTimerUI(timerState, elapsed, true, customDur);
      } else {
        const remaining = Math.max(0, Math.ceil(((data.endTime || Date.now()) - Date.now()) / 1000));
        refreshTimerUI(timerState, remaining, false, customDur);
      }
    } else {
      refreshTimerUI('idle', 0, false, customDur);
    }
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
    li.title = 'Click or drag to copy';
    li.draggable = true;

    const label = document.createElement('div');
    label.className = 'clip-label';
    label.textContent = new Date(item.timestamp).toLocaleTimeString();

    const preview = document.createElement('div');
    preview.textContent = item.text.slice(0, 100) + (item.text.length > 100 ? '…' : '');

    // Drag to copy
    li.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', item.text);
      e.dataTransfer.effectAllowed = 'copy';
    });

    // Click to copy
    li.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(item.text);
        const originalText = preview.textContent;
        preview.textContent = 'Copied to clipboard!';
        preview.style.color = 'var(--accent)';
        setTimeout(() => {
          preview.textContent = originalText;
          preview.style.color = '';
        }, 1200);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    });

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

// ── Privacy Policy Link ────────────────────────
const privacyLink = document.getElementById('privacy-link');
if (privacyLink) {
  privacyLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: privacyLink.href });
  });
}

// ── Tabs Navigation ────────────────────────────
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active from all
    navBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(tc => tc.classList.remove('active'));
    
    // Add active to clicked
    btn.classList.add('active');
    const targetId = btn.getAttribute('data-target');
    document.getElementById(targetId).classList.add('active');

    // If Stats tab is opened, refresh stats
    if (targetId === 'tab-stats') {
      refreshStats();
    }
  });
});

// ── Focus Stats ────────────────────────────────
const statToday = document.getElementById('stat-today');
const statWeek = document.getElementById('stat-week');
const statMonth = document.getElementById('stat-month');

function refreshStats() {
  chrome.storage.local.get(['focusSessions'], (data) => {
    const sessions = data.focusSessions || [];
    const now = new Date();
    
    // Start of today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Start of this week (assuming Monday as start)
    const day = now.getDay() || 7; 
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(now.getDate() - day + 1);
    const startOfWeekTime = startOfWeek.getTime();
    
    // Start of this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let todayMin = 0, weekMin = 0, monthMin = 0;

    sessions.forEach(s => {
      if (s.timestamp >= startOfToday) todayMin += s.minutes;
      if (s.timestamp >= startOfWeekTime) weekMin += s.minutes;
      if (s.timestamp >= startOfMonth) monthMin += s.minutes;
    });

    statToday.textContent = todayMin;
    statWeek.textContent = weekMin;
    statMonth.textContent = monthMin;
  });
}

// ── To-Do List (Tasks) ─────────────────────────
const taskList = document.getElementById('task-list');
const newTaskInput = document.getElementById('new-task-input');
const btnAddTask = document.getElementById('btn-add-task');

function renderTasks(tasks) {
  taskList.innerHTML = '';
  if (!tasks || tasks.length === 0) {
    taskList.innerHTML = '<li class="clip-empty">All caught up!</li>';
    return;
  }
  
  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = 'task-item';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'task-checkbox';
    cb.checked = task.done;

    const span = document.createElement('span');
    span.className = 'task-text' + (task.done ? ' done' : '');
    span.textContent = task.text;

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-del-task';
    delBtn.innerHTML = '✕';

    // Toggle done
    cb.addEventListener('change', () => {
      task.done = cb.checked;
      span.className = 'task-text' + (task.done ? ' done' : '');
      saveTasks(tasks);
      if (task.done) {
        // Happy cat bounce!
        triggerHappyCat();
      }
    });

    // Delete task
    delBtn.addEventListener('click', () => {
      tasks.splice(index, 1);
      saveTasks(tasks);
      renderTasks(tasks);
    });

    li.appendChild(cb);
    li.appendChild(span);
    li.appendChild(delBtn);
    taskList.appendChild(li);
  });
}

function saveTasks(tasks) {
  chrome.storage.local.set({ katbanTasks: tasks });
}

function addTask() {
  const text = newTaskInput.value.trim();
  if (!text) return;
  chrome.storage.local.get(['katbanTasks'], (data) => {
    const tasks = data.katbanTasks || [];
    tasks.push({ text: text, done: false, id: Date.now() });
    saveTasks(tasks);
    renderTasks(tasks);
    newTaskInput.value = '';
  });
}

btnAddTask.addEventListener('click', addTask);
newTaskInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTask();
});

chrome.storage.local.get(['katbanTasks'], (data) => {
  renderTasks(data.katbanTasks || []);
});

// ── Daily Cat Fact ─────────────────────────────
const CAT_FACTS = [
  "Cats spend 70% of their lives sleeping.",
  "A cat's purr has a frequency of 25 to 150 Hertz.",
  "Cats can rotate their ears 180 degrees.",
  "The oldest known pet cat was found in a 9,500-year-old grave.",
  "Cats don't have a sweet tooth.",
  "A group of cats is called a clowder.",
  "A cat's nose print is unique, like a human's fingerprint.",
  "Cats have 32 muscles that control their outer ear.",
  "Isaac Newton invented the cat flap door.",
  "Cats can jump up to six times their height.",
  "A cat's purr can help heal bones and tissues.",
  "Most cats are lactose intolerant.",
  "Cats have five toes on their front paws, but only four on the back.",
  "A cat rubs against you to mark you as its territory.",
  "The world's longest cat measured 48.5 inches long.",
  "Cats typically sleep 12 to 16 hours a day.",
  "When a cat blinks slowly at you, it's a sign of trust.",
  "Cats use their whiskers to determine if they can fit through a space.",
  "Adult cats only meow to communicate with humans.",
  "A female cat is called a queen."
];

const catFactSpan = document.getElementById('cat-fact');
if (catFactSpan) {
  const today = new Date();
  // Use a mix of year, month, and day to pick a stable index for the whole day
  const index = (today.getFullYear() + today.getMonth() + today.getDate()) % CAT_FACTS.length;
  catFactSpan.textContent = "🐾 Fact: " + CAT_FACTS[index];
}
