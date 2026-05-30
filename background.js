// ──────────────────────────────────────────────
// KATBAN BACKGROUND SERVICE WORKER
// Central Brain for Cat State and Pomodoro Timer
// ──────────────────────────────────────────────

// Import crypto helpers — MUST be first so katbanEncrypt/katbanDecrypt
// are available globally before any message handlers run.
// In MV3 service workers the global scope is isolated from popups and
// content scripts, so every dependency must be explicitly imported.
try {
  importScripts('crypto.js');
} catch (e) {
  console.warn('Katban: Failed to import crypto.js. This is a known Chrome bug during rapid extension reloading.', e);
}

const BREAK_DURATION = 5 * 60; // 5 minutes in seconds

let sharedCatEnabled = false;

// ── Active Task State ─────────────────────────
// Declared BEFORE getBrain() to prevent temporal dead zone.
// The async storage read below populates it before any messages can arrive.
let currentActiveTask = null;
let _storageLoaded = false;
let neverSleepEnabled = false;

chrome.storage.local.get(['katbanActiveTask', 'katbanSharedCat', 'katbanNeverSleep'], (data) => {
  data = data || {};
  currentActiveTask = data.katbanActiveTask || null;
  sharedCatEnabled = !!data.katbanSharedCat;
  neverSleepEnabled = !!data.katbanNeverSleep;
  _storageLoaded = true;
  // Correct any brains created before storage resolved (edge case: fast message on install)
  brains.forEach((brain) => {
    if (brain.state === null && currentActiveTask) {
      setBrainState(brain, 'holding-task');
    }
  });
});

async function ensureStorageLoaded() {
  if (_storageLoaded) return;
  return new Promise(resolve => {
    chrome.storage.local.get(['katbanActiveTask', 'katbanSharedCat', 'katbanNeverSleep'], (data) => {
      data = data || {};
      currentActiveTask = data.katbanActiveTask || null;
      sharedCatEnabled = !!data.katbanSharedCat;
      neverSleepEnabled = !!data.katbanNeverSleep;
      _storageLoaded = true;
      resolve();
    });
  });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    if (changes.katbanActiveTask !== undefined) {
      currentActiveTask = changes.katbanActiveTask.newValue || null;
    }
    if (changes.katbanNeverSleep !== undefined) {
      neverSleepEnabled = !!changes.katbanNeverSleep.newValue;
      
      // If neverSleep just turned on and brains are sleeping, wake them up to idle
      if (neverSleepEnabled) {
        brains.forEach(brain => {
          if (brain.state === 'sleeping') {
            setBrainState(brain, currentActiveTask ? 'holding-task' : null);
          }
        });
      }
    }
  }
});

// ── Brain Management ──────────────────────────
const brains = new Map(); // tabId or 'global' -> state object

function scheduleIdle(id, force = false) {
  if (force) {
    chrome.alarms.create(`idle_${id}`, { delayInMinutes: 3 });
  } else {
    chrome.alarms.get(`idle_${id}`, (alarm) => {
      if (!alarm) {
        chrome.alarms.create(`idle_${id}`, { delayInMinutes: 3 });
      }
    });
  }
}

function scheduleProp(id, force = false) {
  if (force) {
    const delay = (Math.random() * (5 - 3) + 3);
    chrome.alarms.create(`prop_${id}`, { delayInMinutes: delay });
  } else {
    chrome.alarms.get(`prop_${id}`, (alarm) => {
      if (!alarm) {
        const delay = (Math.random() * (5 - 3) + 3);
        chrome.alarms.create(`prop_${id}`, { delayInMinutes: delay });
      }
    });
  }
}

function getBrain(tabId) {
  const id = sharedCatEnabled ? 'global' : tabId;
  if (!brains.has(id)) {
    // Use currentActiveTask safely — it's declared above and will be null
    // until storage resolves, at which point the storage callback above
    // corrects any brains that were created with stale null state.
    brains.set(id, {
      id: id,
      state: currentActiveTask ? 'holding-task' : null,
      danceBankMs: 0,
      lastTypeTime: 0,
      danceInterval: null
    });
    scheduleIdle(id, false);
    scheduleProp(id, false);
  }
  return brains.get(id);
}


