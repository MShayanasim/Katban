// ──────────────────────────────────────────────
// KATBAN BACKGROUND SERVICE WORKER
// Central Brain for Cat State and Pomodoro Timer
// ──────────────────────────────────────────────

const BREAK_DURATION = 5 * 60; // 5 minutes in seconds

let sharedCatEnabled = false;

// ── Brain Management ──────────────────────────
const brains = new Map(); // tabId or 'global' -> state object

function scheduleIdle(id) {
  chrome.alarms.create(`idle_${id}`, { delayInMinutes: 3 });
}

function scheduleProp(id) {
  const delay = (Math.random() * (8 - 3) + 3);
  chrome.alarms.create(`prop_${id}`, { delayInMinutes: delay });
}

function getBrain(tabId) {
  const id = sharedCatEnabled ? 'global' : tabId;
  if (!brains.has(id)) {
    brains.set(id, {
      id: id,
      state: null,
      danceBankMs: 0,
      lastTypeTime: 0,
      danceInterval: null
    });
    scheduleIdle(id);
    scheduleProp(id);
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
  if (brain.state === newState) return;
  brain.state = newState;
  broadcastState(brain);
}

// ── Dance / Typing Logic ──────────────────────
function checkFocusAndRevert(brain) {
  setBrainState(brain, null);
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
      focusSessions: []
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
  if (chrome.runtime.lastError) return;
  data = data || {};
  sharedCatEnabled = data.sharedCatEnabled === true;
});

chrome.alarms.onAlarm.addListener((alarm) => {
  // ── Pomodoro End Alarm ──
  if (alarm.name === 'pomodoroEnd') {
    chrome.storage.local.get(['timerState', 'isUnlimited', 'customDuration'], (data) => {
      if (chrome.runtime.lastError) return;
      data = data || {};

      if (data.timerState === 'focus' && !data.isUnlimited) {
        // Focus ended → start break
        const focusDurationMs = Date.now() - (data.startTime || Date.now());
        const focusMinutes = Math.round(focusDurationMs / 60000);
        
        if (focusMinutes > 0) {
          chrome.storage.local.get(['focusSessions'], (sessData) => {
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

  // ── Cat Alarms ──
  // Use indexOf to correctly split alarm names like "leaveprop_global"
  const underscoreIdx = alarm.name.indexOf('_');
  if (underscoreIdx === -1) return;
  const action = alarm.name.substring(0, underscoreIdx);
  const rawId = alarm.name.substring(underscoreIdx + 1);
  const id = rawId === 'global' ? 'global' : parseInt(rawId, 10);
  if (id !== 'global' && isNaN(id)) return;

  const brain = brains.get(id);
  if (!brain) return;

  switch (action) {
    case 'idle':
      if (brain.state !== 'exhausted' && brain.state !== 'dancing' &&
          brain.state !== 'peeking' && brain.state !== 'judging') {
        setBrainState(brain, 'sleeping');
      }
      break;
    case 'prop':
      if (brain.state !== 'on-prop' && brain.state !== 'leaving-prop' &&
          brain.state !== 'peeking' && brain.state !== 'judging') {
        setBrainState(brain, 'on-prop');
        const leaveDelay = (Math.random() * 60000 + 30000) / 60000;
        chrome.alarms.create(`leaveprop_${brain.id}`, { delayInMinutes: leaveDelay });
      }
      scheduleProp(brain.id);
      break;
    case 'leaveprop':
      if (brain.state === 'on-prop') {
        setBrainState(brain, 'leaving-prop');
        // Content script handles the 1.5s revert timeout locally
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

// ── Message Handling from popup & content ──────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
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
        customDuration: duration
      });

      if (!isUnlimited) {
        chrome.alarms.create('pomodoroEnd', { when: endTime });
      }

      notifyAllTabs({ type: 'TIMER_STATE', state: 'focus' });
      blockCurrentTabs();
      sendResponse({ ok: true });
      break;
    }

    case 'STOP_TIMER': {
      chrome.storage.local.get(['timerState', 'startTime'], (data) => {
        if (data && data.timerState === 'focus') {
          const focusDurationMs = Date.now() - (data.startTime || Date.now());
          const focusMinutes = Math.round(focusDurationMs / 60000);
          
          if (focusMinutes > 0) {
            chrome.storage.local.get(['focusSessions'], (sessData) => {
              const sessions = sessData.focusSessions || [];
              sessions.push({ timestamp: Date.now(), minutes: focusMinutes });
              const sixtyDaysAgo = Date.now() - (60 * 24 * 60 * 60 * 1000);
              chrome.storage.local.set({ focusSessions: sessions.filter(s => s.timestamp > sixtyDaysAgo) });
            });
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
      });
      sendResponse({ ok: true });
      break;
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
      break;
    }

    case 'CAT_EVENT': {
      const tabId = sender.tab ? sender.tab.id : null;
      if (!tabId) break;

      const brain = getBrain(tabId);

      switch (msg.event) {
        case 'ACTIVITY':
          if (brain.state === 'sleeping') {
            setBrainState(brain, null);
          }
          scheduleIdle(brain.id);
          break;

        case 'TYPING':
          if (brain.state === 'peeking' || brain.state === 'judging' ||
              brain.state === 'on-prop' || brain.state === 'leaving-prop') break;
          brain.lastTypeTime = Date.now();
          brain.danceBankMs += 500;
          if (brain.danceBankMs > 2500) brain.danceBankMs = 2500;
          startDanceLoop(brain);
          scheduleIdle(brain.id);
          break;

        case 'SET_STATE':
          if (brain.state === 'on-prop') break; // Only block on-prop, leaving-prop must be cleared by content script
          setBrainState(brain, msg.state);
          break;

        case 'REQUEST_SYNC':
          chrome.tabs.sendMessage(tabId, { type: 'SYNC_CAT_STATE', state: brain.state }).catch(() => {});
          break;
      }
      break;
    }

    case 'COPY_EVENT': {
      const tabId = sender.tab ? sender.tab.id : null;
      if (!tabId) break;

      chrome.storage.local.get(['clipboardHistory'], (data) => {
        if (chrome.runtime.lastError) return;
        data = data || {};
        let history = data.clipboardHistory || [];
        history.unshift({ text: msg.text, timestamp: Date.now() });
        if (history.length > 15) history = history.slice(0, 15);
        chrome.storage.local.set({ clipboardHistory: history });
      });

      if (msg.text && msg.text.length > 500) {
        const brain = getBrain(tabId);
        setBrainState(brain, 'judging');
        // Content script handles the 3.2s revert timeout locally
      }
      break;
    }
  }

  return true;
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
    if (chrome.runtime.lastError) return;
    data = data || {};
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
