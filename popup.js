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
const muteSoundToggle  = document.getElementById('mute-sound-toggle');
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

// ── Treat Logic ────────────────────────
const btnTreat = document.getElementById('btn-treat');
const treatToast = document.getElementById('treat-toast');

const funnyMessages = [
  "The cat is getting fat!",
  "I am a cruel dev, wait 5 minutes!",
  "No treats for you, get back to work!",
  "Don't spoil the mascot!",
  "Cooldown active. Stay focused!"
];

let treatToastTimeout;
btnTreat.addEventListener('click', () => {
  chrome.storage.local.get(['lastTreatTime'], (data) => {
    const now = Date.now();
    if (data.lastTreatTime && now - data.lastTreatTime < 300000) { // 5 minutes
      // 5 minute cooldown active
      treatToast.textContent = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
      treatToast.classList.remove('hidden');
      
      clearTimeout(treatToastTimeout);
      treatToastTimeout = setTimeout(() => treatToast.classList.add('hidden'), 4000);
      return;
    }
    
    // Give treat
    chrome.storage.local.set({ lastTreatTime: now });
    
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'SPAWN_TREAT' }, () => {
          window.close(); // close popup so user can click on page
        });
      }
    });
  });
});

const btnLaser = document.getElementById('btn-laser');
if (btnLaser) {
  btnLaser.addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'SPAWN_LASER' }, () => {
          window.close();
        });
      }
    });
  });
}

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
async function renderClipboard(history) {
  clipList.innerHTML = '';
  if (!history || history.length === 0) {
    clipList.innerHTML = '<li class="clip-empty">Nothing copied yet.</li>';
    return;
  }
  
  // Sort history: pinned first, then by timestamp descending
  history.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.timestamp - a.timestamp;
  });

  const numPinned = history.filter(item => item.pinned).length;

  // Pre-decrypt all text asynchronously before rendering the DOM
  for (const item of history) {
    if (!item.decryptedText) {
      if (item.text === '[Sensitive Data Protected]') {
        item.decryptedText = item.text;
      } else {
        item.decryptedText = await globalThis.katbanDecrypt(item.text) || item.text;
      }
    }
  }

  history.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'clip-item';
    li.title = 'Click or drag to copy';
    li.draggable = true;

    const header = document.createElement('div');
    header.className = 'clip-item-header';

    const label = document.createElement('div');
    label.className = 'clip-label';
    label.textContent = new Date(item.timestamp).toLocaleTimeString();

    const actions = document.createElement('div');
    actions.className = 'clip-actions';

    const pinBtn = document.createElement('button');
    pinBtn.className = 'btn-clip-pin' + (item.pinned ? ' pinned' : '');
    pinBtn.innerHTML = '📌';
    pinBtn.title = item.pinned ? 'Unpin' : 'Pin to top (Max 3)';
    
    // Prevent drag on buttons
    pinBtn.addEventListener('mousedown', e => e.stopPropagation());
    
    pinBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (item.pinned) {
        // Unpinning is always allowed — toggle immediately
        item.pinned = false;
        chrome.storage.local.set({ clipboardHistory: history });
        return;
      }
      // Re-read from storage to get the live pin count, preventing stale count bugs
      chrome.storage.local.get(['clipboardHistory'], (freshData) => {
        const freshHistory = freshData.clipboardHistory || [];
        const livePinnedCount = freshHistory.filter(h => h.pinned).length;
        if (livePinnedCount >= 3) {
          // Show a non-blocking inline toast instead of alert()
          const pinWarn = document.getElementById('pin-limit-toast');
          if (pinWarn) {
            pinWarn.classList.remove('hidden');
            clearTimeout(pinWarn._hideTimer);
            pinWarn._hideTimer = setTimeout(() => pinWarn.classList.add('hidden'), 2500);
          }
          return;
        }
        item.pinned = true;
        chrome.storage.local.set({ clipboardHistory: history });
      });
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-clip-del';
    delBtn.innerHTML = '✖';
    delBtn.title = 'Delete';
    
    delBtn.addEventListener('mousedown', e => e.stopPropagation());
    
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Use unique id when available (new items); fall back to timestamp+text for legacy items
      const newHistory = item.id
        ? history.filter(h => h.id !== item.id)
        : history.filter(h => h.timestamp !== item.timestamp || h.text !== item.text);
      chrome.storage.local.set({ clipboardHistory: newHistory });
    });

    actions.appendChild(pinBtn);
    actions.appendChild(delBtn);

    header.appendChild(label);
    header.appendChild(actions);

    const preview = document.createElement('div');
    preview.className = 'clip-preview';
    preview.textContent = item.decryptedText.slice(0, 100) + (item.decryptedText.length > 100 ? '…' : '');

    // Drag to copy
    li.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', item.decryptedText);
      e.dataTransfer.effectAllowed = 'copy';
    });

    // Click to copy
    li.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(item.decryptedText);
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

    li.appendChild(header);
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
  muteSoundToggle.checked = data.muteOverlaySound === true;
  catStyleSelect.value = data.catStyle || 'primary';
  document.body.className = `cat-style-${data.catStyle || 'primary'}`;
});

