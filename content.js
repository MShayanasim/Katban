// ──────────────────────────────────────────────
// KATBAN CONTENT SCRIPT v2
// Sharp minimalist cat | Prefixed class names to
// avoid collision with host page styles.
// ──────────────────────────────────────────────

(function () {
  'use strict';

  // ── HOT-RELOAD CLEANUP ──
  // Dispatch event to kill any existing old script before initializing
  document.dispatchEvent(new CustomEvent('katban-unload-old'));

  if (window.__katbanInjected) return;
  window.__katbanInjected = true;

  let isInvalidated = false;

  function buildCatSVG(id_prefix) {
    return `
    <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" style="overflow: visible;">
      <defs>
        <clipPath id="${id_prefix}eyes-clip">
          <rect x="26" y="52" width="18" height="14"/>
          <rect x="56" y="52" width="18" height="14"/>
        </clipPath>
        <linearGradient id="${id_prefix}scan-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ff2222" stop-opacity="0.7"/>
          <stop offset="100%" stop-color="#ff2222" stop-opacity="0"/>
        </linearGradient>
        <pattern id="${id_prefix}brindle" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
          <rect width="40" height="40" fill="#685f54"/>
          <path d="M -40 8 Q -30 20 -20 8 T 0 8 Q 10 20 20 8 T 40 8 Q 50 20 60 8 T 80 8" stroke="#2b2725" stroke-width="5" fill="none"/>
          <path d="M -40 22 Q -32 32 -20 22 T 0 22 Q 8 32 20 22 T 40 22 Q 48 32 60 22 T 80 22" stroke="#2b2725" stroke-width="4" fill="none"/>
          <path d="M -40 34 Q -25 42 -20 34 T 0 34 Q 15 42 20 34 T 40 34 Q 55 42 60 34 T 80 34" stroke="#2b2725" stroke-width="6" fill="none"/>
        </pattern>
      </defs>

      <g class="k-box-back" opacity="0" transform="translate(20, 0)">
        <polygon points="5,80 95,80 85,72 15,72" fill="#C19A6B" stroke="var(--cat-stroke, #777)" stroke-width="2" stroke-linejoin="round"/>
      </g>
      
      <g class="k-cat-character" transform="translate(100, 0)">
        <!-- === POSES (SPRITES) === -->
        <g class="k-poses">
          <!-- 1. Loaf (Default) -->
          <g class="k-pose k-pose-loaf">
            <path class="k-tail" d="M 88 95 Q 100 80 95 65" fill="none" stroke="var(--cat-tail, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
            <ellipse class="k-body" cx="50" cy="95" rx="38" ry="18" fill="var(--cat-main, #c8c8c8)" stroke="var(--cat-stroke, #777)" stroke-width="2"/>
            <ellipse class="k-belly" cx="50" cy="96" rx="34" ry="14" fill="var(--cat-belly, transparent)" stroke="none"/>
            <g class="k-tucked-paws">
              <ellipse cx="38" cy="108" rx="8" ry="5" fill="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke="var(--cat-stroke, #777)" stroke-width="1.5"/>
              <ellipse cx="62" cy="108" rx="8" ry="5" fill="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke="var(--cat-stroke, #777)" stroke-width="1.5"/>
            </g>
            <g class="k-paws" opacity="0">
              <ellipse cx="35" cy="85" rx="6" ry="10" fill="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke="var(--cat-stroke, #777)" stroke-width="2"/>
              <ellipse cx="65" cy="85" rx="6" ry="10" fill="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke="var(--cat-stroke, #777)" stroke-width="2"/>
            </g>
          </g>

          <!-- 2. Run Frame 1 -->
          <g class="k-pose k-pose-run1" opacity="0">
            <ellipse cx="50" cy="85" rx="35" ry="15" fill="var(--cat-main, #c8c8c8)" stroke="var(--cat-stroke, #777)" stroke-width="2"/>
            <ellipse cx="50" cy="88" rx="30" ry="12" fill="var(--cat-belly, transparent)" stroke="none"/>
            <path d="M 85 85 Q 95 70 80 60" fill="none" stroke="var(--cat-tail, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
            <line x1="30" y1="95" x2="25" y2="115" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
            <line x1="70" y1="95" x2="65" y2="115" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
            <line x1="45" y1="95" x2="50" y2="115" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
            <line x1="60" y1="95" x2="55" y2="115" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
          </g>

          <!-- 3. Run Frame 2 -->
          <g class="k-pose k-pose-run2" opacity="0">
            <ellipse cx="50" cy="88" rx="36" ry="14" fill="var(--cat-main, #c8c8c8)" stroke="var(--cat-stroke, #777)" stroke-width="2"/>
            <ellipse cx="50" cy="90" rx="30" ry="11" fill="var(--cat-belly, transparent)" stroke="none"/>
            <path d="M 86 88 Q 100 80 85 70" fill="none" stroke="var(--cat-tail, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
            <line x1="30" y1="98" x2="35" y2="115" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
            <line x1="70" y1="98" x2="75" y2="115" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
            <line x1="45" y1="98" x2="40" y2="115" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
            <line x1="60" y1="98" x2="65" y2="115" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
          </g>

          <!-- 4. Reach -->
          <g class="k-pose k-pose-reach" opacity="0">
            <ellipse cx="50" cy="80" rx="35" ry="16" transform="rotate(25 50 80)" fill="var(--cat-main, #c8c8c8)" stroke="var(--cat-stroke, #777)" stroke-width="2"/>
            <ellipse cx="50" cy="86" rx="28" ry="9" transform="rotate(25 50 80)" fill="var(--cat-belly, transparent)" stroke="none"/>
            <path d="M 80 90 Q 95 85 85 110" fill="none" stroke="var(--cat-tail, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
            <line x1="30" y1="65" x2="10" y2="60" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
            <line x1="35" y1="75" x2="15" y2="70" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
            <line x1="55" y1="95" x2="50" y2="115" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
            <line x1="65" y1="90" x2="65" y2="115" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
          </g>

          <!-- 5. Climb -->
          <g class="k-pose k-pose-climb" opacity="0">
            <ellipse cx="40" cy="70" rx="30" ry="15" transform="rotate(60 40 70)" fill="var(--cat-main, #c8c8c8)" stroke="var(--cat-stroke, #777)" stroke-width="2"/>
            <ellipse cx="40" cy="75" rx="24" ry="8" transform="rotate(60 40 70)" fill="var(--cat-belly, transparent)" stroke="none"/>
            <path d="M 50 90 Q 65 95 55 115" fill="none" stroke="var(--cat-tail, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
            <line x1="30" y1="50" x2="15" y2="65" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
            <line x1="45" y1="85" x2="35" y2="105" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
            <line x1="55" y1="80" x2="45" y2="110" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
          </g>
        </g>

        <!-- === HEAD GROUP === -->
        <g class="k-head-group">
          <polygon class="k-ear k-ear-l" points="16,54 28,18 42,46" fill="var(--cat-main, #c8c8c8)" stroke="var(--cat-stroke, #777)" stroke-width="2" stroke-linejoin="miter"/>
          <polygon class="k-ear k-ear-r" points="84,54 72,18 58,46" fill="var(--cat-main, #c8c8c8)" stroke="var(--cat-stroke, #777)" stroke-width="2" stroke-linejoin="miter"/>
          
          <polygon class="k-ear k-ear-l" points="23,48 29,28 39,44" fill="var(--cat-inner, #c0a8a8)" stroke="none"/>
          <polygon class="k-ear k-ear-r" points="77,48 71,28 61,44" fill="var(--cat-inner, #c0a8a8)" stroke="none"/>

          <polygon class="k-head" points="50,24 78,36 88,62 80,82 20,82 12,62 22,36" fill="var(--cat-main, #c8c8c8)" stroke="var(--cat-stroke, #777)" stroke-width="2" stroke-linejoin="miter"/>
          
          <path d="M 50 35 L 51.5 42 L 53 38 L 54 46 Q 54 60 68 76 Q 50 82 32 76 Q 46 60 46 46 L 47 38 L 48.5 42 Z" fill="var(--cat-muzzle, transparent)" stroke="none"/>
          <polygon points="50,68 53,71 50,74 47,71" fill="var(--cat-nose, #bbb)"/>

          <!-- Forehead stripes for blending (drawn OVER muzzle) -->
          <line x1="42" y1="30" x2="47" y2="44" stroke="var(--cat-stripes, var(--cat-stroke, #777))" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="50" y1="28" x2="50" y2="44" stroke="var(--cat-stripes, var(--cat-stroke, #777))" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="58" y1="30" x2="53" y2="44" stroke="var(--cat-stripes, var(--cat-stroke, #777))" stroke-width="2.5" stroke-linecap="round"/>

          <path d="M 22 75 Q 50 90 78 75" stroke="var(--cat-collar-color, transparent)" stroke-width="5" fill="none" stroke-linecap="round"/>
          <circle cx="50" cy="83" r="5" fill="var(--cat-bell-color, transparent)"/>

          <rect x="26" y="52" width="18" height="14" fill="var(--cat-eye-bg, #ffffff)" stroke="var(--cat-stroke, #777)" stroke-width="2" shape-rendering="crispEdges"/>
          <rect x="56" y="52" width="18" height="14" fill="var(--cat-eye-bg, #ffffff)" stroke="var(--cat-stroke, #777)" stroke-width="2" shape-rendering="crispEdges"/>

          <g id="${id_prefix}pupils" clip-path="url(#${id_prefix}eyes-clip)">
            <rect class="k-pupil" id="${id_prefix}pupil-l" x="33" y="54" width="4" height="10" fill="var(--cat-pupil, #333)" shape-rendering="crispEdges"/>
            <rect class="k-pupil" id="${id_prefix}pupil-r" x="63" y="54" width="4" height="10" fill="var(--cat-pupil, #333)" shape-rendering="crispEdges"/>
            <rect id="${id_prefix}shine-l" x="34" y="55" width="2" height="2" fill="white" shape-rendering="crispEdges"/>
            <rect id="${id_prefix}shine-r" x="64" y="55" width="2" height="2" fill="white" shape-rendering="crispEdges"/>
          </g>

          <g class="k-scanner-rays">
            <polygon points="33,64 37,64 22,145 42,145" fill="url(#${id_prefix}scan-grad)" />
            <polygon points="63,64 67,64 22,145 42,145" fill="url(#${id_prefix}scan-grad)" />
          </g>

          <path class="k-mouth-smile" d="M 44 74 Q 47 78 50 75 Q 53 78 56 74" stroke="var(--cat-stroke, #777)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          <rect class="k-mouth-scared" x="46" y="74" width="8" height="6" fill="var(--cat-pupil, #333)" shape-rendering="crispEdges" opacity="0"/>
          <ellipse class="k-mouth-surprised" cx="50" cy="76" rx="2" ry="3" fill="var(--cat-pupil, #333)" opacity="0"/>
          <ellipse class="k-mouth-exhausted" cx="50" cy="77" rx="3" ry="5" fill="var(--cat-pupil, #333)" opacity="0"/>
          <path class="k-mouth-exhausted k-exhausted-breath" d="M 52 77 Q 64 70 70 78 Q 65 88 52 81 Z" fill="#b0d4ff" opacity="0"/>
          <path class="k-mouth-smirk" d="M 42 74 Q 46 80 50 76 Q 54 80 58 74" stroke="var(--cat-stroke, #777)" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0"/>

          <line x1="12" y1="66" x2="28" y2="68" stroke="var(--cat-whiskers, #999)" stroke-width="1"/>
          <line x1="10" y1="72" x2="28" y2="72" stroke="var(--cat-whiskers, #999)" stroke-width="1"/>
          <line x1="88" y1="66" x2="72" y2="68" stroke="var(--cat-whiskers, #999)" stroke-width="1"/>
          <line x1="90" y1="72" x2="72" y2="72" stroke="var(--cat-whiskers, #999)" stroke-width="1"/>
        </g>
        
        <!-- Sleep Zs -->
        <g class="k-sleep-zs">
          <text class="k-z1" x="75" y="40" fill="var(--cat-stroke, #777)" font-family="sans-serif" font-weight="bold" font-size="16">Z</text>
          <text class="k-z2" x="90" y="25" fill="var(--cat-stroke, #777)" font-family="sans-serif" font-weight="bold" font-size="12">z</text>
          <text class="k-z3" x="100" y="15" fill="var(--cat-stroke, #777)" font-family="sans-serif" font-weight="bold" font-size="9">z</text>
        </g>
      </g>
      
      <!-- Cardboard Box Front (Rendered over the cat) -->
      <g class="k-box-front" opacity="0" transform="translate(20, 0)">
        <polygon points="5,80 95,80 85,118 15,118" fill="#D2B48C" stroke="var(--cat-stroke, #777)" stroke-width="2" stroke-linejoin="round"/>
      </g>
    </svg>`;
  }

  // ── INJECT CORNER CAT ─────────────────────────
  const cornerCat = document.createElement('div');
  cornerCat.id = 'katban-corner-cat';
  cornerCat.innerHTML = buildCatSVG('kat-');
  document.body.appendChild(cornerCat);

  const pupils  = cornerCat.querySelector('#kat-pupils');
  const pupilL  = cornerCat.querySelector('#kat-pupil-l');
  const pupilR  = cornerCat.querySelector('#kat-pupil-r');
  const shineL  = cornerCat.querySelector('#kat-shine-l');
  const shineR  = cornerCat.querySelector('#kat-shine-r');

  let pageCatOn = true;
  let meaningCatOn = true;
  let sharedCatEnabled = false;
  let catState = null;

  function applySettings(data) {
    pageCatOn = data.pageCatEnabled !== false;
    meaningCatOn = data.meaningCatEnabled !== false;
    sharedCatEnabled = data.sharedCatEnabled === true;
    
    // Toggle page cat visibility
    cornerCat.classList.toggle('katban-hidden', !pageCatOn);
    // Hide meaning cat if disabled
    const sc = document.getElementById('katban-sneak-cat');
    if (sc) sc.style.display = meaningCatOn ? 'block' : 'none';

    // Apply cat style to document element
    const style = data.catStyle || 'primary';
    document.documentElement.className = document.documentElement.className
      .replace(/\bkatban-style-\S+/g, '')
      .trim();
    if (document.documentElement.className !== '') document.documentElement.className += ' ';
    document.documentElement.className += `katban-style-${style}`;
  }

  // Load saved setting
  chrome.storage.local.get(['pageCatEnabled', 'meaningCatEnabled', 'sharedCatEnabled', 'catStyle'], (data) => {
    if (chrome.runtime.lastError) return;
    applySettings(data);
  });

  // ── SAFE MESSAGE WRAPPER & HOT-RELOAD CLEANUP ──
  const unloadListener = () => {
    isInvalidated = true;
    if (cornerCat) cornerCat.remove();
    const defBubble = document.getElementById('katban-def-bubble');
    if (defBubble) defBubble.remove();
    const blocker = document.getElementById('katban-blocker');
    if (blocker) blocker.remove();
    const judgeToast = document.getElementById('katban-judge-toast');
    if (judgeToast) judgeToast.remove();
    
    try {
      chrome.runtime.onMessage.removeListener(messageListener);
    } catch (e) {}
    
    document.removeEventListener('katban-unload-old', unloadListener);
  };
  document.addEventListener('katban-unload-old', unloadListener);

  function safeSend(msg) {
    if (isInvalidated) return;
    try {
      const p = chrome.runtime.sendMessage(msg);
      if (p && p.catch) {
        p.catch((e) => {
          if (e && e.message && e.message.includes('Extension context invalidated')) {
            unloadListener();
          }
        });
      }
    } catch (e) {
      if (e && e.message && e.message.includes('Extension context invalidated')) {
        unloadListener();
      }
    }
  }

  // Request initial sync
  safeSend({ type: 'CAT_EVENT', event: 'REQUEST_SYNC' });

  // ── USER ACTIVITY ─────────────────────────
  let lastActivityTime = 0;
  function reportActivity() {
    if (Date.now() - lastActivityTime > 1000) {
      lastActivityTime = Date.now();
      safeSend({ type: 'CAT_EVENT', event: 'ACTIVITY' });
    }
  }

  ['mousemove', 'keydown', 'scroll', 'click'].forEach(evt => {
    document.addEventListener(evt, () => {
      if (isInvalidated || !pageCatOn) return;
      reportActivity();
    }, { passive: true });
  });

  // ── MOUSE TRACKING (LOCAL ONLY) ─────────────
  const BASE = { lx: 30, ly: 54, rx: 60, ry: 54, slx: 38, sly: 55, srx: 68, sry: 55 };
  const MAX_MOVE = 3;

  document.addEventListener('mousemove', (e) => {
    if (isInvalidated || !pageCatOn || catState === 'sleeping') return;

    const rect = cornerCat.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist  = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const move  = Math.min(dist / 35, MAX_MOVE);
    const ox = +(Math.cos(angle) * move).toFixed(2);
    const oy = +(Math.sin(angle) * move).toFixed(2);

    const catGroup = cornerCat.querySelector('.k-cat-character');
    let isHovered = false;
    
    if (catGroup) {
      const catRect = catGroup.getBoundingClientRect();
      if (e.clientX >= catRect.left && e.clientX <= catRect.right && 
          e.clientY >= catRect.top && e.clientY <= catRect.bottom) {
        isHovered = true;
      }
    } else {
      // Fallback
      if (e.clientX >= rect.left && e.clientX <= rect.right && 
          e.clientY >= rect.top && e.clientY <= rect.bottom) {
        isHovered = true;
      }
    }

    if (isHovered) {
      cornerCat.classList.add('katban-hovered');
    } else {
      cornerCat.classList.remove('katban-hovered');
    }

    // Proximity → scared or look-away
    if (catState === 'peeking') {
      pupils.style.transform = `translate(0px, 0px)`; // reset JS tracking
      if (dist < 40) {
        cornerCat.classList.add('katban-look-away');
      } else {
        cornerCat.classList.remove('katban-look-away');
      }
    } else {
      pupils.style.transform = `translate(${ox}px,${oy}px)`;
      if (dist < 65) {
        cornerCat.classList.add('katban-scared');
      } else {
        cornerCat.classList.remove('katban-scared');
      }
    }
  });

  // ── PASSWORD PEEKING ─────────────────────────
  let activePasswordInput = null;
  let clickX = null;
  let clickY = null;

  document.addEventListener('mousedown', (e) => {
    if (isInvalidated) return;
    if (e.target && e.target.type === 'password' && pageCatOn) {
      clickX = e.clientX;
      clickY = e.clientY;
      if (catState === 'peeking' && activePasswordInput === e.target) {
        setTimeout(updateCatPasswordPosition, 0);
      }
    }
  }, {capture: true});

  function stopPeeking() {
    if (activePasswordInput) {
      activePasswordInput.removeEventListener('input', handlePasswordInput);
      activePasswordInput.removeEventListener('keyup', handlePasswordInput);
      activePasswordInput.removeEventListener('mouseup', handlePasswordInput);
    }
    activePasswordInput = null;
    cornerCat.classList.remove('katban-look-away');
    
    // Reset position to corner
    cornerCat.style.removeProperty('left');
    cornerCat.style.removeProperty('top');
    cornerCat.style.removeProperty('right');
    cornerCat.style.removeProperty('bottom');

    safeSend({ type: 'CAT_EVENT', event: 'SET_STATE', state: null });
  }

  function updateCatPasswordPosition() {
    if (!activePasswordInput || catState !== 'peeking') return;
    
    if (activePasswordInput.type !== 'password') {
      stopPeeking();
      return;
    }
    
    const rect = activePasswordInput.getBoundingClientRect();
    const style = window.getComputedStyle(activePasswordInput);
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const fontSize = parseFloat(style.fontSize) || 16;
    
    // Accurately measure password dot width using a hidden span
    let measureSpan = document.getElementById('katban-measure-span');
    if (!measureSpan) {
      measureSpan = document.createElement('span');
      measureSpan.id = 'katban-measure-span';
      measureSpan.style.position = 'absolute';
      measureSpan.style.visibility = 'hidden';
      measureSpan.style.whiteSpace = 'pre';
      measureSpan.style.top = '-9999px';
      measureSpan.style.left = '-9999px';
      document.body.appendChild(measureSpan);
    }
    
    measureSpan.style.fontFamily = style.fontFamily;
    measureSpan.style.fontSize = style.fontSize;
    measureSpan.style.fontWeight = style.fontWeight;
    measureSpan.style.letterSpacing = style.letterSpacing;
    measureSpan.style.wordSpacing = style.wordSpacing;

    const textLen = activePasswordInput.selectionStart ?? activePasswordInput.value.length;
    measureSpan.textContent = '•'.repeat(textLen);
    
    const textWidth = measureSpan.getBoundingClientRect().width;
    let offsetX = paddingLeft + textWidth;
    offsetX = Math.min(offsetX, rect.width - 30); // keep inside box
    
    // Position cat centered over the computed text offset
    let catX = rect.left + offsetX - 80; // 80 positions the face perfectly above the caret
    let catY = rect.top - 62;

    cornerCat.style.setProperty('right', 'auto', 'important');
    cornerCat.style.setProperty('bottom', 'auto', 'important');
    cornerCat.style.setProperty('left', `${catX}px`, 'important');
    cornerCat.style.setProperty('top', `${catY}px`, 'important');
  }

  function handlePasswordInput() {
    updateCatPasswordPosition();
  }

  document.addEventListener('focusin', (e) => {
    if (isInvalidated || !pageCatOn) return;
    const t = (e.composedPath && e.composedPath()[0]) || e.target;
    if (!t || !t.tagName) return;
    
    if (t.type === 'password') {
      activePasswordInput = t;
      updateCatPasswordPosition();
      activePasswordInput.addEventListener('input', handlePasswordInput);
      activePasswordInput.addEventListener('keyup', handlePasswordInput);
      activePasswordInput.addEventListener('mouseup', handlePasswordInput);
      safeSend({ type: 'CAT_EVENT', event: 'SET_STATE', state: 'peeking' });
    } else {
      const isInput = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA';
      const isEditable = t.isContentEditable || t.getAttribute('contenteditable') === 'true';
      const isSearchBox = t.getAttribute('role') === 'textbox' || t.getAttribute('role') === 'searchbox';
      const isShreddit = t.tagName.toLowerCase().includes('search');

      if (isInput || isEditable || isSearchBox || isShreddit) {
        if (isInput) {
          const excludedTypes = ['submit', 'button', 'checkbox', 'radio', 'hidden', 'color', 'file', 'image', 'range', 'reset'];
          if (excludedTypes.includes(t.type) || t.readOnly || t.disabled) return;
        }
        safeSend({ type: 'CAT_EVENT', event: 'SET_STATE', state: 'surprised' });
        if (catState === 'on-prop' || catState === 'leaving-prop') {
          cornerCat.classList.add('katban-surprised');
        }
      }
    }
  }, true);

  function hasLocalActiveInput() {
    const active = document.activeElement;
    const activeShadow = active && active.shadowRoot ? active.shadowRoot.activeElement : null;
    const currentFocus = activeShadow || active;
    
    if (!currentFocus || currentFocus === document.body) return false;
    
    const isInput = currentFocus.tagName === 'INPUT' || currentFocus.tagName === 'TEXTAREA';
    const isEditable = currentFocus.isContentEditable || currentFocus.getAttribute('contenteditable') === 'true';
    const isSearchBox = currentFocus.getAttribute('role') === 'textbox' || currentFocus.getAttribute('role') === 'searchbox';
    const isShreddit = currentFocus.tagName.toLowerCase().includes('search');
    
    if (!isInput && !isEditable && !isSearchBox && !isShreddit) return false;
    
    if (isInput) {
      const excludedTypes = ['submit', 'button', 'checkbox', 'radio', 'hidden', 'color', 'file', 'image', 'range', 'reset'];
      if (excludedTypes.includes(currentFocus.type) || currentFocus.readOnly || currentFocus.disabled) return false;
    }
    
    return true;
  }

  document.addEventListener('focusout', (e) => {
    if (isInvalidated) return;
    const t = (e.composedPath && e.composedPath()[0]) || e.target;
    if (t && t === activePasswordInput && pageCatOn && catState === 'peeking') {
      stopPeeking();
    } else {
      // Small delay so if focus immediately jumps to an inner/wrapper element, we don't blink the state.
      setTimeout(() => {
        if (!hasLocalActiveInput()) {
          if (catState === 'surprised') {
            safeSend({ type: 'CAT_EVENT', event: 'SET_STATE', state: null });
          }
          cornerCat.classList.remove('katban-surprised');
        }
      }, 50);
    }
  }, true);

  // ── SCROLL BOBBING ───────────────────────────
  let scrollTimer = null;
  window.addEventListener('scroll', () => {
    if (isInvalidated || !pageCatOn) return;
    cornerCat.classList.add('katban-scrolling');
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      cornerCat.classList.remove('katban-scrolling');
    }, 650);
  }, { passive: true });

  // ── WORD DEFINITION BUBBLE ───────────────────
  const defBubble = document.createElement('div');
  defBubble.id = 'katban-def-bubble';

  function buildSneakCatSVG() {
    return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="katban-sneak-brindle" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
          <rect width="40" height="40" fill="#685f54"/>
          <path d="M -40 8 Q -30 20 -20 8 T 0 8 Q 10 20 20 8 T 40 8 Q 50 20 60 8 T 80 8" stroke="#2b2725" stroke-width="5" fill="none"/>
          <path d="M -40 22 Q -32 32 -20 22 T 0 22 Q 8 32 20 22 T 40 22 Q 48 32 60 22 T 80 22" stroke="#2b2725" stroke-width="4" fill="none"/>
          <path d="M -40 34 Q -25 42 -20 34 T 0 34 Q 15 42 20 34 T 40 34 Q 55 42 60 34 T 80 34" stroke="#2b2725" stroke-width="6" fill="none"/>
        </pattern>
      </defs>
      <path class="k-sneak-tail" d="M 80 70 Q 110 30 80 10" fill="none" stroke="var(--cat-tail, var(--cat-main, #c8c8c8))" stroke-width="12" stroke-linecap="round"/>
      <g transform="translate(0, 15)">
        <polygon class="k-ear k-ear-l" points="16,54 28,18 42,46" fill="var(--cat-main, #c8c8c8)" stroke="var(--cat-stroke, #777)" stroke-width="2" stroke-linejoin="miter"/>
        <polygon class="k-ear k-ear-r" points="84,54 72,18 58,46" fill="var(--cat-main, #c8c8c8)" stroke="var(--cat-stroke, #777)" stroke-width="2" stroke-linejoin="miter"/>
        <polygon class="k-ear k-ear-l" points="23,48 29,28 39,44" fill="var(--cat-inner, #c0a8a8)" stroke="none"/>
        <polygon class="k-ear k-ear-r" points="77,48 71,28 61,44" fill="var(--cat-inner, #c0a8a8)" stroke="none"/>
        <polygon points="50,24 78,36 88,62 80,82 20,82 12,62 22,36" fill="var(--cat-main, #c8c8c8)" stroke="var(--cat-stroke, #777)" stroke-width="2" stroke-linejoin="miter"/>
        
        <path d="M 50 35 L 51.5 42 L 53 38 L 54 46 Q 54 60 68 76 Q 50 82 32 76 Q 46 60 46 46 L 47 38 L 48.5 42 Z" fill="var(--cat-muzzle, transparent)" stroke="none"/>
        <polygon points="50,68 53,71 50,74 47,71" fill="var(--cat-nose, #bbb)"/>

        <!-- Forehead stripes for blending (drawn OVER muzzle) -->
        <line x1="42" y1="30" x2="47" y2="44" stroke="var(--cat-stripes, var(--cat-stroke, #777))" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="50" y1="28" x2="50" y2="44" stroke="var(--cat-stripes, var(--cat-stroke, #777))" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="58" y1="30" x2="53" y2="44" stroke="var(--cat-stripes, var(--cat-stroke, #777))" stroke-width="2.5" stroke-linecap="round"/>
        
        <path d="M 22 75 Q 50 90 78 75" stroke="var(--cat-collar-color, transparent)" stroke-width="5" fill="none" stroke-linecap="round"/>
        <circle cx="50" cy="83" r="5" fill="var(--cat-bell-color, transparent)"/>
        <rect x="26" y="52" width="18" height="14" fill="var(--cat-eye-bg, #ffffff)" stroke="var(--cat-stroke, #777)" stroke-width="2" shape-rendering="crispEdges"/>
        <rect x="56" y="52" width="18" height="14" fill="var(--cat-eye-bg, #ffffff)" stroke="var(--cat-stroke, #777)" stroke-width="2" shape-rendering="crispEdges"/>
        <rect x="33" y="54" width="4" height="10" fill="var(--cat-pupil, #333)" shape-rendering="crispEdges"/>
        <rect x="63" y="54" width="4" height="10" fill="var(--cat-pupil, #333)" shape-rendering="crispEdges"/>
        <rect x="34" y="55" width="2" height="2" fill="white" shape-rendering="crispEdges"/>
        <rect x="64" y="55" width="2" height="2" fill="white" shape-rendering="crispEdges"/>
        <path d="M 44 74 Q 47 78 50 75 Q 53 78 56 74" stroke="var(--cat-stroke, #777)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      </g>
      <rect x="20" y="85" width="16" height="15" fill="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke="var(--cat-stroke, #777)" stroke-width="2" shape-rendering="crispEdges"/>
      <rect x="64" y="85" width="16" height="15" fill="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke="var(--cat-stroke, #777)" stroke-width="2" shape-rendering="crispEdges"/>
    </svg>`;
  }

  const sneakCat = document.createElement('div');
  sneakCat.id = 'katban-sneak-cat';
  sneakCat.innerHTML = buildSneakCatSVG();
  defBubble.appendChild(sneakCat);

  const defContent = document.createElement('div');
  defContent.id = 'katban-def-content';
  defBubble.appendChild(defContent);

  document.body.appendChild(defBubble);

  let defTimeout = null;

  document.addEventListener('dblclick', async (e) => {
    if (isInvalidated) return;
    const word = window.getSelection()?.toString().trim();
    if (!word || /\s/.test(word)) return;

    try {
      const res  = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const def  = data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition;
      const pos  = data?.[0]?.meanings?.[0]?.partOfSpeech;
      if (!def) throw new Error();

      defContent.innerHTML =
        `<strong>${word}${pos ? ` <span style="color:#888;font-weight:normal;text-transform:none">(${pos})</span>` : ''}</strong>${def}`;

      let x = e.clientX + 14;
      let y = e.clientY + 14;
      if (x + 235 > window.innerWidth)  x = e.clientX - 235;
      if (y + 90  > window.innerHeight) y = e.clientY - 90;
      defBubble.style.left = x + 'px';
      defBubble.style.top  = y + 'px';
      defBubble.classList.add('katban-visible');

      clearTimeout(defTimeout);
      defTimeout = setTimeout(() => defBubble.classList.remove('katban-visible'), 4500);
    } catch {
      defBubble.classList.remove('katban-visible');
    }
  });

  document.addEventListener('click', () => defBubble.classList.remove('katban-visible'));

  // ── COPY TRACKER ─────────────────────────────
  const judgeToast = document.createElement('div');
  judgeToast.id = 'katban-judge-toast';
  document.body.appendChild(judgeToast);

  let judgeTimer = null;
  const judgeLines = [
    'Really? That entire block?',
    'Copy-paste engineer spotted.',
    'StackOverflow moment.',
    'Did you even read that?',
    'Bold move. Very bold.'
  ];

  document.addEventListener('copy', () => {
    if (isInvalidated) return;
    const copied = window.getSelection()?.toString() || '';
    if (!copied) return;
    safeSend({ type: 'COPY_EVENT', text: copied });

    if (copied.length > 500) {
      judgeToast.textContent = judgeLines[Math.floor(Math.random() * judgeLines.length)];
      judgeToast.classList.add('katban-visible');
      clearTimeout(judgeTimer);
      judgeTimer = setTimeout(() => {
        judgeToast.classList.remove('katban-visible');
      }, 3200);
    }
  });

  // ── CAT STATE ────────────────────────────────
  const ALL_STATES = ['judging', 'sleeping', 'moving', 'peeking', 'on-prop', 'leaving-prop', 'surprised', 'dancing', 'exhausted'];
  
  function applyCatState(state) {
    if (catState === state) return;
    catState = state;
    cornerCat.classList.remove(...ALL_STATES.map(s => `katban-${s}`));
    if (state) cornerCat.classList.add(`katban-${state}`);

    if ((state === 'on-prop' || state === 'leaving-prop') && hasLocalActiveInput()) {
      cornerCat.classList.add('katban-surprised');
    }
  }

  // ── BLOCKER OVERLAY ──────────────────────────
  const blocker = document.createElement('div');
  blocker.id = 'katban-blocker';
  blocker.innerHTML = buildCatSVG('blk-') +
    '<h1>Get Back to Work.</h1><p>Blocked during focus session.</p>';
  document.body.appendChild(blocker);

  // ── MESSAGE LISTENER ─────────────────────────
  const messageListener = (msg) => {
    try {
      if (isInvalidated) return;

      if (msg.type === 'BLOCK_PAGE') {
        blocker.classList.add('katban-active');
        cornerCat.classList.add('katban-hidden');
      }

      if (msg.type === 'TIMER_STATE') {
        if (msg.state !== 'focus') {
          blocker.classList.remove('katban-active');
          cornerCat.classList.toggle('katban-hidden', !pageCatOn);
        }
      }

      if (msg.type === 'SETTINGS_UPDATE') {
        applySettings({
          pageCatEnabled: msg.pageCatEnabled,
          meaningCatEnabled: msg.meaningCatEnabled,
          sharedCatEnabled: msg.sharedCatEnabled,
          catStyle: msg.catStyle
        });
      }

      if (msg.type === 'SYNC_CAT_STATE') {
        // Filter out context-specific states if this tab doesn't have the context
        if (msg.state === 'peeking' && !activePasswordInput) {
          applyCatState(null);
          safeSend({ type: 'CAT_EVENT', event: 'SET_STATE', state: null });
          return;
        }
        if (msg.state === 'surprised' && !hasLocalActiveInput()) {
          applyCatState(null);
          safeSend({ type: 'CAT_EVENT', event: 'SET_STATE', state: null });
          return;
        }

        applyCatState(msg.state);
        
        // Keep position synced with peeking locally
        if (msg.state === 'peeking' && activePasswordInput) {
          updateCatPasswordPosition();
        }
      }
      
      if (msg.type === 'REQUEST_FOCUS_STATE') {
        // Re-evaluate if an input is focused to re-send 'surprised'
        if (hasLocalActiveInput()) {
           safeSend({ type: 'CAT_EVENT', event: 'SET_STATE', state: 'surprised' });
        }
      }
    } catch (err) {
      if (err.message && err.message.includes('Extension context invalidated')) {
        try { chrome.runtime.onMessage.removeListener(messageListener); } catch (e) {}
      }
    }
  };

  try {
    chrome.runtime.onMessage.addListener(messageListener);
  } catch (e) {}

  // ── TYPING ───────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (isInvalidated || !pageCatOn || catState === 'peeking' || catState === 'judging') return;
    if (e.key.length !== 1) return; // Only printable chars
    
    safeSend({ type: 'CAT_EVENT', event: 'TYPING' });

    // Spawn floating letter locally for immediate visual feedback
    if (catState === 'surprised' || catState === 'dancing' || catState === 'exhausted' || ((catState === 'on-prop' || catState === 'leaving-prop') && hasLocalActiveInput())) {
      const letter = document.createElement('div');
      letter.className = 'katban-floating-letter';
      letter.textContent = e.key;
      letter.style.setProperty('--rot', Math.floor(Math.random() * 40 - 20));
      
      const rect = cornerCat.getBoundingClientRect();
      letter.style.left = `${rect.left + 50 + (Math.random() * 30 - 15)}px`;
      letter.style.top = `${rect.top + 10}px`;
      document.body.appendChild(letter);
      
      setTimeout(() => letter.remove(), 1000);
    }
  });
})();
