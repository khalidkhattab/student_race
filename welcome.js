/* شاشة الدخول: تُعرض عند فتح الموقع (بدون # أو #welcome) */
window.WELCOME_HTML = function (stats) {
  const n = (x) => Number(x).toLocaleString('ar-EG');
  return `
<section class="wl" dir="rtl">
  <svg class="wl-float-a wl-sun" aria-hidden="true" viewBox="0 0 220 150">
    <circle cx="80" cy="70" r="48" fill="#F5B83D"/>
    <g class="wl-spin-rays" stroke="#F5B83D" stroke-width="6" stroke-linecap="round">
      <line x1="80" y1="6" x2="80" y2="-6"/><line x1="16" y1="70" x2="2" y2="70"/>
      <line x1="35" y1="25" x2="26" y2="16"/><line x1="125" y1="25" x2="134" y2="16"/>
      <line x1="35" y1="115" x2="26" y2="124"/>
    </g>
    <path class="wl-drift" d="M92 128 h100 a22 22 0 0 0 -6 -43 a30 30 0 0 0 -56 -8 a24 24 0 0 0 -38 26 a13 13 0 0 0 0 25 z" fill="var(--wl-cloud)"/>
  </svg>

  <svg class="wl-side wl-float-b wl-globe" aria-hidden="true" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="84" fill="#CDE9F4" stroke="#0f766e" stroke-width="5"/>
    <path d="M58 54 c18 -10 34 -4 40 8 c6 12 -6 20 -2 32 c4 12 -10 18 -22 12 c-12 -6 -24 -2 -30 -14 c-6 -12 2 -30 14 -38 z" fill="#2E9C8A"/>
    <path d="M116 86 c14 -6 30 0 36 12 c6 14 -2 30 -14 42 c-10 10 -22 12 -26 0 c-4 -12 -10 -18 -8 -30 c2 -10 4 -20 12 -24 z" fill="#2E9C8A"/>
    <path d="M120 40 c10 -2 22 4 24 12 c-8 4 -18 2 -24 -12 z" fill="#2E9C8A"/>
    <ellipse cx="100" cy="100" rx="38" ry="84" fill="none" stroke="#0f766e" stroke-width="2" opacity=".35"/>
    <line x1="16" y1="100" x2="184" y2="100" stroke="#0f766e" stroke-width="2" opacity=".35"/>
    <g class="wl-bob">
      <path d="M150 18 c-12 0 -20 9 -20 20 c0 15 20 34 20 34 s20 -19 20 -34 c0 -11 -8 -20 -20 -20 z" fill="#E4572E"/>
      <circle cx="150" cy="38" r="7" fill="#FFFFFF"/>
    </g>
  </svg>

  <svg class="wl-side wl-path" aria-hidden="true" viewBox="0 0 400 140">
    <path class="wl-dash" d="M10 120 C 120 10, 260 10, 390 90" fill="none" stroke="#0f766e" stroke-width="3" stroke-linecap="round" opacity=".5"/>
    <path class="wl-plane" d="M10 0 L-8 -7 L-4 0 L-8 7 Z" fill="#E4572E"/>
  </svg>

  <svg class="wl-side wl-float-a wl-card" aria-hidden="true" viewBox="0 0 220 250">
    <rect x="14" y="14" width="190" height="220" rx="22" fill="#FFFFFF" stroke="#CFE3DC" stroke-width="3"/>
    <rect x="38" y="40" width="120" height="12" rx="6" fill="#10302C" opacity=".85"/>
    <rect x="38" y="62" width="84" height="10" rx="5" fill="#10302C" opacity=".3"/>
    <rect x="34" y="94" width="150" height="34" rx="10" fill="#E3F4EE" stroke="#2E9C8A" stroke-width="2.5"/>
    <circle cx="164" cy="111" r="9" fill="#2E9C8A"/>
    <path d="M159 111 l4 4 l7 -8" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="50" y="106" width="80" height="10" rx="5" fill="#0f766e" opacity=".6"/>
    <rect x="34" y="138" width="150" height="34" rx="10" fill="#F6F8F7" stroke="#DCE6E2" stroke-width="2"/>
    <circle cx="164" cy="155" r="8" fill="none" stroke="#B9CCC5" stroke-width="2.5"/>
    <rect x="50" y="150" width="64" height="10" rx="5" fill="#10302C" opacity=".2"/>
    <rect x="34" y="182" width="150" height="34" rx="10" fill="#F6F8F7" stroke="#DCE6E2" stroke-width="2"/>
    <circle cx="164" cy="199" r="8" fill="none" stroke="#B9CCC5" stroke-width="2.5"/>
    <rect x="50" y="194" width="90" height="10" rx="5" fill="#10302C" opacity=".2"/>
    <g class="wl-pop">
      <circle cx="200" cy="22" r="20" fill="#F5B83D"/>
      <path d="M190 22 l7 7 l13 -14" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </svg>

  <svg class="wl-side wl-float-b wl-book" aria-hidden="true" viewBox="0 0 240 170">
    <path d="M120 40 C 90 22, 44 20, 14 30 L 14 146 C 44 136, 90 138, 120 156 Z" fill="#FFFFFF" stroke="#0f766e" stroke-width="4" stroke-linejoin="round"/>
    <path d="M120 40 C 150 22, 196 20, 226 30 L 226 146 C 196 136, 150 138, 120 156 Z" fill="#FFFFFF" stroke="#0f766e" stroke-width="4" stroke-linejoin="round"/>
    <line x1="120" y1="40" x2="120" y2="156" stroke="#0f766e" stroke-width="4"/>
    <g stroke="#2E9C8A" stroke-width="5" stroke-linecap="round" opacity=".55">
      <line x1="140" y1="60" x2="206" y2="54"/><line x1="140" y1="80" x2="206" y2="74"/>
      <line x1="140" y1="100" x2="190" y2="96"/><line x1="34" y1="54" x2="100" y2="60"/>
      <line x1="34" y1="74" x2="100" y2="80"/>
    </g>
    <path d="M40 112 l18 -16 l12 10 l14 -18 l16 24 z" fill="#5FB3A1"/>
    <g class="wl-write" transform="translate(150 6) rotate(28)">
      <rect x="0" y="0" width="16" height="96" rx="3" fill="#F5B83D"/>
      <rect x="0" y="0" width="16" height="14" rx="3" fill="#E4572E"/>
      <path d="M0 96 L8 116 L16 96 Z" fill="#F3D9A8"/>
      <path d="M5 108 L8 116 L11 108 Z" fill="#10302C"/>
    </g>
  </svg>

  <svg class="wl-side wl-compass" aria-hidden="true" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="44" fill="#FFFFFF" stroke="#0f766e" stroke-width="4"/>
    <g class="wl-swing">
      <path d="M50 14 L58 50 L50 86 L42 50 Z" fill="#0f766e" opacity=".25"/>
      <path d="M50 14 L58 50 L42 50 Z" fill="#E4572E"/>
    </g>
    <circle cx="50" cy="50" r="5" fill="#10302C"/>
  </svg>

  <svg class="wl-land" aria-hidden="true" viewBox="0 0 1440 280" preserveAspectRatio="xMidYMax slice">
    <path d="M0 200 L120 120 L200 170 L330 60 L440 150 L520 110 L600 170 L760 190 L880 90 L980 160 L1080 70 L1200 150 L1300 100 L1440 170 L1440 280 L0 280 Z" fill="var(--wl-m1)"/>
    <path d="M330 60 L360 86 L345 84 L330 96 L315 84 L300 88 Z" fill="#FFFFFF"/>
    <path d="M1080 70 L1110 96 L1094 94 L1080 106 L1066 94 L1050 98 Z" fill="#FFFFFF"/>
    <path d="M880 90 L904 112 L890 110 L880 120 L868 110 L856 112 Z" fill="#FFFFFF"/>
    <path d="M0 230 C 160 180, 300 210, 440 190 C 600 168, 720 220, 900 200 C 1060 182, 1200 214, 1440 196 L1440 280 L0 280 Z" fill="var(--wl-m2)"/>
    <path d="M0 256 C 240 236, 520 260, 760 248 C 1000 236, 1220 258, 1440 244 L1440 280 L0 280 Z" fill="#0f766e"/>
    <path class="wl-river" d="M560 280 C 600 262, 700 262, 720 250 C 740 240, 820 240, 860 246" fill="none" stroke="#7CC4E0" stroke-width="8" stroke-linecap="round"/>
    <g transform="translate(190 186)">
      <rect x="-3" y="0" width="6" height="40" rx="3" fill="#7A5A3A"/>
      <path class="wl-sway" d="M0 2 C -14 -6, -26 0, -30 10 C -18 4, -8 4, 0 2 Z M0 2 C 14 -6, 26 0, 30 10 C 18 4, 8 4, 0 2 Z M0 2 C -6 -14, -2 -24, 6 -26 C 2 -16, 2 -8, 0 2 Z" fill="#0b5a54"/>
    </g>
    <g transform="translate(1250 180)">
      <rect x="-3" y="0" width="6" height="44" rx="3" fill="#7A5A3A"/>
      <path class="wl-sway" d="M0 2 C -14 -6, -26 0, -30 10 C -18 4, -8 4, 0 2 Z M0 2 C 14 -6, 26 0, 30 10 C 18 4, 8 4, 0 2 Z M0 2 C -6 -14, -2 -24, 6 -26 C 2 -16, 2 -8, 0 2 Z" fill="#0b5a54"/>
    </g>
  </svg>

  <div class="wl-center">
    <div class="wl-logo">
      <svg role="img" aria-label="شعار المنصة" viewBox="0 0 48 48">
        <path d="M24 12 C 19 9, 11 9, 6 11 L 6 37 C 11 35, 19 35, 24 38 Z" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linejoin="round"/>
        <path d="M24 12 C 29 9, 37 9, 42 11 L 42 37 C 37 35, 29 35, 24 38 Z" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linejoin="round"/>
        <path d="M29 22 l4 4 l7 -8" fill="none" stroke="#F5B83D" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <span class="wl-chip wl-rise wl-d2">${stats.tag}</span>
    <h1 class="wl-title wl-rise wl-d3">منصة اختباراتي</h1>
    <p class="wl-sub wl-rise wl-d4">تدرّب على أسئلة دروسك قبل الامتحان، واعرف درجتك فوراً، وراجع أخطاءك حتى تتقنها.</p>
    <a class="wl-enter" href="#home">
      <span>دخول</span>
      <svg class="wl-arrow" aria-hidden="true" viewBox="0 0 24 24"><path d="M15 5 L8 12 L15 19" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </a>
    <div class="wl-facts wl-rise wl-d6">
      <span><i style="background:#2E9C8A"></i>${n(stats.questions)} سؤالاً</span>
      <span><i style="background:#F5B83D"></i>${n(stats.lessons)} دروس</span>
      <span><i style="background:#E4572E"></i>تدريب واختبار</span>
    </div>
  </div>
</section>`;
};