function broadcastSettings() {
  // Only send to http/https tabs — chrome:// and other internal pages
  // don't have content scripts and will throw errors we'd have to suppress anyway.
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (!tab.id || !tab.url || !/^https?:\/\//.test(tab.url)) return;
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

muteSoundToggle.addEventListener('change', () => {
  chrome.storage.local.set({ muteOverlaySound: muteSoundToggle.checked });
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
const taskDoneList = document.getElementById('task-done-list');
const activeWrap = document.getElementById('katban-active-wrap');
const activeText = document.getElementById('active-task-text');
const newTaskInput = document.getElementById('new-task-input');
const btnAddTask = document.getElementById('btn-add-task');

let currentTasks = [];

function broadcastActiveTask(activeTaskText) {
  chrome.runtime.sendMessage({ type: 'ACTIVE_TASK_UPDATE', task: activeTaskText });
}

function renderTasks(tasks) {
  currentTasks = tasks;
  taskList.innerHTML = '';
  taskDoneList.innerHTML = '';
  
  let hasActive = false;
  let todoCount = 0;
  let doneCount = 0;

  tasks.forEach((task) => {
    if (task.status === undefined) {
      task.status = task.done ? 'done' : 'todo';
    }

    if (task.status === 'doing') {
      hasActive = true;
      activeWrap.classList.remove('hidden');
      document.getElementById('active-task-text').textContent = task.text;
      return;
    }

    const li = document.createElement('li');
    li.className = 'task-item';

    const span = document.createElement('span');
    span.className = 'task-text' + (task.status === 'done' ? ' done' : '');
    span.textContent = task.text;

    const actionDiv = document.createElement('div');
    actionDiv.style.display = 'flex';
    actionDiv.style.gap = '4px';

    if (task.status === 'todo') {
      todoCount++;
      const playBtn = document.createElement('button');
      playBtn.className = 'btn-play-task';
      playBtn.innerHTML = '▶';
      playBtn.title = 'Start Task';
      playBtn.addEventListener('click', () => {
        // Move any currently 'doing' to 'todo'
        tasks.forEach(t => { if (t.status === 'doing') t.status = 'todo'; });
        task.status = 'doing';
        saveTasks(tasks);
        renderTasks(tasks);
        broadcastActiveTask(task.text);
      });
      actionDiv.appendChild(playBtn);
    } else {
      doneCount++;
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-del-task';
    delBtn.innerHTML = '✕';
    delBtn.addEventListener('click', () => {
      currentTasks = tasks.filter(t => t.id !== task.id);
      saveTasks(currentTasks);
      renderTasks(currentTasks);
    });
    actionDiv.appendChild(delBtn);

    li.appendChild(span);
    li.appendChild(actionDiv);
    
    if (task.status === 'todo') {
      taskList.appendChild(li);
    } else {
      taskDoneList.appendChild(li);
    }
  });

  if (!hasActive) {
    activeWrap.classList.add('hidden');
  }
  if (todoCount === 0) {
    taskList.innerHTML = '<li class="clip-empty">All caught up!</li>';
  }
  if (doneCount === 0) {
    taskDoneList.innerHTML = '<li class="clip-empty">No tasks finished yet.</li>';
  }
}

function saveTasks(tasks) {
  chrome.storage.local.set({ katbanTasks: tasks });
}

function addTask() {
  const text = newTaskInput.value.trim();
  if (!text) return;
  chrome.storage.local.get(['katbanTasks'], (data) => {
    const tasks = data.katbanTasks || [];
    tasks.push({ text: text, status: 'todo', id: Date.now() });
    saveTasks(tasks);
    renderTasks(tasks);
    newTaskInput.value = '';
  });
}

btnAddTask.addEventListener('click', addTask);
newTaskInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTask();
});

// ── Static Listeners for Active Task ───────────
document.getElementById('btn-active-complete').addEventListener('click', () => {
  const task = currentTasks.find(t => t.status === 'doing');
  if (task) {
    task.status = 'done';
    saveTasks(currentTasks);
    renderTasks(currentTasks);
    triggerHappyCat(); // Celebration
    broadcastActiveTask(null);
  }
});

document.getElementById('btn-active-pause').addEventListener('click', () => {
  const task = currentTasks.find(t => t.status === 'doing');
  if (task) {
    task.status = 'todo';
    saveTasks(currentTasks);
    renderTasks(currentTasks);
    broadcastActiveTask(null);
  }
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
  // Use epoch day number (not year+month+day sum which is non-uniform) so each
  // cat fact is equally likely over a sufficiently long period.
  const epochDay = Math.floor(today.getTime() / 86400000);
  // Multiplicative hash for better distribution across the facts array
  const index = ((epochDay * 2654435761) >>> 0) % CAT_FACTS.length;
  catFactSpan.textContent = "🐾 Fact: " + CAT_FACTS[index];
}

// ── Emotional Support Features ─────────────────────

const btnRantToggleMain = document.getElementById('btn-rant-toggle-main');
const btnRantToggleClose = document.getElementById('btn-rant-toggle-close');
const rantOverlay = document.getElementById('rant-overlay');
const rantInput = document.getElementById('rant-input');
const btnSubmitRant = document.getElementById('btn-submit-rant');
const rantChatHistory = document.getElementById('rant-chat-history');
const rantPaper = document.getElementById('rant-paper');
const supportBubble = document.getElementById('support-bubble');
const rantHearts = document.getElementById('rant-hearts');
const moodBubble = document.getElementById('mood-bubble');
const moodBtns = document.querySelectorAll('.mood-btn');

let chatHistory = [];

// Mood Selector Logic
let currentMood = 'default';

catStatus.addEventListener('click', (e) => {
  e.stopPropagation();
  moodBubble.classList.toggle('hidden');
});

document.addEventListener('click', () => {
  if (!moodBubble.classList.contains('hidden')) {
    moodBubble.classList.add('hidden');
  }
});

moodBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentMood = btn.getAttribute('data-mood');
    moodBubble.classList.add('hidden');
    
    // Clear old mood classes
    catSvg.classList.remove('mood-stressed', 'mood-tired');
    
    if (currentMood === 'stressed') {
      catSvg.classList.add('mood-stressed');
      catStatus.textContent = 'Comforting';
    } else if (currentMood === 'tired') {
      catSvg.classList.add('mood-tired');
      catStatus.textContent = 'Sleeping';
    } else {
      setCatState(currentFocusState ? currentFocusState : 'idle');
    }
  });
});

