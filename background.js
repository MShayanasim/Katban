// ──────────────────────────────────────────────
// KATBAN BACKGROUND SERVICE WORKER
// Central Brain for Cat State and Pomodoro Timer
// ──────────────────────────────────────────────

let POMODORO_DURATION = 25 * 60; // default 25 minutes in seconds
const BREAK_DURATION = 5 * 60;     // 5 minutes in seconds

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
      // Empty, clean up
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
  chrome.storage.local.set({
    timerState: 'idle',
    timeRemaining: POMODORO_DURATION,
    isUnlimited: false,
    customDuration: POMODORO_DURATION,
    blockedSites: [],
    clipboardHistory: [],
    pageCatEnabled: true,
    meaningCatEnabled: true,
    sharedCatEnabled: false,
    globalCatState: null,
    catStyle: 'primary'
  });
});

// Load initial shared setting
chrome.storage.local.get(['sharedCatEnabled'], (data) => {
  if (chrome.runtime.lastError) return;
  data = data || {};
  sharedCatEnabled = data.sharedCatEnabled === true;
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'pomodoroTick') {
    chrome.storage.local.get(['timerState', 'timeRemaining', 'isUnlimited'], (data) => {
      if (chrome.runtime.lastError) return;
      data = data || {};
      const { timerState, timeRemaining, isUnlimited } = data;
      if (timerState === 'idle') {
        chrome.alarms.clear('pomodoroTick');
        return;
      }

      if (isUnlimited) {
        // Unlimited mode: count UP
        chrome.storage.local.set({ timeRemaining: (timeRemaining || 0) + 1 });
        return;
      }

      if (timeRemaining <= 1) {
        if (timerState === 'focus') {
          chrome.storage.local.set({ timerState: 'break', timeRemaining: BREAK_DURATION });
          notifyAllTabs({ type: 'TIMER_STATE', state: 'break' });
        } else {
          chrome.storage.local.get(['customDuration'], (d) => {
            if (chrome.runtime.lastError) return;
            d = d || {};
            const resetTo = (d.customDuration && d.customDuration > 0) ? d.customDuration : POMODORO_DURATION;
            chrome.storage.local.set({ timerState: 'idle', timeRemaining: resetTo });
            chrome.alarms.clear('pomodoroTick');
            notifyAllTabs({ type: 'TIMER_STATE', state: 'idle' });
          });
        }
      } else {
        chrome.storage.local.set({ timeRemaining: timeRemaining - 1 });
      }
    });
    return;
  }

  // Cat Alarms
  const parts = alarm.name.split('_');
  if (parts.length < 2) return;
  const action = parts[0];
  const id = parts[1] === 'global' ? 'global' : parseInt(parts[1]);
  const brain = brains.get(id);
  if (!brain) return;

  if (action === 'idle') {
    if (brain.state !== 'exhausted' && brain.state !== 'dancing' && brain.state !== 'peeking' && brain.state !== 'judging') {
      setBrainState(brain, 'sleeping');
    }
  } else if (action === 'prop') {
    if (brain.state !== 'on-prop' && brain.state !== 'leaving-prop' && brain.state !== 'peeking' && brain.state !== 'judging') {
      setBrainState(brain, 'on-prop');
      const leaveDelay = (Math.random() * 60000 + 30000) / 60000;
      chrome.alarms.create(`leaveprop_${brain.id}`, { delayInMinutes: leaveDelay });
    }
    scheduleProp(brain.id);
  } else if (action === 'leaveprop') {
    if (brain.state === 'on-prop') {
      setBrainState(brain, 'leaving-prop');
      setTimeout(() => {
        if (brain.state === 'leaving-prop') {
          checkFocusAndRevert(brain);
        }
      }, 1500);
    }
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
  // Timer Messages
  if (msg.type === 'START_FOCUS') {
    const duration = msg.duration; // -1 for unlimited, or seconds
    const isUnlimited = duration === -1;
    if (!isUnlimited && duration > 0) POMODORO_DURATION = duration;
    chrome.storage.local.set({
      timerState: 'focus',
      timeRemaining: isUnlimited ? 0 : (duration > 0 ? duration : POMODORO_DURATION),
      isUnlimited: isUnlimited,
      customDuration: duration
    });
    chrome.alarms.create('pomodoroTick', { periodInMinutes: 1 / 60 });
    notifyAllTabs({ type: 'TIMER_STATE', state: 'focus' });
    sendResponse({ ok: true });
  }
  if (msg.type === 'STOP_TIMER') {
    chrome.storage.local.get(['customDuration'], (d) => {
      if (chrome.runtime.lastError) return;
      d = d || {};
      const dur = d.customDuration;
      const resetTo = (dur && dur > 0) ? dur : POMODORO_DURATION;
      chrome.storage.local.set({
        timerState: 'idle',
        timeRemaining: resetTo,
        isUnlimited: false
      });
      chrome.alarms.clear('pomodoroTick');
      notifyAllTabs({ type: 'TIMER_STATE', state: 'idle' });
    });
    sendResponse({ ok: true });
  }
  
  // Settings Update
  if (msg.type === 'UPDATE_SHARED_SETTING') {
    sharedCatEnabled = msg.enabled;
    // Clear old brains
    brains.forEach((brain, key) => {
      if (brain.danceInterval) clearInterval(brain.danceInterval);
      chrome.alarms.clear(`idle_${key}`);
      chrome.alarms.clear(`prop_${key}`);
      chrome.alarms.clear(`leaveprop_${key}`);
    });
    brains.clear();
    
    // Reset all tabs to the original idle animation immediately
    notifyAllTabs({ type: 'SYNC_CAT_STATE', state: null });

    if (sharedCatEnabled) {
      getBrain('global');
    }
  }

  // Client Event Sink
  const tabId = sender.tab ? sender.tab.id : null;
  if (!tabId) return true;
  
  if (msg.type === 'CAT_EVENT') {
    const brain = getBrain(tabId);
    const event = msg.event;
    
    if (event === 'ACTIVITY') {
      if (brain.state === 'sleeping') {
        setBrainState(brain, null);
      }
      scheduleIdle(brain.id);
    } 
    else if (event === 'TYPING') {
      if (brain.state === 'peeking' || brain.state === 'judging' || brain.state === 'on-prop' || brain.state === 'leaving-prop') return true;
      brain.lastTypeTime = Date.now();
      brain.danceBankMs += 500;
      if (brain.danceBankMs > 2500) brain.danceBankMs = 2500;
      startDanceLoop(brain);
    }
    else if (event === 'SET_STATE') {
      if (brain.state === 'on-prop' || brain.state === 'leaving-prop') return true;
      setBrainState(brain, msg.state);
    }
    else if (event === 'REQUEST_SYNC') {
      if (brain.id === 'global') {
        chrome.tabs.sendMessage(tabId, { type: 'SYNC_CAT_STATE', state: brain.state }).catch(() => {});
      } else {
        chrome.tabs.sendMessage(tabId, { type: 'SYNC_CAT_STATE', state: brain.state }).catch(() => {});
      }
    }
  }

  if (msg.type === 'COPY_EVENT') {
    chrome.storage.local.get(['clipboardHistory'], (data) => {
      if (chrome.runtime.lastError) return;
      data = data || {};
      let history = data.clipboardHistory || [];
      history.unshift({ text: msg.text, timestamp: Date.now() });
      if (history.length > 5) history = history.slice(0, 5);
      chrome.storage.local.set({ clipboardHistory: history });
    });
    
    if (msg.text && msg.text.length > 500) {
      const brain = getBrain(tabId);
      setBrainState(brain, 'judging');
      setTimeout(() => {
        if (brain.state === 'judging') setBrainState(brain, null);
      }, 3200);
    }
  }

  return true;
});

// ── Tab Monitoring for Site Blocking ──────────
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;
  chrome.storage.local.get(['timerState', 'blockedSites'], (data) => {
    if (chrome.runtime.lastError) return;
    data = data || {};
    if (data.timerState !== 'focus') return;
    const url = tab.url.toLowerCase();
    const blocked = (data.blockedSites || []).some(site => url.includes(site.trim().toLowerCase()));
    if (blocked) {
      chrome.tabs.sendMessage(tabId, { type: 'BLOCK_PAGE' });
    }
  });
});

// ── Helper: Notify all tabs ────────────────────
function notifyAllTabs(msg) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, msg).catch(() => {});
      }
    });
  });
}