function broadcastState(brain) {
  if (brain.id === 'global') {
    chrome.storage.local.set({ globalCatState: brain.state });
    notifyAllTabs({ type: 'SYNC_CAT_STATE', state: brain.state });
  } else {
    chrome.tabs.sendMessage(brain.id, { type: 'SYNC_CAT_STATE', state: brain.state }).catch(() => {});
  }
}

function setBrainState(brain, newState) {
  // If reverting to idle but we have an active task, revert to holding-task instead
  if (newState === null && currentActiveTask) {
    newState = 'holding-task';
  }
  
  if (brain.state === newState && newState !== 'judging') return;
  brain.state = newState;
  broadcastState(brain);
}

// ── Dance / Typing Logic ──────────────────────
function checkFocusAndRevert(brain) {
  if (brain.state === 'peeking' || brain.state === 'surprised' || brain.state === 'judging') {
    setBrainState(brain, null);
  }
  if (brain.id === 'global') {
    notifyAllTabs({ type: 'REQUEST_FOCUS_STATE' });
  } else {
    chrome.tabs.sendMessage(brain.id, { type: 'REQUEST_FOCUS_STATE' }).catch(() => {});
  }
}

function startDanceLoop(brain) {
  if (brain.danceInterval) return;
  let danceStartTime = Date.now();
  
  brain.danceInterval = setInterval(() => {
    // Guard: if the brain was deleted (tab closed) between ticks, self-terminate.
    if (!brains.has(brain.id)) {
      clearInterval(brain.danceInterval);
      brain.danceInterval = null;
      return;
    }

    if (brain.danceBankMs > 0) {
      brain.danceBankMs -= 100;
      
      if (Date.now() - brain.lastTypeTime > 1000) {
        if (brain.state === 'exhausted') {
          setBrainState(brain, 'dancing');
          danceStartTime = Date.now();
        }
      }

      if (brain.state === 'dancing') {
        if (Date.now() - danceStartTime > 7000 && Date.now() - brain.lastTypeTime <= 1000) {
          setBrainState(brain, 'exhausted');
        }
      } else if (brain.state !== 'exhausted' && brain.state !== 'peeking' && brain.state !== 'judging' && brain.state !== 'on-prop' && brain.state !== 'leaving-prop') {
        setBrainState(brain, 'dancing');
        danceStartTime = Date.now();
      }
    } else {
      // Bank empty — clean up
      clearInterval(brain.danceInterval);
      brain.danceInterval = null;
      brain.danceBankMs = 0;
      if (brain.state === 'dancing' || brain.state === 'exhausted') {
        checkFocusAndRevert(brain);
      }
    }
  }, 100);
}

// ── Chrome Init & Alarms ──────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(null, (existing) => {
    const defaults = {
      timerState: 'idle',
      endTime: null,
      startTime: null,
      isUnlimited: false,
      customDuration: 25 * 60,
      blockedSites: [],
      clipboardHistory: [],
      pageCatEnabled: true,
      meaningCatEnabled: true,
      sharedCatEnabled: false,
      globalCatState: null,
      catStyle: 'primary',
      focusSessions: [],
      muteOverlaySound: false  // Missing default — new installs need this to avoid undefined toggle state

    };
    const toSet = {};
    for (const key in defaults) {
      if (existing[key] === undefined) {
        toSet[key] = defaults[key];
      }
    }
    // Migration: remove obsolete timeRemaining key from old versions
    if (existing.timeRemaining !== undefined) {
      chrome.storage.local.remove('timeRemaining');
    }
    if (Object.keys(toSet).length > 0) {
      chrome.storage.local.set(toSet);
    }
  });
});