// Rant Box Logic
btnRantToggleMain.addEventListener('click', () => {
  rantOverlay.classList.add('active');
  setTimeout(() => rantInput.focus(), 300);
});

btnRantToggleClose.addEventListener('click', () => {
  rantOverlay.classList.remove('active');
});

function spawnHearts() {
  rantHearts.classList.remove('hidden');
  rantHearts.innerHTML = '';
  for(let i=0; i<5; i++) {
    const heart = document.createElement('div');
    heart.className = 'pixel-heart';
    heart.textContent = '❤';
    heart.style.left = (40 + Math.random() * 20) + '%';
    heart.style.animationDelay = (Math.random() * 0.3) + 's';
    rantHearts.appendChild(heart);
  }
  setTimeout(() => rantHearts.classList.add('hidden'), 2000);
}

function showSupportMessage(msg) {
  supportBubble.textContent = msg;
  supportBubble.classList.remove('hidden');
  setTimeout(() => {
    supportBubble.classList.add('hidden');
  }, 5000);
}

// The AI Dual-Layer Call
async function analyzeRant(messages) {
  const BACKEND_URL = 'https://katban-ai-worker.shayanasim-dev.workers.dev';
  
  try {
    // Layer 1 & 2: Try Cloudflare Backend (Groq/Gemini)
    // Use an AbortController with a 15s timeout so the popup never hangs indefinitely
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    let response;
    try {
      response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }
    if (!response.ok) throw new Error('API Rate Limit or Offline');
    const data = await response.json();
    return data.reply;
  } catch (error) {
    // Layer 3: Fallback Offline Processing (Transformers.js Placeholder)
    console.warn("Backend failed or offline. Falling back to local offline classification.");
    
    // For now, robust regex fallback
    const lastUserMessage = messages[messages.length - 1].content.toLowerCase();
    if (/(abused|abusive|cheated|unsafe|scared|hurt|hit)/i.test(lastUserMessage)) {
      return "I am so sorry you are going through this. Please remember you deserve to be safe, and none of this is your fault.";
    } else if (/(tired|exhausted|burnout|overwhelmed)/i.test(lastUserMessage)) {
      return "You have been working so hard. It is perfectly okay to step away and rest. I will watch over things here.";
    } else if (/(hate|stupid|idiot|annoying|mad)/i.test(lastUserMessage)) {
      return "Let it all out! I'm glad you vented to me instead of holding it in. Take a deep breath.";
    } else {
      return "I hear you, and I am proud of you for sharing that. I'm always here for you.";
    }
  }
}

