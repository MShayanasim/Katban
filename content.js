// ──────────────────────────────────────────────
// KATBAN CONTENT SCRIPT v2
// Sharp minimalist cat | Prefixed class names to
// avoid collision with host page styles.
// ──────────────────────────────────────────────

(function () {
  'use strict';

  // ── HOT-RELOAD CLEANUP ──
  // Dispatch event to kill any existing old script's DOM elements and listeners.
  // This is the single source of truth for deduplication — we do NOT use
  // window.__katbanInjected because that blocks re-injection after service worker restarts.
  document.dispatchEvent(new CustomEvent('katban-unload-old'));


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
            <g class="k-nightcap" opacity="0">
              <ellipse cx="50" cy="95" rx="39" ry="19" fill="#1e3a8a"/>
              <path d="M 25 90 L 27 94 L 31 95 L 27 96 L 25 100 L 23 96 L 19 95 L 23 94 Z" fill="#fbbf24"/>
              <path d="M 50 95 L 51 98 L 54 99 L 51 100 L 50 103 L 49 100 L 46 99 L 49 98 Z" fill="#fbbf24"/>
              <path d="M 75 88 L 76 91 L 79 92 L 76 93 L 75 96 L 74 93 L 71 92 L 74 91 Z" fill="#fbbf24"/>
            </g>
            <g class="k-paws" opacity="0">
              <ellipse cx="35" cy="85" rx="6" ry="10" fill="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke="var(--cat-stroke, #777)" stroke-width="2"/>
              <ellipse cx="65" cy="85" rx="6" ry="10" fill="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke="var(--cat-stroke, #777)" stroke-width="2"/>
            </g>
          </g>

          <!-- 2. Run Frame 1 (Gallop Stretch) -->
          <g class="k-pose k-pose-run1" opacity="0">
            <!-- Tail pointing straight back -->
            <path d="M 115 80 Q 130 80 140 70" fill="none" stroke="var(--cat-tail, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
            <!-- Body -->
            <ellipse cx="80" cy="85" rx="40" ry="16" fill="var(--cat-main, #c8c8c8)" stroke="var(--cat-stroke, #777)" stroke-width="2"/>
            <!-- Belly -->
            <ellipse cx="80" cy="90" rx="35" ry="11" fill="var(--cat-belly, transparent)" stroke="none"/>
            
            <!-- Back Legs (Thicker, pushing backward) -->
            <!-- Background back leg (staggered right and up) -->
            <line x1="108" y1="92" x2="128" y2="112" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="8" stroke-linecap="round"/>
            <!-- Foreground back leg -->
            <line x1="100" y1="95" x2="118" y2="115" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="8" stroke-linecap="round"/>
            
            <!-- Front Legs (Thinner, reaching forward) -->
            <!-- Background front leg (staggered right and up) -->
            <line x1="58" y1="92" x2="38" y2="112" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="5" stroke-linecap="round"/>
            <!-- Foreground front leg -->
            <line x1="50" y1="95" x2="28" y2="115" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="5" stroke-linecap="round"/>
            
            <g class="k-nightcap" opacity="0">
              <ellipse cx="80" cy="85" rx="41" ry="17" fill="#1e3a8a"/>
              <path d="M 60 80 L 62 84 L 66 85 L 62 86 L 60 90 L 58 86 L 54 85 L 58 84 Z" fill="#fbbf24"/>
              <path d="M 90 85 L 91 88 L 94 89 L 91 90 L 90 93 L 89 90 L 86 89 L 89 88 Z" fill="#fbbf24"/>
              <path d="M 110 80 L 111 82 L 113 83 L 111 84 L 110 86 L 109 84 L 107 83 L 109 82 Z" fill="#fbbf24"/>
            </g>
          </g>

          <!-- 3. Run Frame 2 (Gallop Gather) -->
          <g class="k-pose k-pose-run2" opacity="0">
            <!-- Tail curling up -->
            <path d="M 115 82 Q 130 50 110 40" fill="none" stroke="var(--cat-tail, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
            <!-- Body squished slightly -->
            <ellipse cx="80" cy="83" rx="38" ry="18" fill="var(--cat-main, #c8c8c8)" stroke="var(--cat-stroke, #777)" stroke-width="2"/>
            <!-- Belly -->
            <ellipse cx="80" cy="88" rx="33" ry="12" fill="var(--cat-belly, transparent)" stroke="none"/>
            
            <!-- Back Legs (Thicker, tucked forward under belly) -->
            <!-- Background back leg -->
            <line x1="110" y1="92" x2="90" y2="112" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="8" stroke-linecap="round"/>
            <!-- Foreground back leg -->
            <line x1="100" y1="95" x2="78" y2="115" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="8" stroke-linecap="round"/>
            
            <!-- Front Legs (Thinner, swept backward) -->
            <!-- Background front leg -->
            <line x1="62" y1="92" x2="72" y2="112" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="5" stroke-linecap="round"/>
            <!-- Foreground front leg -->
            <line x1="50" y1="95" x2="58" y2="115" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="5" stroke-linecap="round"/>

            <g class="k-nightcap" opacity="0">
              <ellipse cx="80" cy="83" rx="39" ry="19" fill="#1e3a8a"/>
              <path d="M 60 80 L 62 84 L 66 85 L 62 86 L 60 90 L 58 86 L 54 85 L 58 84 Z" fill="#fbbf24"/>
              <path d="M 90 83 L 91 86 L 94 87 L 91 88 L 90 91 L 89 88 L 86 87 L 89 86 Z" fill="#fbbf24"/>
              <path d="M 110 78 L 111 80 L 113 81 L 111 82 L 110 84 L 109 82 L 107 81 L 109 80 Z" fill="#fbbf24"/>
            </g>
          </g>

          <!-- 4. Reach -->
          <g class="k-pose k-pose-reach" opacity="0">
            <ellipse cx="50" cy="80" rx="35" ry="16" transform="rotate(25 50 80)" fill="var(--cat-main, #c8c8c8)" stroke="var(--cat-stroke, #777)" stroke-width="2"/>
            <ellipse cx="50" cy="86" rx="28" ry="9" transform="rotate(25 50 80)" fill="var(--cat-belly, transparent)" stroke="none"/>
            <path d="M 80 90 Q 95 85 85 110" fill="none" stroke="var(--cat-tail, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
            <line x1="45" y1="85" x2="25" y2="105" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="5" stroke-linecap="round"/>
            <line x1="38" y1="85" x2="15" y2="100" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="5" stroke-linecap="round"/>
            <line x1="55" y1="95" x2="50" y2="115" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
            <line x1="65" y1="90" x2="65" y2="115" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
            
            <g class="k-nightcap" opacity="0">
              <g transform="rotate(25 50 80)">
                <ellipse cx="50" cy="80" rx="36" ry="17" fill="#1e3a8a"/>
                <path d="M 25 78 L 27 80 L 29 81 L 27 82 L 25 84 L 23 82 L 21 81 L 23 80 Z" fill="#fbbf24"/>
                <path d="M 50 82 L 51 84 L 53 85 L 51 86 L 50 88 L 49 86 L 47 85 L 49 84 Z" fill="#fbbf24"/>
                <path d="M 72 78 L 73 80 L 75 81 L 73 82 L 72 84 L 71 82 L 69 81 L 71 80 Z" fill="#fbbf24"/>
              </g>
            </g>
          </g>

          <!-- 5. Climb -->
          <g class="k-pose k-pose-climb" opacity="0">
            <ellipse cx="40" cy="70" rx="30" ry="15" transform="rotate(60 40 70)" fill="var(--cat-main, #c8c8c8)" stroke="var(--cat-stroke, #777)" stroke-width="2"/>
            <ellipse cx="40" cy="75" rx="24" ry="8" transform="rotate(60 40 70)" fill="var(--cat-belly, transparent)" stroke="none"/>
            <path d="M 50 90 Q 65 95 55 115" fill="none" stroke="var(--cat-tail, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
            <line x1="30" y1="50" x2="15" y2="65" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
            <line x1="45" y1="85" x2="35" y2="105" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
            <line x1="55" y1="80" x2="45" y2="110" stroke="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke-width="6" stroke-linecap="round"/>
            
            <g class="k-nightcap" opacity="0">
              <g transform="rotate(60 40 70)">
                <ellipse cx="40" cy="70" rx="31" ry="16" fill="#1e3a8a"/>
                <path d="M 20 68 L 22 70 L 24 71 L 22 72 L 20 74 L 18 72 L 16 71 L 18 70 Z" fill="#fbbf24"/>
                <path d="M 40 72 L 41 74 L 43 75 L 41 76 L 40 78 L 39 76 L 37 75 L 39 74 Z" fill="#fbbf24"/>
                <path d="M 58 68 L 59 70 L 61 71 L 59 72 L 58 74 L 57 72 L 55 71 L 57 70 Z" fill="#fbbf24"/>
              </g>
            </g>
          </g>

          <!-- 6. Knife Pose -->
          <g class="k-pose k-pose-knife" opacity="0">
            <!-- Puffed up angry bottlebrush tail -->
            <path class="k-tail" d="M 85 95 C 100 90, 110 70, 110 40 L 115 30 L 100 35 L 105 20 L 90 30 L 90 15 L 80 30 L 70 20 L 75 40 C 75 60, 75 85, 85 95 Z" fill="var(--cat-main, #c8c8c8)" stroke="var(--cat-stroke, #777)" stroke-width="2" stroke-linejoin="round"/>
            <ellipse class="k-body" cx="50" cy="95" rx="38" ry="18" fill="var(--cat-main, #c8c8c8)" stroke="var(--cat-stroke, #777)" stroke-width="2"/>
            <ellipse class="k-belly" cx="50" cy="96" rx="34" ry="14" fill="var(--cat-belly, transparent)" stroke="none"/>
            <g class="k-tucked-paws">
              <ellipse cx="38" cy="108" rx="8" ry="5" fill="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke="var(--cat-stroke, #777)" stroke-width="1.5"/>
            </g>
            <g class="k-nightcap" opacity="0">
              <ellipse cx="50" cy="95" rx="39" ry="19" fill="#1e3a8a"/>
              <path d="M 25 90 L 27 94 L 31 95 L 27 96 L 25 100 L 23 96 L 19 95 L 23 94 Z" fill="#fbbf24"/>
              <path d="M 50 95 L 51 98 L 54 99 L 51 100 L 50 103 L 49 100 L 46 99 L 49 98 Z" fill="#fbbf24"/>
              <path d="M 75 88 L 76 91 L 79 92 L 76 93 L 75 96 L 74 93 L 71 92 L 74 91 Z" fill="#fbbf24"/>
            </g>
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

          <rect class="k-eye-bg" x="26" y="52" width="18" height="14" fill="var(--cat-eye-bg, #ffffff)" stroke="var(--cat-stroke, #777)" stroke-width="2" shape-rendering="crispEdges"/>
          <rect class="k-eye-bg" x="56" y="52" width="18" height="14" fill="var(--cat-eye-bg, #ffffff)" stroke="var(--cat-stroke, #777)" stroke-width="2" shape-rendering="crispEdges"/>
          <path class="k-eye-closed" d="M 28 60 Q 35 52 42 60 M 58 60 Q 65 52 72 60" stroke="var(--cat-stroke, #777)" stroke-width="2" fill="none" stroke-linecap="round" style="display: none;"/>

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
          <path class="k-mouth-happy-real" d="M 43 73 Q 47 80 50 76 Q 53 80 57 73" stroke="var(--cat-stroke, #777)" stroke-width="2" fill="none" stroke-linecap="round" style="display: none;"/>
          <rect class="k-mouth-scared" x="46" y="74" width="8" height="6" fill="var(--cat-pupil, #333)" shape-rendering="crispEdges" opacity="0"/>
          <ellipse class="k-mouth-surprised" cx="50" cy="76" rx="2" ry="3" fill="var(--cat-pupil, #333)" opacity="0"/>
          <ellipse class="k-mouth-exhausted" cx="50" cy="77" rx="3" ry="5" fill="var(--cat-pupil, #333)" opacity="0"/>
          <path class="k-mouth-exhausted k-exhausted-breath" d="M 52 77 Q 64 70 70 78 Q 65 88 52 81 Z" fill="#b0d4ff" opacity="0"/>
          <path class="k-mouth-smirk" d="M 42 74 Q 46 80 50 76 Q 54 80 58 74" stroke="var(--cat-stroke, #777)" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0"/>
          <path class="k-mouth-angry" d="M 45 77 Q 50 73 55 77 L 53 82 Q 50 84 47 82 Z" fill="#aa0000" stroke="#330000" stroke-width="1" opacity="0"/>

          <line x1="12" y1="66" x2="28" y2="68" stroke="var(--cat-whiskers, #999)" stroke-width="1"/>
          <line x1="10" y1="72" x2="28" y2="72" stroke="var(--cat-whiskers, #999)" stroke-width="1"/>
          <line x1="88" y1="66" x2="72" y2="68" stroke="var(--cat-whiskers, #999)" stroke-width="1"/>
          <line x1="90" y1="72" x2="72" y2="72" stroke="var(--cat-whiskers, #999)" stroke-width="1"/>
          
          <g class="k-hearts" style="display: none;">
            <text x="80" y="40" fill="#ff6b81" font-size="16" font-family="Arial" class="k-anim-heart-1">❤</text>
            <text x="70" y="20" fill="#ff6b81" font-size="20" font-family="Arial" class="k-anim-heart-2">❤</text>
            <text x="10" y="30" fill="#ff6b81" font-size="18" font-family="Arial" class="k-anim-heart-3">❤</text>
            <text x="20" y="10" fill="#ff6b81" font-size="14" font-family="Arial" class="k-anim-heart-4">❤</text>
          </g>
          
          <!-- Nightcap -->
          <g class="k-nightcap" opacity="0">
            <path d="M 20 81 Q 50 92 80 81 L 82 86 Q 50 98 18 86 Z" fill="#f8fafc"/>
            <path d="M 60 30 Q 30 -30 -10 15 Q -20 30 0 40 Q 15 35 35 25 Q 50 15 60 30" fill="#1e40af"/>
            <path d="M 15 38 Q 45 5 78 38 Z" fill="#2563eb"/>
            <circle cx="-5" cy="35" r="14" fill="#f8fafc"/>
            <path d="M 15 36 Q 46 20 80 36 L 78 44 Q 46 28 17 44 Z" fill="#f8fafc"/>
          </g>
        </g>
        
        <!-- Sleep Zs -->
        <g class="k-sleep-zs">
          <text class="k-z1" x="75" y="40" fill="var(--cat-stroke, #777)" font-family="sans-serif" font-weight="bold" font-size="16">Z</text>
          <text class="k-z2" x="90" y="25" fill="var(--cat-stroke, #777)" font-family="sans-serif" font-weight="bold" font-size="12">z</text>
          <text class="k-z3" x="100" y="15" fill="var(--cat-stroke, #777)" font-family="sans-serif" font-weight="bold" font-size="9">z</text>
        </g>

        <!-- Knife overlay (renders on top of head) -->
        <g class="k-pose-knife" opacity="0">
          <g class="k-knife-paw" transform="translate(68, 98) rotate(10)">
            <!-- Knife Handle -->
            <rect x="-4" y="-20" width="8" height="22" rx="2" fill="#5c3a21" stroke="#222" stroke-width="1.5"/>
            <!-- Knife Blade -->
            <path d="M -5 -20 L -8 -65 L 0 -75 L 5 -20 Z" fill="#e2e8f0" stroke="#334155" stroke-width="1.5" stroke-linejoin="round"/>
            <path d="M -8 -65 L 0 -75 L -1 -20 L -5 -20 Z" fill="#cbd5e1" stroke="none"/>
            <!-- Paw overlapping handle -->
            <ellipse cx="0" cy="0" rx="9" ry="7" fill="var(--cat-paws, var(--cat-main, #c8c8c8))" stroke="var(--cat-stroke, #777)" stroke-width="2"/>
          </g>
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
  cornerCat.innerHTML = buildCatSVG('kat-') + '<div class="k-task-sign" id="k-task-sign"></div>';
  document.body.appendChild(cornerCat);

  const pupils  = cornerCat.querySelector('#kat-pupils');
  const pupilL  = cornerCat.querySelector('#kat-pupil-l');
  const pupilR  = cornerCat.querySelector('#kat-pupil-r');
  const shineL  = cornerCat.querySelector('#kat-shine-l');
  const shineR  = cornerCat.querySelector('#kat-shine-r');
  const taskSign = cornerCat.querySelector('#k-task-sign');
  function updateBlockerText(task) {
    const title = document.getElementById('katban-block-title');
    const subtitle = document.getElementById('katban-block-subtitle');
    if (!title || !subtitle) return;
    
    if (task) {
      title.textContent = `Get back to: ${task}`;
    } else {
      title.textContent = 'Get Back to Work.';
    }
  }

  chrome.storage.local.get(['katbanActiveTask'], (data) => {
    if (data.katbanActiveTask) {
      if (taskSign) taskSign.textContent = data.katbanActiveTask;
      updateBlockerText(data.katbanActiveTask);
    } else {
      updateBlockerText(null);
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.katbanActiveTask !== undefined) {
      const newTask = changes.katbanActiveTask.newValue || '';
      if (taskSign) taskSign.textContent = newTask;
      updateBlockerText(newTask);
    }
  });

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
    const oldStyles = [...document.documentElement.classList].filter(c => c.startsWith('katban-style-'));
    oldStyles.forEach(c => document.documentElement.classList.remove(c));
    document.documentElement.classList.add(`katban-style-${style}`);
    
    checkMidnightMode();
  }

  function checkMidnightMode() {
    const hour = new Date().getHours();
    // Midnight to 5:59 AM
    if (hour >= 0 && hour < 6) {
      cornerCat.classList.add('katban-midnight');
    } else {
      cornerCat.classList.remove('katban-midnight');
    }
  }
  const midnightInterval = setInterval(checkMidnightMode, 60000);

  // Load saved setting
  chrome.storage.local.get(['pageCatEnabled', 'meaningCatEnabled', 'sharedCatEnabled', 'catStyle'], (data) => {
    if (chrome.runtime.lastError) return;
    applySettings(data);
  });

  // ── SAFE MESSAGE WRAPPER & HOT-RELOAD CLEANUP ──
  // Create one AbortController to govern all document/window event listeners.
  // Calling listenerAbort.abort() in unloadListener removes them all at once,
  // preventing dead listener accumulation across extension hot-reloads.
  const listenerAbort = new AbortController();
  const listenerSignal = listenerAbort.signal;

  const unloadListener = () => {
    isInvalidated = true;
    // Abort all document/window event listeners registered with listenerSignal
    listenerAbort.abort();
    if (typeof stopCatSpawner === 'function') stopCatSpawner();
    if (cornerCat) cornerCat.remove();
    const defBubble = document.getElementById('katban-def-bubble');
    if (defBubble) defBubble.remove();
    const blocker = document.getElementById('katban-blocker');
    if (blocker) blocker.remove();
    const judgeToast = document.getElementById('katban-judge-toast');
    if (judgeToast) judgeToast.remove();
    const measureSpan = document.getElementById('katban-measure-span');
    if (measureSpan) measureSpan.remove();
    
    // Cleanup onboarding and interactive elements
    const oOverlay = document.getElementById('katban-onboarding-overlay');
    if (oOverlay) oOverlay.remove();
    const oIframe = document.getElementById('katban-onboarding-iframe');
    if (oIframe) oIframe.remove();
    const oBubble = document.getElementById('katban-onboarding-bubble');
    if (oBubble) oBubble.remove();
    const tToast = document.getElementById('katban-treat-toast');
    if (tToast) tToast.remove();
    
    // Remove dynamically created objects that might not have IDs
    document.querySelectorAll('.katban-dvd-clone, .katban-treat-overlay, .katban-treat, .katban-laser-dot, .katban-onboarding-heart').forEach(el => el.remove());
    
    try {
      chrome.runtime.onMessage.removeListener(messageListener);
    } catch (e) {}
    
    // Clear all timers and intervals to prevent stale callbacks
    clearInterval(midnightInterval);
    if (typeof heartbeatInterval !== 'undefined') clearInterval(heartbeatInterval);
    if (typeof scrollTimer !== 'undefined') clearTimeout(scrollTimer);
    if (typeof defTimeout !== 'undefined') clearTimeout(defTimeout);
    if (typeof focusoutTimer !== 'undefined') clearTimeout(focusoutTimer);
    
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
  
  // Heartbeat to detect extension removal/reload instantly
  const heartbeatInterval = setInterval(() => {
    try {
      if (isInvalidated) return;
      chrome.runtime.getManifest();
    } catch (e) {
      if (e.message && e.message.includes('Extension context invalidated')) {
        clearInterval(heartbeatInterval);
        unloadListener();
      }
    }
  }, 1000);

  // ── USER ACTIVITY ─────────────────────────
  let lastActivityTime = 0;
  let judgingRevertTimer = null;
  function reportActivity() {
    if (Date.now() - lastActivityTime > 1000) {
      lastActivityTime = Date.now();
      safeSend({ type: 'CAT_EVENT', event: 'ACTIVITY' });
    }
  }

  ['mousemove', 'keydown', 'scroll', 'click'].forEach(evt => {
    document.addEventListener(evt, () => {
      if (isInvalidated || !pageCatOn) return;
      
      // Instantly wake up locally to avoid MV3 Service Worker cold-start desync
      if (catState === 'sleeping') {
        applyCatState(null);
      }
      
      reportActivity();
    }, { passive: true, signal: listenerSignal });
  });

  // ── MOUSE TRACKING (LOCAL ONLY) ─────────────
  const BASE = { lx: 30, ly: 54, rx: 60, ry: 54, slx: 38, sly: 55, srx: 68, sry: 55 };
  const MAX_MOVE = 3;

  let mouseX = 0;
  let mouseY = 0;
  let pupilRaf = null;

  function updatePupils() {
    pupilRaf = null;
    if (isInvalidated || !pageCatOn || catState === 'sleeping') return;

    const rect = cornerCat.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    const dist  = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const move  = Math.min(dist / 35, MAX_MOVE);
    const ox = +(Math.cos(angle) * move).toFixed(2);
    const oy = +(Math.sin(angle) * move).toFixed(2);

    const catGroup = cornerCat.querySelector('.k-cat-character');
    let isHovered = false;
    
    if (catGroup) {
      const catRect = catGroup.getBoundingClientRect();
      if (mouseX >= catRect.left && mouseX <= catRect.right && 
          mouseY >= catRect.top && mouseY <= catRect.bottom) {
        isHovered = true;
      }
    } else {
      // Fallback
      if (mouseX >= rect.left && mouseX <= rect.right && 
          mouseY >= rect.top && mouseY <= rect.bottom) {
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
  }

  document.addEventListener('mousemove', (e) => {
    if (isInvalidated || !pageCatOn) return;
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    if (!pupilRaf) {
      pupilRaf = requestAnimationFrame(updatePupils);
    }
  }, { signal: listenerSignal });

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
  }, { capture: true, signal: listenerSignal });

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
    const isTreatRunning = treatModeActive || currentTreat || treatTimeouts.length > 0;
    if (isTreatRunning || laserModeActive || !pageCatOn) return;
    const t = (e.composedPath && e.composedPath()[0]) || e.target;
    if (!t || !t.tagName) return;
    
    if (t.type === 'password') {
      activePasswordInput = t;
      updateCatPasswordPosition();
      activePasswordInput.addEventListener('input', handlePasswordInput, { signal: listenerSignal });
      activePasswordInput.addEventListener('keyup', handlePasswordInput, { signal: listenerSignal });
      activePasswordInput.addEventListener('mouseup', handlePasswordInput, { signal: listenerSignal });
      safeSend({ type: 'CAT_EVENT', event: 'SET_STATE', state: 'peeking' });
    } else {
      const tag = t.tagName.toUpperCase();
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SEARCH';
      const isEditable = t.isContentEditable || t.getAttribute('contenteditable') === 'true';
      const isSearchBox = t.getAttribute('role') === 'textbox' || t.getAttribute('role') === 'searchbox' || t.getAttribute('role') === 'combobox';
      const isCustomInput = tag.includes('-') && (tag.includes('INPUT') || tag.includes('SEARCH') || tag.includes('EDITOR') || tag.includes('QUERY'));

      if (isInput || isEditable || isSearchBox || isCustomInput) {
        if (tag === 'INPUT') {
          const excludedTypes = ['submit', 'button', 'checkbox', 'radio', 'hidden', 'color', 'file', 'image', 'range', 'reset'];
          if (excludedTypes.includes(t.type) || t.readOnly || t.disabled) return;
        }
        safeSend({ type: 'CAT_EVENT', event: 'SET_STATE', state: 'surprised' });
        if (catState === 'on-prop' || catState === 'leaving-prop') {
          cornerCat.classList.add('katban-surprised');
        }
      }
    }
  }, { capture: true, signal: listenerSignal });

  function hasLocalActiveInput() {
    let currentFocus = document.activeElement;
    // Recursively drill down into nested Shadow DOMs (e.g. Reddit, GitHub)
    while (currentFocus && currentFocus.shadowRoot && currentFocus.shadowRoot.activeElement) {
      currentFocus = currentFocus.shadowRoot.activeElement;
    }
    
    if (!currentFocus || currentFocus === document.body) return false;
    
    const tag = currentFocus.tagName.toUpperCase();
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SEARCH';
    const isEditable = currentFocus.isContentEditable || currentFocus.getAttribute('contenteditable') === 'true';
    const isSearchBox = currentFocus.getAttribute('role') === 'textbox' || currentFocus.getAttribute('role') === 'searchbox' || currentFocus.getAttribute('role') === 'combobox';
    const isCustomInput = tag.includes('-') && (tag.includes('INPUT') || tag.includes('SEARCH') || tag.includes('EDITOR') || tag.includes('QUERY'));
    
    if (!isInput && !isEditable && !isSearchBox && !isCustomInput) return false;
    
    if (tag === 'INPUT') {
      const excludedTypes = ['submit', 'button', 'checkbox', 'radio', 'hidden', 'color', 'file', 'image', 'range', 'reset'];
      if (excludedTypes.includes(currentFocus.type) || currentFocus.readOnly || currentFocus.disabled) return false;
    }
    
    return true;
  }

  let focusoutTimer = null;
  document.addEventListener('focusout', (e) => {
    if (isInvalidated) return;
    const t = (e.composedPath && e.composedPath()[0]) || e.target;
    if (t && t === activePasswordInput && pageCatOn && catState === 'peeking') {
      stopPeeking();
    } else {
      // Small delay so if focus immediately jumps to an inner/wrapper element, we don't blink the state.
      clearTimeout(focusoutTimer);
      focusoutTimer = setTimeout(() => {
        if (!hasLocalActiveInput()) {
          if (catState === 'surprised') {
            safeSend({ type: 'CAT_EVENT', event: 'SET_STATE', state: null });
          }
          if (cornerCat) cornerCat.classList.remove('katban-surprised');
        }
      }, 50);
    }
  }, { capture: true, signal: listenerSignal });

  // ── SCROLL BOBBING ───────────────────────────
  let scrollTimer = null;
  window.addEventListener('scroll', () => {
    if (isInvalidated || !pageCatOn) return;
    cornerCat.classList.add('katban-scrolling');
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      cornerCat.classList.remove('katban-scrolling');
    }, 650);
  }, { passive: true, signal: listenerSignal });

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
        <g class="k-nightcap" opacity="0">
          <path d="M 20 81 Q 50 92 80 81 L 82 86 Q 50 98 18 86 Z" fill="#f8fafc"/>
          <path d="M 60 30 Q 30 -30 -10 15 Q -20 30 0 40 Q 15 35 35 25 Q 50 15 60 30" fill="#1e40af"/>
          <path d="M 15 38 Q 45 5 78 38 Z" fill="#2563eb"/>
          <circle cx="-5" cy="35" r="14" fill="#f8fafc"/>
          <path d="M 15 36 Q 46 20 80 36 L 78 44 Q 46 28 17 44 Z" fill="#f8fafc"/>
        </g>
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
      const response = await chrome.runtime.sendMessage({ type: 'FETCH_DICTIONARY', word });
      if (!response || response.error) throw new Error();
      const data = response.data;
      const def  = data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition;
      const pos  = data?.[0]?.meanings?.[0]?.partOfSpeech;
      if (!def) throw new Error();

      defContent.textContent = '';
      const strong = document.createElement('strong');
      strong.textContent = word;
      if (pos) {
        const posSpan = document.createElement('span');
        posSpan.style.cssText = 'color:#888;font-weight:normal;text-transform:none';
        posSpan.textContent = ` (${pos})`;
        strong.appendChild(posSpan);
      }
      defContent.appendChild(strong);
      defContent.appendChild(document.createTextNode(def));

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
  }, { signal: listenerSignal });

  document.addEventListener('click', () => defBubble.classList.remove('katban-visible'), { signal: listenerSignal });

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
    
    // 1. SMART FILTER: Ignore completely if copying from a password field
    const activeEl = document.activeElement;
    if (activeEl && activeEl.tagName === 'INPUT' && activeEl.type === 'password') {
      return; // Do not log this
    }

    let copied = window.getSelection()?.toString() || '';
    if (!copied) return;

    // 2. SMART FILTER: Redact sensitive formats (Credit Cards and JWT tokens)
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    // Strict CC regex for common prefixes (Visa 4, Mastercard 5, Amex 3, Discover 6)
    const ccRegex = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9][0-9])[0-9]{12})$/;
    
    // Strip spaces/dashes to check CC regex easily
    const cleanForCC = copied.replace(/[\s-]/g, '');

    if (jwtRegex.test(copied.trim()) || ccRegex.test(cleanForCC)) {
      copied = '[Sensitive Data Protected]';
    }

    // Send to background for deduplication and encrypted storage.
    // We do NOT read clipboardHistory here to avoid:
    //   (a) comparing plaintext against AES-GCM ciphertext (always false), and
    //   (b) a race condition where two tabs read stale state and overwrite each other.
    // The background responds with CLIPBOARD_DUPLICATE or CLIPBOARD_LARGE_COPY
    // so the toast and judging state still work correctly.
    safeSend({ type: 'COPY_EVENT', text: copied });
  }, { signal: listenerSignal });

  // ── CAT STATE ────────────────────────────────
  const ALL_STATES = ['judging', 'sleeping', 'peeking', 'on-prop', 'leaving-prop', 'surprised', 'dancing', 'exhausted', 'holding-task'];
  
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
  blocker.innerHTML = `
    <div id="katban-score" class="katban-score">Score: 0</div>
    <div class="katban-blocker-content">
      ${buildCatSVG('blk-')}
      <h1 id="katban-block-title">Get Back to Work.</h1>
      <p id="katban-block-subtitle">Blocked during focus session.</p>
    </div>
  `;
  document.body.appendChild(blocker);

  // ── DVD CAT SPAWNER ──────────────────────────
  let cloneInterval = null;
  let sharedAudioCtx = null;

  function playMeow() {
    chrome.storage.local.get(['muteOverlaySound'], (data) => {
      if (data.muteOverlaySound) return;
      
      try {
        if (!sharedAudioCtx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (!AudioContext) return;
          sharedAudioCtx = new AudioContext();
        }
        if (sharedAudioCtx.state === 'suspended') {
          sharedAudioCtx.resume();
        }
        
        const osc = sharedAudioCtx.createOscillator();
        const gain = sharedAudioCtx.createGain();
        
        // Sawtooth wave for a slightly raspy, angry cat tone
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(500, sharedAudioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, sharedAudioCtx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(300, sharedAudioCtx.currentTime + 0.4);
        
        gain.gain.setValueAtTime(0, sharedAudioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, sharedAudioCtx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, sharedAudioCtx.currentTime + 0.4);
        
        osc.connect(gain);
        gain.connect(sharedAudioCtx.destination);
        osc.start();
        osc.stop(sharedAudioCtx.currentTime + 0.4);
      } catch(e) {
        // Ignore if browser completely blocks audio creation
      }
    });
  }

  function playPop() {
    chrome.storage.local.get(['muteOverlaySound'], (data) => {
      if (data.muteOverlaySound) return;
      try {
        if (!sharedAudioCtx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (!AudioContext) return;
          sharedAudioCtx = new AudioContext();
        }
        if (sharedAudioCtx.state === 'suspended') sharedAudioCtx.resume();
        const osc = sharedAudioCtx.createOscillator();
        const gain = sharedAudioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, sharedAudioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, sharedAudioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0, sharedAudioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, sharedAudioCtx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, sharedAudioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(sharedAudioCtx.destination);
        osc.start();
        osc.stop(sharedAudioCtx.currentTime + 0.1);
      } catch(e) {}
    });
  }

  function spawnDvdCat() {
    const newCat = document.createElement('div');
    newCat.className = 'katban-dvd-cat';
    newCat.innerHTML = buildCatSVG('dvd-' + Date.now() + Math.random());
    
    // Randomize initial position by jumping to a random point in the full animation loop
    const delayX = -(Math.random() * 14).toFixed(2);
    const delayY = -(Math.random() * 10.6).toFixed(2);
    const delaySpin = -(Math.random() * 4).toFixed(2);
    
    newCat.style.setProperty('animation-delay', `${delayX}s, ${delayY}s`, 'important');
    const svg = newCat.querySelector('svg');
    if (svg) svg.style.setProperty('animation-delay', `${delaySpin}s`, 'important');
    
    // Insert behind the content container
    const content = blocker.querySelector('.katban-blocker-content');
    if (content) {
      blocker.insertBefore(newCat, content);
    } else {
      blocker.appendChild(newCat);
    }
    
    // Minigame pop logic
    const popAction = (e) => {
      if (e) e.preventDefault();
      if (newCat.classList.contains('katban-popped')) return;
      newCat.classList.add('katban-popped');
      playPop();
      
      const scoreEl = document.getElementById('katban-score');
      if (scoreEl) {
        let currentScore = parseInt(scoreEl.textContent.replace('Score: ', '')) || 0;
        scoreEl.textContent = 'Score: ' + (currentScore + 1);
        scoreEl.style.transform = 'scale(1.2)';
        setTimeout(() => scoreEl.style.transform = 'scale(1)', 150);
      }
      
      setTimeout(() => newCat.remove(), 200);
    };
    
    newCat.addEventListener('mousedown', popAction);
    newCat.addEventListener('touchstart', popAction);
    
    // Play sound effect
    playMeow();
  }

  function startCatSpawner() {
    if (cloneInterval) return;
    spawnDvdCat(); // Spawn the first one immediately
    cloneInterval = setInterval(() => {
      spawnDvdCat();
    }, 5000); // reduced to 5 seconds for more fun
  }

  function stopCatSpawner() {
    if (cloneInterval) {
      clearInterval(cloneInterval);
      cloneInterval = null;
    }
    // Remove all clones
    document.querySelectorAll('.katban-dvd-cat').forEach(el => el.remove());
    const scoreEl = document.getElementById('katban-score');
    if (scoreEl) scoreEl.textContent = 'Score: 0';
  }

  // ── MESSAGE LISTENER ─────────────────────────
  const messageListener = (msg, sender, sendResponse) => {
    try {
      if (isInvalidated) return;

      // Defense-in-depth: explicitly reject messages not from this extension.
      // chrome.runtime.onMessage already scopes to same-extension only,
      // but this guard protects against edge cases like cross-extension messaging bugs.
      if (sender.id !== chrome.runtime.id) return;

      if (msg.type === 'BLOCK_PAGE') {
        blocker.classList.add('katban-active');
        startCatSpawner();
      }

      if (msg.type === 'TIMER_STATE') {
        if (msg.state !== 'focus') {
          blocker.classList.remove('katban-active');
          cornerCat.classList.toggle('katban-hidden', !pageCatOn);
          stopCatSpawner();
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

      // TRIGGER_LEAVE_PROP removed; state transition handled fully via SYNC_CAT_STATE
      
      if (msg.type === 'SYNC_CAT_STATE') {
        // Ignore incoming states if we are busy playing!
        if (treatModeActive || laserModeActive || treatTimeouts.length > 0 || currentTreat) return;

        // Filter out context-specific states if this tab doesn't have the context
        if (msg.state === 'peeking' && !activePasswordInput) {
          applyCatState(null);
          // Do not broadcast 'null' back to the background, as that breaks the original tab
          return;
        }
        if (msg.state === 'surprised' && !hasLocalActiveInput()) {
          applyCatState(null);
          // Do not broadcast 'null' back to the background, as that breaks the original tab
          return;
        }

        applyCatState(msg.state);

        if (msg.state === 'leaving-prop') {
          setTimeout(() => {
            if (catState === 'leaving-prop') {
              safeSend({ type: 'CAT_EVENT', event: 'SET_STATE', state: null });
              if (hasLocalActiveInput()) {
                safeSend({ type: 'CAT_EVENT', event: 'SET_STATE', state: 'surprised' });
              }
            }
          }, 1500);
        }

        if (msg.state === 'judging') {
          clearTimeout(judgingRevertTimer);
          judgingRevertTimer = setTimeout(() => {
            if (catState === 'judging') {
              safeSend({ type: 'CAT_EVENT', event: 'SET_STATE', state: null });
            }
          }, 3200);
        }

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
      
      if (msg.type === 'CLIPBOARD_DUPLICATE') {
        // Background confirmed this text was already in history (decryption-based check)
        const dupLines = [
          'Already got that, human.',
          'Stop repeating yourself, meow.',
          'I already memorized that.',
          'Deja vu? You already copied this.',
          'I am a cat, not a broken record.'
        ];
        judgeToast.textContent = dupLines[Math.floor(Math.random() * dupLines.length)];
        judgeToast.classList.add('katban-visible');
        clearTimeout(judgeTimer);
        judgeTimer = setTimeout(() => {
          judgeToast.classList.remove('katban-visible');
        }, 3200);
      }

      if (msg.type === 'CLIPBOARD_LARGE_COPY') {
        // Background confirmed a large (>500 char) unique copy was stored
        judgeToast.textContent = judgeLines[Math.floor(Math.random() * judgeLines.length)];
        judgeToast.classList.add('katban-visible');
        clearTimeout(judgeTimer);
        judgeTimer = setTimeout(() => {
          judgeToast.classList.remove('katban-visible');
        }, 3200);
      }

      if (msg.type === 'SPAWN_TREAT') {
        activateTreatMode();
        if (sendResponse) sendResponse({ success: true });
        return true;
      }
      
      if (msg.type === 'SPAWN_LASER') {
        activateLaserMode();
        if (sendResponse) sendResponse({ success: true });
        return true;
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

  // ── TREAT MODE ───────────────────────────────
  let treatModeActive = false;
  let currentTreat = null;
  let treatTimeouts = [];

  function clearTreatTimeouts() {
    treatTimeouts.forEach(t => clearTimeout(t));
    treatTimeouts = [];
  }

  let endLaserModeGlobal = null;

  function activateTreatMode() {
    if (treatModeActive) return;
    if (laserModeActive && endLaserModeGlobal) {
      endLaserModeGlobal(true);
    }
    treatModeActive = true;
    
    // Clear any existing state (like being in a box) globally and locally
    applyCatState(null);
    safeSend({ type: 'CAT_EVENT', event: 'SET_STATE', state: null });

    // Add overlay cursor layer
    const treatOverlay = document.createElement('div');
    treatOverlay.className = 'katban-treat-overlay';
    document.body.appendChild(treatOverlay);

    // Click to drop treat
    treatOverlay.addEventListener('click', (e) => {
      // Remove overlay
      treatOverlay.remove();
      treatModeActive = false;
      
      // Cleanup previous treat if interrupted
      if (currentTreat) {
        currentTreat.remove();
        clearTreatTimeouts();
      }

      // Create falling treat element
      const treat = document.createElement('div');
      treat.className = 'katban-treat';
      treat.textContent = '🍖';
      treat.style.left = `${e.clientX}px`;
      treat.style.top = `${e.clientY}px`;
      document.body.appendChild(treat);
      currentTreat = treat;
      
      // Trigger fall
      treat.getBoundingClientRect(); // force reflow
      treat.style.top = 'calc(100vh - 50px)';

      // Calculate absolute delta from base position (right: 20px)
      const targetX = e.clientX;
      const baseCatCenterX = window.innerWidth - 95; // right: 20px -> left: innerWidth-170 -> center: innerWidth-95
      const deltaX = targetX - baseCatCenterX;
      
      // Calculate remaining duration based on CURRENT position so speed is constant
      const currentRect = cornerCat.getBoundingClientRect();
      const currentCatCenterX = currentRect.left + (currentRect.width / 2);
      const travelDist = Math.abs(targetX - currentCatCenterX);
      
      // Calculate a slow, constant speed (e.g., 120 pixels per second)
      const speedPxPerSec = 120;
      const durationSec = Math.max(0.2, travelDist / speedPxPerSec);
      
      cornerCat.classList.remove('katban-eating'); // cancel eating if it was
      cornerCat.classList.remove('katban-hidden'); // Make sure it's visible for the treat
      cornerCat.classList.add('katban-running');
      
      // Flip if the target is to the RIGHT of the cat's CURRENT position
      if (targetX > currentCatCenterX) {
        cornerCat.classList.add('katban-flipped');
      } else {
        cornerCat.classList.remove('katban-flipped');
      }
      
      cornerCat.style.setProperty('transition', `transform ${durationSec}s linear`, 'important');
      cornerCat.style.setProperty('transform', `translateX(${deltaX}px)`, 'important');

      // Wait for cat to reach treat
      treatTimeouts.push(setTimeout(() => {
        cornerCat.classList.remove('katban-running');
        cornerCat.classList.remove('katban-flipped'); // assume facing left to eat
        
        cornerCat.classList.add('katban-eating');
        treat.style.transform = 'translateX(-50%) scale(0)'; // "eat" it
        
        // Wait for eat finish, run back
        treatTimeouts.push(setTimeout(() => {
          treat.remove();
          if (currentTreat === treat) currentTreat = null;
          
          cornerCat.classList.remove('katban-eating');
          cornerCat.classList.add('katban-running');
          
          // Running back to origin (which is on the right) -> flip
          cornerCat.classList.add('katban-flipped');
          // Calculate return duration
          const returnDist = Math.abs(baseCatCenterX - targetX);
          const returnDuration = Math.max(0.5, returnDist / speedPxPerSec);
          
          cornerCat.style.setProperty('transition', `transform ${returnDuration}s linear`, 'important');
          cornerCat.style.setProperty('transform', `translateX(0px)`, 'important');
          treatTimeouts.push(setTimeout(() => {
            cornerCat.classList.remove('katban-running');
            cornerCat.classList.remove('katban-flipped');
            cornerCat.style.removeProperty('transition');
            cornerCat.style.removeProperty('transform');
            // Hide again if the setting was turned off
            if (!pageCatOn) cornerCat.classList.add('katban-hidden');
            // Cleanup memory
            if (treatTimeouts.length > 0) treatTimeouts = [];
          }, returnDuration * 1000));
        }, 1500));
      }, durationSec * 1000));
    });
  }
  // ── LASER MODE ───────────────────────────────
  let laserModeActive = false;
  let laserDot = null;
  let laserBeam = null;
  let laserDevice = null;
  let laserOverlay = null;
  let laserRaf = null;

  function activateLaserMode() {
    const isTreatRunning = treatModeActive || currentTreat || treatTimeouts.length > 0;
    if (isTreatRunning) {
      // Cancel treat mode to start laser
      const overlay = document.querySelector('.katban-treat-overlay');
      if (overlay) overlay.remove();
      treatModeActive = false;
      if (currentTreat) {
        currentTreat.remove();
        currentTreat = null;
      }
      clearTreatTimeouts();
      cornerCat.classList.remove('katban-eating', 'katban-running', 'katban-flipped');
      cornerCat.style.removeProperty('transition');
      
      // Calculate current position to avoid teleportation
      const rect = cornerCat.getBoundingClientRect();
      const currentCatCenterX = rect.left + (rect.width / 2);
      const baseCatCenterX = window.innerWidth - 95;
      cornerCat.style.setProperty('transform', `translateX(${currentCatCenterX - baseCatCenterX}px)`, 'important');
    }
    if (laserModeActive) return;
    laserModeActive = true;
    
    // Clear any existing state (like being in a box) globally and locally
    applyCatState(null);
    safeSend({ type: 'CAT_EVENT', event: 'SET_STATE', state: null });
    
    laserOverlay = document.createElement('div');
    laserOverlay.className = 'katban-laser-overlay';
    document.body.appendChild(laserOverlay);
    
    laserDevice = document.createElement('div');
    laserDevice.className = 'katban-laser-device';
    laserDevice.textContent = '🖊️';
    document.body.appendChild(laserDevice);
    
    laserBeam = document.createElement('div');
    laserBeam.className = 'katban-laser-beam';
    document.body.appendChild(laserBeam);

    laserDot = document.createElement('div');
    laserDot.className = 'katban-laser-dot';
    document.body.appendChild(laserDot);
    
    cornerCat.classList.remove('katban-hidden');
    cornerCat.classList.add('katban-running');
    cornerCat.style.setProperty('transition', 'none', 'important'); // We will update manually
    
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    
    const baseCatCenterX = window.innerWidth - 95;
    
    // Pick up from current position if interrupted from Treat mode
    const currentRect = cornerCat.getBoundingClientRect();
    let currentX = currentRect.left + (currentRect.width / 2);
    // Fallback to base center if hidden
    if (cornerCat.classList.contains('katban-hidden') || currentX === 0) {
      currentX = baseCatCenterX;
    }
    
    const moveListener = (e) => {
      laserDevice.style.left = `${e.clientX}px`;
      laserDevice.style.top = `${e.clientY}px`;
      
      laserBeam.style.left = `${e.clientX}px`;
      laserBeam.style.top = `${e.clientY}px`;
      
      // Calculate 45 deg diagonal dot position hitting the ground
      const groundY = window.innerHeight - 15; // slightly above bottom edge
      const dy = Math.max(0, groundY - e.clientY);
      const beamLength = dy / 0.7071;
      
      laserBeam.style.setProperty('width', `${beamLength}px`, 'important');
      
      targetX = e.clientX + dy;
      targetY = groundY;
      
      // offset by 5px so the 10x10 dot's center is at the target
      laserDot.style.setProperty('left', `${targetX - 5}px`, 'important');
      laserDot.style.setProperty('top', `${targetY - 5}px`, 'important');
    };
    
    // Store the 15s auto-cancel timer ID so we can clear it inside endLaserMode.
    // Without this, force-cancelling laser mode (e.g. Treat takes over) would
    // still fire the timer later and run the 'run home' path, conflicting with
    // whatever animation is now active.
    let laserMaxTimer = null;

    const endLaserMode = (force = false) => {
      laserModeActive = false;
      endLaserModeGlobal = null;
      // Always clear the 15s timer — it may or may not have fired already
      clearTimeout(laserMaxTimer);
      document.removeEventListener('mousemove', moveListener);
      document.removeEventListener('click', endLaserMode);
      if (laserDot) laserDot.remove();
      if (laserBeam) laserBeam.remove();
      if (laserDevice) laserDevice.remove();
      if (laserOverlay) laserOverlay.remove();
      cancelAnimationFrame(laserRaf);
      
      if (force === true) {
        // Instant cancel without running home (e.g. Treat mode takes over)
        cornerCat.classList.remove('katban-pouncing', 'katban-running', 'katban-flipped');
        cornerCat.style.removeProperty('transition');
        return;
      }
      
      // Run back home
      cornerCat.classList.remove('katban-pouncing');
      cornerCat.classList.add('katban-running');
      cornerCat.classList.remove('katban-flipped'); // Face left to run back
      if (currentX < baseCatCenterX) cornerCat.classList.add('katban-flipped'); // Face right if on the left
      
      cornerCat.style.setProperty('transition', 'transform 1s linear', 'important');
      cornerCat.style.setProperty('transform', 'translateX(0px)', 'important');
      
      setTimeout(() => {
        cornerCat.classList.remove('katban-running');
        cornerCat.classList.remove('katban-pouncing');
        cornerCat.classList.remove('katban-flipped');
        cornerCat.style.removeProperty('transition');
        cornerCat.style.removeProperty('transform');
        if (!pageCatOn) cornerCat.classList.add('katban-hidden');
      }, 1000);
    };
    endLaserModeGlobal = endLaserMode;
    
    document.addEventListener('mousemove', moveListener, { signal: listenerSignal });
    // Defer click-to-stop registration until AFTER the current click event (which
    // triggered activateLaserMode) has fully propagated — otherwise it fires immediately.
    setTimeout(() => {
      if (laserModeActive) {
        document.addEventListener('click', endLaserMode, { signal: listenerSignal }); // click anywhere to stop
      }
    }, 0);

    
    let lastTime = performance.now();
    
    function laserLoop(now) {
      if (!laserModeActive) return;
      
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      
      const dist = targetX - currentX;
      const absDist = Math.abs(dist);
      const speed = 400; // px/sec
      
      if (absDist > 20) {
        cornerCat.classList.remove('katban-pouncing');
        cornerCat.classList.add('katban-running');
        
        if (dist > 0) {
          cornerCat.classList.add('katban-flipped');
          currentX += speed * dt;
          if (currentX > targetX) currentX = targetX;
        } else {
          cornerCat.classList.remove('katban-flipped');
          currentX -= speed * dt;
          if (currentX < targetX) currentX = targetX;
        }
      } else {
        // Close enough to pounce
        cornerCat.classList.remove('katban-running');
        cornerCat.classList.add('katban-pouncing');
      }
      
      cornerCat.style.setProperty('transform', `translateX(${currentX - baseCatCenterX}px)`, 'important');
      laserRaf = requestAnimationFrame(laserLoop);
    }
    
    laserRaf = requestAnimationFrame(laserLoop);
    // Assign to laserMaxTimer so endLaserMode can cancel it on force-cancel
    laserMaxTimer = setTimeout(endLaserMode, 15000); // 15s max
  }

  // ── TYPING ───────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (isInvalidated || !pageCatOn || catState === 'peeking' || catState === 'judging') return;
    if (!e.key || e.key.length !== 1) return; // Safely ignore autofill/synthetic events
    
    // Only trigger typing if focused inside a text field or contenteditable element
    if (!hasLocalActiveInput()) return;
    
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
  }, { signal: listenerSignal });

  // ── ONBOARDING TUTORIAL ──────────────────────
  let onboardingOverlay = null;
  let onboardingIframe = null;
  let onboardingBubble = null;
  
  function updateOnboardingUI(step) {
    if (step <= 0 || step > 7) {
      if (onboardingOverlay) {
        onboardingOverlay.remove();
        onboardingOverlay = null;
      }
      if (onboardingBubble) {
        onboardingBubble.remove();
        onboardingBubble = null;
      }
      if (onboardingIframe) {
        onboardingIframe.remove();
        onboardingIframe = null;
      }
      applyCatState(null); // resume normal
      cornerCat.style.zIndex = '';
      cornerCat.classList.remove('mood-happy', 'katban-visible');
      return;
    }

    if (!onboardingOverlay) {
      onboardingOverlay = document.createElement('div');
      onboardingOverlay.className = 'katban-onboarding-overlay';
      
      const skipBtn = document.createElement('button');
      skipBtn.className = 'katban-btn-skip';
      skipBtn.textContent = 'Skip Tutorial';
      skipBtn.onclick = (e) => {
        e.stopPropagation();
        chrome.storage.local.set({ katbanOnboardingStep: 0 });
      };
      onboardingOverlay.appendChild(skipBtn);
      
      onboardingBubble = document.createElement('div');
      onboardingBubble.className = 'katban-dialogue-bubble';
      document.body.appendChild(onboardingBubble);
      
      onboardingIframe = document.createElement('iframe');
      onboardingIframe.className = 'katban-popup-iframe';
      onboardingIframe.src = chrome.runtime.getURL('popup.html?onboarding=true');
      onboardingIframe.style.display = 'none';
      onboardingIframe.style.pointerEvents = 'none'; // Prevent clicks inside iframe
      document.body.appendChild(onboardingIframe);
      
      // Advance step on click anywhere on overlay
      onboardingOverlay.onclick = () => {
        chrome.storage.local.get(['katbanOnboardingStep'], (data) => {
          let nextStep = (data.katbanOnboardingStep || 1) + 1;
          chrome.storage.local.set({ katbanOnboardingStep: nextStep });
        });
      };
      
      document.body.appendChild(onboardingOverlay);
      
      // Bring cat above overlay
      cornerCat.style.zIndex = '2147483647';
      cornerCat.classList.remove('katban-hidden');
      
      // Dynamic vertical alignment listener
      window.addEventListener('message', (e) => {
        if (e.data && e.data.type === 'ONBOARDING_REPLY' && e.data.action === 'alignBubble') {
          if (onboardingBubble && onboardingIframe) {
            const iframeRect = onboardingIframe.getBoundingClientRect();
            const targetY = iframeRect.top + e.data.centerY;
            onboardingBubble.style.bottom = 'auto';
            onboardingBubble.style.top = `${targetY - (onboardingBubble.offsetHeight / 2)}px`;
          }
        }
      }, { signal: listenerSignal });
    }

    // Set fixed state for cat during onboarding so it doesn't distract
    applyCatState(null); // reset animation
    cornerCat.classList.add('katban-visible'); // keep visible

    switch(step) {
      case 1:
        onboardingIframe.style.display = 'none';
        onboardingBubble.className = 'katban-dialogue-bubble point-cat';
        onboardingBubble.style.top = 'auto'; // clear dynamic top
        onboardingBubble.innerHTML = "Hi! I'm Katban, your interactive companion. You can open me anytime with <strong>Ctrl+Shift+K</strong> (Cmd+Shift+K on Mac). Let me show you around. Click to continue.";
        break;
      case 2:
        onboardingIframe.style.display = 'block';
        onboardingBubble.className = 'katban-dialogue-bubble point-iframe';
        onboardingBubble.textContent = "This is your control center. Here you can start a Focus Session to block distracting websites.";
        setTimeout(() => {
          if (onboardingIframe && onboardingIframe.contentWindow) {
            onboardingIframe.contentWindow.postMessage({ type: 'ONBOARDING_CMD', action: 'switchTab', target: 'tab-home' }, '*');
            onboardingIframe.contentWindow.postMessage({ type: 'ONBOARDING_CMD', action: 'highlight', target: '#pomodoro-section' }, '*');
          }
        }, 100);
        break;
      case 3:
        onboardingIframe.style.display = 'block';
        onboardingBubble.className = 'katban-dialogue-bubble point-iframe';
        onboardingBubble.textContent = "You can keep track of what you are doing in the Kat-ban board.";
        setTimeout(() => {
          if (onboardingIframe && onboardingIframe.contentWindow) {
            onboardingIframe.contentWindow.postMessage({ type: 'ONBOARDING_CMD', action: 'switchTab', target: 'tab-tasks' }, '*');
            onboardingIframe.contentWindow.postMessage({ type: 'ONBOARDING_CMD', action: 'highlight', target: '#tab-tasks' }, '*');
          }
        }, 100);
        break;
      case 4:
        onboardingIframe.style.display = 'block';
        onboardingBubble.className = 'katban-dialogue-bubble point-iframe';
        onboardingBubble.textContent = "Here you can view your Focus Stats and manage your Blocked Sites list.";
        setTimeout(() => {
          if (onboardingIframe && onboardingIframe.contentWindow) {
            onboardingIframe.contentWindow.postMessage({ type: 'ONBOARDING_CMD', action: 'switchTab', target: 'tab-stats' }, '*');
            onboardingIframe.contentWindow.postMessage({ type: 'ONBOARDING_CMD', action: 'highlight', target: '#tab-stats' }, '*');
          }
        }, 100);
        break;
      case 5:
        onboardingIframe.style.display = 'block';
        onboardingBubble.className = 'katban-dialogue-bubble point-iframe';
        onboardingBubble.textContent = "I also keep your copied text safe and sound right here in the Clipboard!";
        setTimeout(() => {
          if (onboardingIframe && onboardingIframe.contentWindow) {
            onboardingIframe.contentWindow.postMessage({ type: 'ONBOARDING_CMD', action: 'switchTab', target: 'tab-clipboard' }, '*');
            onboardingIframe.contentWindow.postMessage({ type: 'ONBOARDING_CMD', action: 'highlight', target: '#clipboard-section' }, '*');
          }
        }, 100);
        break;
      case 6:
        onboardingIframe.style.display = 'block';
        onboardingBubble.className = 'katban-dialogue-bubble point-iframe';
        onboardingBubble.textContent = "Up here you can give me Treats, play with Lasers, tweak Settings, or Vent to me at the bottom!";
        setTimeout(() => {
          if (onboardingIframe && onboardingIframe.contentWindow) {
            onboardingIframe.contentWindow.postMessage({ type: 'ONBOARDING_CMD', action: 'highlight', target: '.btn-treat-open, .btn-laser-open, .btn-settings-open, #btn-rant-toggle-main' }, '*');
          }
        }, 100);
        break;
      case 7:
        onboardingIframe.style.display = 'none';
        onboardingBubble.className = 'katban-dialogue-bubble point-cat';
        onboardingBubble.style.top = 'auto'; // clear dynamic top
        onboardingBubble.textContent = "Enjoy it! Click anywhere to close.";
        cornerCat.classList.add('mood-happy');
        
        // Spawn hearts around the cat natively via CSS/SVG
        // (Handled by .mood-happy showing .k-hearts)
        break;
    }
  }

  // Handle storage changes to sync tabs
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.katbanOnboardingStep) {
      if (isInvalidated) return;
      const newStep = changes.katbanOnboardingStep.newValue || 0;
      updateOnboardingUI(newStep);
    }
  });

  // Initial Check
  chrome.storage.local.get(['katbanOnboardingStep'], (data) => {
    if (isInvalidated) return;
    if (data.katbanOnboardingStep > 0) {
      updateOnboardingUI(data.katbanOnboardingStep);
    }
  });

})();