// Load initial shared setting
chrome.storage.local.get(['sharedCatEnabled'], (data) => {
  data = data || {};
  sharedCatEnabled = data.sharedCatEnabled === true;
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  await ensureStorageLoaded();

  // ── Pomodoro End Alarm ──
  if (alarm.name === 'pomodoroEnd') {
    chrome.storage.local.get(['timerState', 'isUnlimited', 'customDuration'], (data) => {
      data = data || {};
      if (chrome.runtime.lastError) return;

      if (data.timerState === 'focus' && !data.isUnlimited) {
        // Focus ended → start break
        const focusDurationMs = Date.now() - (data.startTime || Date.now());
        const focusMinutes = Math.round(focusDurationMs / 60000);
        
        if (focusMinutes > 0) {
          chrome.storage.local.get(['focusSessions'], (sessData) => {
            sessData = sessData || {};
            const sessions = sessData.focusSessions || [];
            sessions.push({ timestamp: Date.now(), minutes: focusMinutes });
            // keep only last 60 days
            const sixtyDaysAgo = Date.now() - (60 * 24 * 60 * 60 * 1000);
            const filteredSessions = sessions.filter(s => s.timestamp > sixtyDaysAgo);
            chrome.storage.local.set({ focusSessions: filteredSessions });
          });
        }

        const breakEndTime = Date.now() + BREAK_DURATION * 1000;
        chrome.storage.local.set({
          timerState: 'break',
          startTime: Date.now(),
          endTime: breakEndTime
        });
        chrome.alarms.create('pomodoroEnd', { when: breakEndTime });
        notifyAllTabs({ type: 'TIMER_STATE', state: 'break' });
      } else if (data.timerState === 'break') {
        // Break ended → go idle
        chrome.storage.local.set({
          timerState: 'idle',
          endTime: null,
          startTime: null,
          isUnlimited: false
        });
        chrome.alarms.clear('pomodoroEnd');
        notifyAllTabs({ type: 'TIMER_STATE', state: 'idle' });
      }
    });
    return;
  }

  if (alarm.name === 'pomodoroTick') {
    handlePomodoroTick();
    return;
  }

  // ── Cat Alarms ──
  // Use indexOf to correctly split alarm names like "leaveprop_global"
  const underscoreIdx = alarm.name.indexOf('_');
  if (underscoreIdx === -1) return;
  const action = alarm.name.substring(0, underscoreIdx);
  const rawId = alarm.name.substring(underscoreIdx + 1);
  const id = rawId === 'global' ? 'global' : parseInt(rawId, 10);
  if (id !== 'global' && isNaN(id)) return;

  const brain = getBrain(id);
  if (!brain) return;

  switch (action) {
    case 'idle':
      if (brain.state === 'on-prop' || brain.state === 'leaving-prop') {
        chrome.alarms.create(`idle_${brain.id}`, { delayInMinutes: 1 });
      } else if (!neverSleepEnabled && brain.state !== 'exhausted' && brain.state !== 'dancing' &&
          brain.state !== 'peeking' && brain.state !== 'judging') {
        setBrainState(brain, 'sleeping');
      } else if (neverSleepEnabled) {
        setBrainState(brain, null);
      }
      break;
    case 'prop':
      if (brain.state !== 'on-prop' && brain.state !== 'leaving-prop' &&
          brain.state !== 'peeking' && brain.state !== 'judging') {
        setBrainState(brain, 'on-prop');
        const leaveDelay = (Math.random() * 60000 + 30000) / 60000;
        chrome.alarms.create(`leaveprop_${brain.id}`, { delayInMinutes: leaveDelay });
      }
      scheduleProp(brain.id, true);
      break;
    case 'leaveprop':
      if (brain.state === 'on-prop') {
        setBrainState(brain, 'leaving-prop');
      }
      break;
  }
});

// ── Tab Cleanup ────────────────────────────────
chrome.tabs.onRemoved.addListener((tabId) => {
  if (brains.has(tabId)) {
    const brain = brains.get(tabId);
    if (brain.danceInterval) clearInterval(brain.danceInterval);
    brains.delete(tabId);
    chrome.alarms.clear(`idle_${tabId}`);
    chrome.alarms.clear(`prop_${tabId}`);
    chrome.alarms.clear(`leaveprop_${tabId}`);
  }
});

// ── Clipboard Queue ────────────────────────────
const copyQueue = [];
let isProcessingCopy = false;