function appendChatBubble(text, sender, mood = 'default') {
  const wrapper = document.createElement('div');
  wrapper.className = `chat-wrapper wrapper-${sender}`;
  
  if (sender === 'katban') {
    const avatar = document.createElement('div');
    avatar.className = 'chat-avatar';
    
    const clone = catSvg.cloneNode(true);
    clone.removeAttribute('id');
    clone.classList.remove('mood-stressed', 'mood-tired', 'cat-chomp', 'mood-happy', 'mood-sad');
    if (mood !== 'default') {
      clone.classList.add(`mood-${mood}`);
    }
    avatar.appendChild(clone);
    wrapper.appendChild(avatar);
  }

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble chat-${sender}`;
  bubble.textContent = text;
  wrapper.appendChild(bubble);
  
  rantChatHistory.appendChild(wrapper);
  rantChatHistory.scrollTop = rantChatHistory.scrollHeight;
  return wrapper;
}

// Copy SVG to static display on load
const headerCatSvg = catSvg.cloneNode(true);
headerCatSvg.removeAttribute('id');
headerCatSvg.classList.remove('mood-stressed', 'mood-tired', 'cat-chomp');
document.getElementById('rant-header-cat').appendChild(headerCatSvg);

const headerCatSvgMain = catSvg.cloneNode(true);
headerCatSvgMain.removeAttribute('id');
headerCatSvgMain.classList.remove('mood-stressed', 'mood-tired', 'cat-chomp');
document.getElementById('rant-header-cat-main').appendChild(headerCatSvgMain);

async function submitRant() {
  const text = rantInput.value.trim();
  if (!text) return;
  // Prevent concurrent submissions that would corrupt chatHistory across overlapping awaits
  if (btnSubmitRant.disabled) return;
  
  btnSubmitRant.disabled = true;
  rantInput.disabled = true;

  rantInput.value = '';
  
  // Append user message
  appendChatBubble(text, 'user');
  
  chatHistory.push({ role: 'user', content: text });
  if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10);
  
  // 1. Paper flies up
  rantPaper.classList.remove('hidden');
  rantPaper.classList.add('animate-fly-paper');
  
  // 2. Process AI in background
  let reply;
  try {
    reply = await analyzeRant(chatHistory);
  } finally {
    // Always re-enable input regardless of success or failure
    btnSubmitRant.disabled = false;
    rantInput.disabled = false;
    rantInput.focus();
  }
  
  chatHistory.push({ role: 'assistant', content: reply });
  if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10);
  
  // 3. Hearts, Reply, and Emotion
  setTimeout(() => {
    rantPaper.classList.add('hidden');
    rantPaper.classList.remove('animate-fly-paper');
    spawnHearts();
    
    // Determine emotion
    let mood = 'default';
    const lower = reply.toLowerCase();
    if (/(happy|proud|great|good|glad|wonderful|awesome|love|thank|purrfect|pawsitive|smile)/i.test(lower)) {
      mood = 'happy';
    } else if (/(sorry|safe|hurt|tough|hard|worry|worried|sad|difficult|unacceptable|betrayal|infidelity|raw|pain|struggle|frustrated|frustrating)/i.test(lower)) {
      mood = 'sad';
    }

    appendChatBubble(reply, 'katban', mood);
  }, 500);

}

btnSubmitRant.addEventListener('click', submitRant);
rantInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    submitRant();
  }
});