async function processCopyQueue() {
  if (isProcessingCopy || copyQueue.length === 0) return;
  isProcessingCopy = true;

  const { msg, tabId } = copyQueue.shift();

  await new Promise(resolve => {
    chrome.storage.local.get(['clipboardHistory'], async (data) => {
      data = data || {};
      if (chrome.runtime.lastError) return resolve();
      let history = data.clipboardHistory || [];

      // ── Duplicate detection via decryption ──────────────────────────────
      for (const item of history) {
        let itemPlaintext;
        if (item.text === '[Sensitive Data Protected]') {
          itemPlaintext = '[Sensitive Data Protected]';
        } else {
          itemPlaintext = await katbanDecrypt(item.text);
        }
        if (itemPlaintext === msg.text) {
          setBrainState(getBrain(tabId), 'judging');
          chrome.tabs.sendMessage(tabId, { type: 'CLIPBOARD_DUPLICATE' }).catch(() => {});
          return resolve();
        }
      }

      // ── New unique entry ──────────────────────────
      let textToStore = msg.text;
      if (msg.text !== '[Sensitive Data Protected]') {
        textToStore = await katbanEncrypt(msg.text) || msg.text;
      }

      const clipId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      history.unshift({ id: clipId, text: textToStore, timestamp: Date.now() });
      
      const pinned = history.filter(item => item.pinned);
      const unpinned = history.filter(item => !item.pinned);
      
      history = [...pinned, ...unpinned].slice(0, 15);
      
      chrome.storage.local.set({ clipboardHistory: history }, () => {
        if (msg.text && msg.text.length > 500) {
          setBrainState(getBrain(tabId), 'judging');
          chrome.tabs.sendMessage(tabId, { type: 'CLIPBOARD_LARGE_COPY' }).catch(() => {});
        }
        resolve();
      });
    });
  });

  isProcessingCopy = false;
  processCopyQueue(); // Process next item if any
}

// ── Message Handling from popup & content ──────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Only process messages originating from this extension itself.
  // This prevents a malicious third-party extension from triggering
  // Katban's timer, site blocker, or cat state via sendMessage.
  if (sender.id !== chrome.runtime.id) return false;

  switch (msg.type) {
    case 'START_FOCUS': {
      const duration = msg.duration; // -1 for unlimited, or seconds
      const isUnlimited = duration === -1;
      const now = Date.now();
      const effectiveDuration = (!isUnlimited && duration > 0) ? duration : 25 * 60;
      const endTime = isUnlimited ? null : (now + effectiveDuration * 1000);

      chrome.storage.local.set({
        timerState: 'focus',
        startTime: now,
        endTime: endTime,
        isUnlimited: isUnlimited,
        // Store the effective timed duration (never -1) so the idle UI can
        // restore the last used time. isUnlimited handles the unlimited case.
        customDuration: effectiveDuration
      });

      if (!isUnlimited) {
        chrome.alarms.create('pomodoroEnd', { when: endTime });
      }

      notifyAllTabs({ type: 'TIMER_STATE', state: 'focus' });
      blockCurrentTabs();
      sendResponse({ ok: true });
      return false; // sync response — close channel immediately
    }

    case 'STOP_TIMER': {
      chrome.storage.local.get(['timerState', 'startTime'], (data) => {
        data = data || {};
        if (data && data.timerState === 'focus') {
          // Guard: if startTime is missing, skip session recording rather than
          // computing Date.now() - Date.now() = 0 and silently discarding the session.
          if (data.startTime) {
            const focusDurationMs = Date.now() - data.startTime;
            const focusMinutes = Math.round(focusDurationMs / 60000);
            
            if (focusMinutes > 0) {
              chrome.storage.local.get(['focusSessions'], (sessData) => {
                sessData = sessData || {};
                const sessions = sessData.focusSessions || [];
                sessions.push({ timestamp: Date.now(), minutes: focusMinutes });
                const sixtyDaysAgo = Date.now() - (60 * 24 * 60 * 60 * 1000);
                chrome.storage.local.set({ focusSessions: sessions.filter(s => s.timestamp > sixtyDaysAgo) });
              });
            }
          }
        }
        
        chrome.storage.local.set({
          timerState: 'idle',
          endTime: null,
          startTime: null,
          isUnlimited: false
        });
        chrome.alarms.clear('pomodoroEnd');
        notifyAllTabs({ type: 'TIMER_STATE', state: 'idle' });
        // Respond AFTER all state is saved and tabs are notified
        sendResponse({ ok: true });
      });
      return true; // async response — keep channel open until callback fires
    }

    case 'UPDATE_SHARED_SETTING': {
      sharedCatEnabled = msg.enabled;
      // Clear old brains
      brains.forEach((brain, key) => {
        if (brain.danceInterval) clearInterval(brain.danceInterval);
        chrome.alarms.clear(`idle_${key}`);
        chrome.alarms.clear(`prop_${key}`);
        chrome.alarms.clear(`leaveprop_${key}`);
      });
      brains.clear();

      // Reset all tabs to idle animation
      notifyAllTabs({ type: 'SYNC_CAT_STATE', state: null });

      if (sharedCatEnabled) {
        getBrain('global');
      }
      return false;
    }

    case 'CAT_EVENT': {
      const tabId = sender.tab ? sender.tab.id : null;
      if (!tabId) return false;

      ensureStorageLoaded().then(() => {
        const brain = getBrain(tabId);

        switch (msg.event) {
          case 'ACTIVITY':
            if (brain.state === 'sleeping') {
              setBrainState(brain, null);
            }
            scheduleIdle(brain.id, true);
            break;

          case 'TYPING':
            if (brain.state === 'peeking' || brain.state === 'judging' ||
                brain.state === 'on-prop' || brain.state === 'leaving-prop') break;
            brain.lastTypeTime = Date.now();
            brain.danceBankMs += 500;
            if (brain.danceBankMs > 2500) brain.danceBankMs = 2500;
            startDanceLoop(brain);
            scheduleIdle(brain.id, true);
            break;

          case 'SET_STATE':
            if (brain.state === 'on-prop') break; // Only block on-prop, leaving-prop must be cleared by content script
            setBrainState(brain, msg.state);
            break;

          case 'REQUEST_SYNC':
            if (brain.state === null && currentActiveTask) {
              setBrainState(brain, 'holding-task');
            }
            chrome.tabs.sendMessage(tabId, { type: 'SYNC_CAT_STATE', state: brain.state }).catch(() => {});
            break;
        }
      });
      return false;
    }

    case 'ACTIVE_TASK_UPDATE': {
      // Synchronously update local variable to prevent race condition in setBrainState
      currentActiveTask = msg.task || null;
      // Save globally for block pages
      chrome.storage.local.set({ katbanActiveTask: currentActiveTask });
      // Notify all cats to hold or stop holding the task
      if (currentActiveTask) {
        if (sharedCatEnabled) {
          setBrainState(getBrain('global'), 'holding-task');
        } else {
          for (let id of brains.keys()) {
            setBrainState(getBrain(id), 'holding-task');
          }
        }
      } else {
        // If task is cleared, reset state
        if (sharedCatEnabled) {
          setBrainState(getBrain('global'), null);
        } else {
          for (let id of brains.keys()) {
            setBrainState(getBrain(id), null);
          }
        }
      }
      return false;
    }

    case 'COPY_EVENT': {
      const tabId = sender.tab ? sender.tab.id : null;
      if (!tabId) return false;

      copyQueue.push({ msg, tabId });
      processCopyQueue();

      return false;
    }

    case 'FETCH_DICTIONARY': {
      fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(msg.word)}`)
        .then(res => {
          if (!res.ok) throw new Error('Not found');
          return res.json();
        })
        .then(data => sendResponse({ data }))
        .catch(err => sendResponse({ error: true }));
      return true;
    }

    default:
      return false;
  }
});


// ── Proper hostname-based site blocking ────────
function isBlocked(url, blockedSites) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return blockedSites.some(site => {
      const pattern = site.trim().toLowerCase();
      if (!pattern) return false;
      // Match exact domain or any subdomain
      return hostname === pattern || hostname.endsWith('.' + pattern);
    });
  } catch {
    return false;
  }
}

// ── Block already-open tabs when focus starts ──
function blockCurrentTabs() {
  chrome.storage.local.get(['blockedSites'], (data) => {
    data = data || {};
    if (chrome.runtime.lastError) return;
    const blockedSites = data.blockedSites || [];
    if (blockedSites.length === 0) return;

    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (!tab.url || !tab.id) return;
        if (isBlocked(tab.url, blockedSites)) {
          chrome.tabs.sendMessage(tab.id, { type: 'BLOCK_PAGE' }).catch(() => {});
        }
      });
    });
  });
}

// ── Tab Monitoring for Site Blocking ──────────
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;
  chrome.storage.local.get(['timerState', 'blockedSites'], (data) => {
    if (chrome.runtime.lastError) return;
    data = data || {};
    if (data.timerState !== 'focus') return;
    if (isBlocked(tab.url, data.blockedSites || [])) {
      chrome.tabs.sendMessage(tabId, { type: 'BLOCK_PAGE' }).catch(() => {});
    }
  });
});

// ── Helper: Notify all content-script-eligible tabs ──
function notifyAllTabs(msg) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.id && tab.url && /^https?:\/\//.test(tab.url)) {
        chrome.tabs.sendMessage(tab.id, msg).catch(() => {});
      }
    });
  });
}
