/**
 * assets.js - Graphic assets & SVG definitions for Loy Krathong Web App
 * Contains 6 detailed traditional Krathong bases, 5 auspicious flowers,
 * glowing incense & candle, lucky items, and default Thai twilight river backdrop.
 */

// CanvasRenderingContext2D.roundRect polyfill for compatibility
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
    if (!radii) radii = 0;
    let r = Array.isArray(radii) ? radii[0] : radii;
    if (r < 0) r = 0;
    const maxR = Math.min(w / 2, h / 2);
    if (r > maxR) r = maxR;
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

const KRATHONG_ASSETS = {
  bases: [
    {
      id: 'base_banana_leaf',
      name: 'กระทงใบตองดั้งเดิม',
      description: 'ใบตองแท้พับจีบผกากลีบบัวซ้อนชั้น ประณีตตามแบบฉบับโบราณ เป็นมิตรต่อสายน้ำ',
      tag: 'ยอดนิยมอันดับ 1',
      color: '#4caf50',
      svg: `<svg viewBox="0 0 300 180" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="leafGlow" cx="50%" cy="60%" r="50%">
      <stop offset="0%" stop-color="#8bc34a"/>
      <stop offset="60%" stop-color="#4caf50"/>
      <stop offset="100%" stop-color="#1b5e20"/>
    </radialGradient>
    <linearGradient id="bananaStem" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#dcedc8"/>
      <stop offset="50%" stop-color="#aed581"/>
      <stop offset="100%" stop-color="#689f38"/>
    </linearGradient>
    <linearGradient id="petalGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#aed581"/>
      <stop offset="40%" stop-color="#43a047"/>
      <stop offset="100%" stop-color="#1b5e20"/>
    </linearGradient>
    <linearGradient id="petalGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#c5e1a5"/>
      <stop offset="50%" stop-color="#66bb6a"/>
      <stop offset="100%" stop-color="#2e7d32"/>
    </linearGradient>
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#001a05" flood-opacity="0.45"/>
    </filter>
  </defs>
  <!-- Outer Water Ripple Shadow -->
  <ellipse cx="150" cy="140" rx="135" ry="32" fill="#032b13" opacity="0.35" filter="url(#softShadow)"/>
  
  <!-- Outer Leaf Petals (Back Layer) -->
  <g id="outerPetals">
    <!-- Far Left -->
    <path d="M 30,120 C 15,100 20,70 50,75 C 65,88 60,118 30,120 Z" fill="url(#petalGrad1)"/>
    <path d="M 60,110 C 45,80 55,50 90,60 C 100,75 90,115 60,110 Z" fill="url(#petalGrad1)"/>
    <!-- Left Mid -->
    <path d="M 95,100 C 85,65 105,38 135,50 C 140,70 125,108 95,100 Z" fill="url(#petalGrad1)"/>
    <!-- Center Left -->
    <path d="M 125,95 C 120,55 140,28 160,40 C 168,60 155,102 125,95 Z" fill="url(#petalGrad1)"/>
    <!-- Center Right -->
    <path d="M 175,95 C 180,55 160,28 140,40 C 132,60 145,102 175,95 Z" fill="url(#petalGrad1)"/>
    <!-- Right Mid -->
    <path d="M 205,100 C 215,65 195,38 165,50 C 160,70 175,108 205,100 Z" fill="url(#petalGrad1)"/>
    <!-- Far Right -->
    <path d="M 240,110 C 255,80 245,50 210,60 C 200,75 210,115 240,110 Z" fill="url(#petalGrad1)"/>
    <path d="M 270,120 C 285,100 280,70 250,75 C 235,88 240,118 270,120 Z" fill="url(#petalGrad1)"/>
  </g>

  <!-- Banana Trunk Slice Base -->
  <ellipse cx="150" cy="120" rx="120" ry="38" fill="url(#bananaStem)" stroke="#33691e" stroke-width="2"/>
  <ellipse cx="150" cy="116" rx="112" ry="33" fill="url(#leafGlow)"/>
  
  <!-- Rings of trunk texture -->
  <ellipse cx="150" cy="116" rx="90" ry="24" fill="none" stroke="#689f38" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.7"/>
  <ellipse cx="150" cy="116" rx="65" ry="16" fill="none" stroke="#558b2f" stroke-width="1.5" stroke-dasharray="3,2" opacity="0.6"/>

  <!-- Inner Folded Petals (Fore Layer - กลีบกระทงผกาพับแหลม) -->
  <g id="innerPetals">
    <path d="M 40,125 Q 75,75 100,115 C 80,132 55,130 40,125 Z" fill="url(#petalGrad2)" stroke="#2e7d32" stroke-width="1"/>
    <path d="M 75,128 Q 110,70 135,118 C 115,136 90,134 75,128 Z" fill="url(#petalGrad2)" stroke="#2e7d32" stroke-width="1"/>
    <path d="M 115,130 Q 150,68 175,120 C 155,138 130,136 115,130 Z" fill="url(#petalGrad2)" stroke="#2e7d32" stroke-width="1"/>
    <path d="M 165,130 Q 190,70 225,128 C 210,134 185,136 165,130 Z" fill="url(#petalGrad2)" stroke="#2e7d32" stroke-width="1"/>
    <path d="M 200,125 Q 225,75 260,125 C 245,130 220,132 200,125 Z" fill="url(#petalGrad2)" stroke="#2e7d32" stroke-width="1"/>
  </g>

  <!-- Gold/Red ribbon pin accents -->
  <circle cx="95" cy="120" r="3" fill="#ffb300" stroke="#ff6f00" stroke-width="1"/>
  <circle cx="150" cy="123" r="3.5" fill="#ffb300" stroke="#ff6f00" stroke-width="1"/>
  <circle cx="205" cy="120" r="3" fill="#ffb300" stroke="#ff6f00" stroke-width="1"/>
</svg>`
    },
    {
      id: 'base_darathong',
      name: 'กระทงขนมดาราทอง (ทองเอกกระจัง)',
      description: 'ขนมไทยชาววังทรงมงกุฎทองคำ กลีบกระจังเมล็ดแตงโมเคลือบทองคำเปลวบริสุทธิ์ สง่างามล้ำค่า',
      tag: 'สิริมงคลชั้นสูง',
      color: '#ffa000',
      svg: `<svg viewBox="0 0 300 180" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="goldCrownGrad" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#fff9c4"/>
      <stop offset="35%" stop-color="#ffd54f"/>
      <stop offset="70%" stop-color="#ffb300"/>
      <stop offset="100%" stop-color="#e65100"/>
    </radialGradient>
    <linearGradient id="pastryBase" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffe082"/>
      <stop offset="60%" stop-color="#ffb74d"/>
      <stop offset="100%" stop-color="#b26a00"/>
    </linearGradient>
    <linearGradient id="seedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="40%" stop-color="#fff176"/>
      <stop offset="100%" stop-color="#f57f17"/>
    </linearGradient>
  </defs>
  <!-- Water Shadow -->
  <ellipse cx="150" cy="142" rx="130" ry="30" fill="#3e2723" opacity="0.35"/>
  
  <!-- Outer Melon Seed Petals (กลีบกระจังเมล็ดแตงโม) -->
  <g id="crownSpikes">
    <path d="M 45,115 C 30,85 45,55 75,70 C 85,85 70,115 45,115 Z" fill="url(#seedGrad)" stroke="#e65100" stroke-width="1"/>
    <path d="M 80,105 C 70,70 95,40 120,60 C 125,80 105,112 80,105 Z" fill="url(#seedGrad)" stroke="#e65100" stroke-width="1"/>
    <path d="M 125,95 C 120,50 150,25 165,50 C 165,75 145,105 125,95 Z" fill="url(#seedGrad)" stroke="#e65100" stroke-width="1.2"/>
    <path d="M 175,95 C 180,50 150,25 135,50 C 135,75 155,105 175,95 Z" fill="url(#seedGrad)" stroke="#e65100" stroke-width="1.2"/>
    <path d="M 220,105 C 230,70 205,40 180,60 C 175,80 195,112 220,105 Z" fill="url(#seedGrad)" stroke="#e65100" stroke-width="1"/>
    <path d="M 255,115 C 270,85 255,55 225,70 C 215,85 230,115 255,115 Z" fill="url(#seedGrad)" stroke="#e65100" stroke-width="1"/>
  </g>

  <!-- Golden Pastry Bottom Tart Base -->
  <ellipse cx="150" cy="122" rx="118" ry="36" fill="url(#pastryBase)" stroke="#e65100" stroke-width="2"/>
  <ellipse cx="150" cy="116" rx="108" ry="30" fill="url(#goldCrownGrad)"/>

  <!-- Golden Dome / Crown Center (ทองเอกลูกยอด) -->
  <ellipse cx="150" cy="108" rx="65" ry="22" fill="#ffe082"/>
  <path d="M 105,105 Q 150,55 195,105 C 180,118 120,118 105,105 Z" fill="url(#goldCrownGrad)" stroke="#ff8f00" stroke-width="1.5"/>

  <!-- Melon Seeds embedded around central dome -->
  <ellipse cx="120" cy="108" rx="7" ry="12" transform="rotate(-25 120 108)" fill="url(#seedGrad)" stroke="#e65100" stroke-width="0.8"/>
  <ellipse cx="138" cy="112" rx="7" ry="12" transform="rotate(-8 138 112)" fill="url(#seedGrad)" stroke="#e65100" stroke-width="0.8"/>
  <ellipse cx="162" cy="112" rx="7" ry="12" transform="rotate(8 162 112)" fill="url(#seedGrad)" stroke="#e65100" stroke-width="0.8"/>
  <ellipse cx="180" cy="108" rx="7" ry="12" transform="rotate(25 180 108)" fill="url(#seedGrad)" stroke="#e65100" stroke-width="0.8"/>

  <!-- Edible Gold Leaf on Top Crown Peak -->
  <polygon points="150,68 153,74 159,75 154,79 156,85 150,81 144,85 146,79 141,75 147,74" fill="#ffffff" opacity="0.95"/>
  <circle cx="150" cy="72" r="6" fill="#fff9c4" opacity="0.8"/>
</svg>`
    },
    {
      id: 'base_kanom_ko',
      name: 'กระทงขนมโคักษาสวรรค์',
      description: 'ขนมโคปักษ์ใต้หลากสีสัน (ใบเตย, อัญชัน, ฟักทอง, กะทิ) สอดไส้น้ำตาลแว่น คลุกมะพร้าวทึนทึกหอมมัน',
      tag: 'สีสันสดใสชวนชิม',
      color: '#ab47bc',
      svg: `<svg viewBox="0 0 300 180" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="koPurple" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#e1bee7"/>
      <stop offset="60%" stop-color="#ab47bc"/>
      <stop offset="100%" stop-color="#4a148c"/>
    </radialGradient>
    <radialGradient id="koGreen" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#c8e6c9"/>
      <stop offset="60%" stop-color="#66bb6a"/>
      <stop offset="100%" stop-color="#1b5e20"/>
    </radialGradient>
    <radialGradient id="koYellow" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#fff9c4"/>
      <stop offset="60%" stop-color="#fbc02d"/>
      <stop offset="100%" stop-color="#f57f17"/>
    </radialGradient>
    <radialGradient id="koWhite" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="70%" stop-color="#f5f5f5"/>
      <stop offset="100%" stop-color="#b0bec5"/>
    </radialGradient>
    <radialGradient id="koPink" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#f8bbd0"/>
      <stop offset="60%" stop-color="#ec407a"/>
      <stop offset="100%" stop-color="#880e4f"/>
    </radialGradient>
    <linearGradient id="basketWood" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#8d6e63"/>
      <stop offset="50%" stop-color="#5d4037"/>
      <stop offset="100%" stop-color="#3e2723"/>
    </linearGradient>
  </defs>
  <!-- Water shadow -->
  <ellipse cx="150" cy="142" rx="128" ry="30" fill="#1b120c" opacity="0.35"/>

  <!-- Banana Leaf Tray Rim Base -->
  <ellipse cx="150" cy="122" rx="122" ry="36" fill="url(#basketWood)"/>
  <ellipse cx="150" cy="118" rx="116" ry="32" fill="#33691e"/>
  <ellipse cx="150" cy="116" rx="110" ry="28" fill="#558b2f"/>

  <!-- Grated Coconut Bed (มะพร้าวขูดฝอย) -->
  <ellipse cx="150" cy="114" rx="102" ry="24" fill="#fafafa"/>
  <path d="M 60,114 Q 90,122 150,120 Q 210,122 240,114 Q 210,105 150,107 Q 90,105 60,114 Z" fill="#eeeeee" stroke="#ffffff" stroke-width="2" stroke-dasharray="3,2"/>

  <!-- Colorful Kanom Ko Sweet Glutinous Balls -->
  <!-- Layer 1: Back row -->
  <circle cx="85" cy="100" r="18" fill="url(#koGreen)" stroke="#ffffff" stroke-width="1.5"/>
  <circle cx="120" cy="95" r="19" fill="url(#koPurple)" stroke="#ffffff" stroke-width="1.5"/>
  <circle cx="155" cy="94" r="19" fill="url(#koYellow)" stroke="#ffffff" stroke-width="1.5"/>
  <circle cx="190" cy="96" r="18" fill="url(#koPink)" stroke="#ffffff" stroke-width="1.5"/>
  <circle cx="220" cy="102" r="17" fill="url(#koWhite)" stroke="#cfd8dc" stroke-width="1.5"/>

  <!-- Layer 2: Front row -->
  <circle cx="68" cy="112" r="16" fill="url(#koYellow)" stroke="#ffffff" stroke-width="1.5"/>
  <circle cx="102" cy="112" r="18" fill="url(#koWhite)" stroke="#cfd8dc" stroke-width="1.5"/>
  <circle cx="138" cy="113" r="19" fill="url(#koPink)" stroke="#ffffff" stroke-width="1.5"/>
  <circle cx="174" cy="113" r="19" fill="url(#koGreen)" stroke="#ffffff" stroke-width="1.5"/>
  <circle cx="208" cy="112" r="17" fill="url(#koPurple)" stroke="#ffffff" stroke-width="1.5"/>
  <circle cx="236" cy="114" r="15" fill="url(#koYellow)" stroke="#ffffff" stroke-width="1.5"/>

  <!-- Coconut shreds on top of sweet balls -->
  <path d="M 98,108 Q 104,104 110,108" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M 134,110 Q 140,105 145,110" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M 170,109 Q 176,105 182,109" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M 116,92 Q 122,88 128,92" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
  <path d="M 152,90 Q 158,86 163,90" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
  
  <!-- Toasted sesame seeds sprinkles -->
  <ellipse cx="100" cy="115" rx="1.5" ry="3" fill="#3e2723" transform="rotate(25 100 115)"/>
  <ellipse cx="140" cy="116" rx="1.5" ry="3" fill="#3e2723" transform="rotate(-20 140 116)"/>
  <ellipse cx="175" cy="115" rx="1.5" ry="3" fill="#3e2723" transform="rotate(35 175 115)"/>
  <ellipse cx="205" cy="114" rx="1.5" ry="3" fill="#3e2723" transform="rotate(-15 205 114)"/>
</svg>`
    },
    {
      id: 'base_khao_jee',
      name: 'กระทงข้าวจี่ชุบไข่',
      description: 'ข้าวจี่อีสานปิ้งเตาถ่านหอมกรุ่น ชุบไข่ไก่สีทองอร่าม โรยงาขาวงาดำ เกรียมกำลังดี อบอุ่นหัวใจ',
      tag: 'กลิ่นหอมกรุ่นเตาถ่าน',
      color: '#f57c00',
      svg: `<svg viewBox="0 0 300 180" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="khaoJeeEgg" cx="45%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#fff59d"/>
      <stop offset="45%" stop-color="#ffb74d"/>
      <stop offset="80%" stop-color="#f57c00"/>
      <stop offset="100%" stop-color="#bf360c"/>
    </radialGradient>
    <linearGradient id="charcoalLeaf" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#558b2f"/>
      <stop offset="50%" stop-color="#33691e"/>
      <stop offset="100%" stop-color="#1b5e20"/>
    </linearGradient>
  </defs>
  <!-- Water shadow -->
  <ellipse cx="150" cy="142" rx="130" ry="30" fill="#2d1600" opacity="0.35"/>

  <!-- Banana Leaf Underpad (ใบตองรองก้นกระทง) -->
  <path d="M 35,130 Q 80,100 150,105 Q 220,100 265,130 C 235,155 65,155 35,130 Z" fill="url(#charcoalLeaf)" stroke="#2e7d32" stroke-width="1.5"/>

  <!-- Giant Khao Jee Rice Patty (ข้าวจี่แผ่นใหญ่ทรงกลมหนานุ่ม) -->
  <ellipse cx="150" cy="122" rx="115" ry="38" fill="#d7ccc8"/>
  <ellipse cx="150" cy="116" rx="108" ry="32" fill="url(#khaoJeeEgg)" stroke="#e65100" stroke-width="2"/>

  <!-- Rice grain texture dots -->
  <g fill="#ffe082" opacity="0.7">
    <circle cx="90" cy="115" r="3"/><circle cx="105" cy="120" r="3"/><circle cx="125" cy="112" r="3"/>
    <circle cx="145" cy="122" r="3"/><circle cx="170" cy="118" r="3"/><circle cx="195" cy="114" r="3"/>
    <circle cx="210" cy="120" r="3"/><circle cx="130" cy="125" r="3"/><circle cx="160" cy="126" r="3"/>
  </g>

  <!-- Charcoal Grill Toast Marks (รอยเกรียมปิ้งเตาถ่านหอมๆ) -->
  <path d="M 65,110 Q 150,118 235,110" fill="none" stroke="#4e342e" stroke-width="3" stroke-linecap="round" opacity="0.75"/>
  <path d="M 85,120 Q 150,128 215,120" fill="none" stroke="#3e2723" stroke-width="3.5" stroke-linecap="round" opacity="0.8"/>
  <path d="M 110,128 Q 150,134 190,128" fill="none" stroke="#4e342e" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>

  <!-- Grilled brown crispy spots -->
  <ellipse cx="115" cy="112" rx="12" ry="5" fill="#5d4037" opacity="0.6"/>
  <ellipse cx="180" cy="114" rx="14" ry="6" fill="#4e342e" opacity="0.65"/>
  <ellipse cx="148" cy="118" rx="16" ry="7" fill="#6d4c41" opacity="0.55"/>

  <!-- Egg yolk glazed gloss shine (ความฉ่ำของไข่ไก่) -->
  <path d="M 100,106 Q 150,100 200,106" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.6"/>

  <!-- Chili & cilantro garnish touch -->
  <path d="M 145,110 Q 155,106 160,112" fill="none" stroke="#d32f2f" stroke-width="2" stroke-linecap="round"/>
</svg>`
    },
    {
      id: 'base_khao_tan',
      name: 'กระทงข้าวแต๋นน้ำแตงโม',
      description: 'ข้าวแต๋นกรอบพองฟูสูตรล้านนา ราดน้ำอ้อยเคี่ยวรสหวานกลมกล่อมเป็นลวดลายก้นหอยนำโชค',
      tag: 'หวานฉ่ำกรุบกรอบ',
      color: '#d84315',
      svg: `<svg viewBox="0 0 300 180" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="khaoTanRice" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#fff8e1"/>
      <stop offset="50%" stop-color="#ffe082"/>
      <stop offset="85%" stop-color="#ffb74d"/>
      <stop offset="100%" stop-color="#d7ccc8"/>
    </radialGradient>
    <linearGradient id="caneSugarGlaze" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffcc80"/>
      <stop offset="35%" stop-color="#d84315"/>
      <stop offset="80%" stop-color="#4e342e"/>
      <stop offset="100%" stop-color="#2d1600"/>
    </linearGradient>
  </defs>
  <!-- Water shadow -->
  <ellipse cx="150" cy="142" rx="130" ry="30" fill="#2d1600" opacity="0.35"/>

  <!-- Crispy Puffed Rice Disc Border (รวงข้าวพองกรอบหยักๆ) -->
  <g stroke="#ffb74d" stroke-width="1.5" fill="url(#khaoTanRice)">
    <ellipse cx="150" cy="120" rx="116" ry="36"/>
    <!-- Puffed rice bumpy edges -->
    <circle cx="45" cy="122" r="8" fill="#ffe082"/>
    <circle cx="60" cy="132" r="9" fill="#ffcc80"/>
    <circle cx="85" cy="142" r="10" fill="#ffe082"/>
    <circle cx="115" cy="146" r="11" fill="#ffd54f"/>
    <circle cx="150" cy="148" r="11" fill="#ffe082"/>
    <circle cx="185" cy="146" r="11" fill="#ffd54f"/>
    <circle cx="215" cy="142" r="10" fill="#ffe082"/>
    <circle cx="240" cy="132" r="9" fill="#ffcc80"/>
    <circle cx="255" cy="122" r="8" fill="#ffe082"/>
  </g>

  <!-- Rice cracker inner surface with thousands of crispy puffed bubbles -->
  <ellipse cx="150" cy="116" rx="100" ry="28" fill="url(#khaoTanRice)"/>
  
  <!-- Caramelized Sugarcane Syrup Swirl (น้ำอ้อยหยอดวนเป็นลายก้นหอยนำโชค) -->
  <g fill="none" stroke="url(#caneSugarGlaze)" stroke-linecap="round" stroke-linejoin="round">
    <path d="M 150,116 
             C 140,114 135,118 140,121 
             C 152,126 168,118 165,110 
             C 160,98 125,102 118,118 
             C 112,130 175,134 190,116 
             C 200,102 110,95 95,116
             C 85,132 205,138 220,114" 
          stroke-width="7"/>
    <!-- Glossy Sugar Highlight Reflection -->
    <path d="M 148,115 
             C 140,113 136,117 141,120 
             C 151,124 165,117 163,111 
             C 159,101 127,104 121,118 
             C 116,128 172,132 186,116" 
          stroke="#ffffff" stroke-width="2" opacity="0.65"/>
  </g>

  <!-- Toasted white sesame sprinkle on top -->
  <g fill="#ffffff" stroke="#ffcc80" stroke-width="0.5">
    <ellipse cx="135" cy="115" rx="3" ry="1.5" transform="rotate(-30 135 115)"/>
    <ellipse cx="158" cy="112" rx="3" ry="1.5" transform="rotate(40 158 112)"/>
    <ellipse cx="170" cy="122" rx="3" ry="1.5" transform="rotate(15 170 122)"/>
    <ellipse cx="115" cy="120" rx="3" ry="1.5" transform="rotate(-45 115 120)"/>
    <ellipse cx="185" cy="116" rx="3" ry="1.5" transform="rotate(60 185 116)"/>
    <ellipse cx="145" cy="125" rx="3" ry="1.5" transform="rotate(10 145 125)"/>
  </g>
</svg>`
    },
    {
      id: 'base_kanom_chan',
      name: 'กระทงขนมชั้นมงคล ๙ ชั้น',
      description: 'ขนมชั้นใบเตยหอมและกุหลาบ นุ่มหนึบละมุนลิ้น เรียงซ้อนชั้นเป็นดอกบัวบาน สื่อถึงความเจริญก้าวหน้า',
      tag: 'เจริญก้าวหน้า ๙ เท่า',
      color: '#e91e63',
      svg: `<svg viewBox="0 0 300 180" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="chanPinkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f8bbd0"/>
      <stop offset="40%" stop-color="#f06292"/>
      <stop offset="100%" stop-color="#c2185b"/>
    </linearGradient>
    <linearGradient id="chanGreenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#dcedc8"/>
      <stop offset="40%" stop-color="#81c784"/>
      <stop offset="100%" stop-color="#2e7d32"/>
    </linearGradient>
    <linearGradient id="chanWhiteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="60%" stop-color="#f5f5f5"/>
      <stop offset="100%" stop-color="#e0e0e0"/>
    </linearGradient>
  </defs>
  <!-- Water shadow -->
  <ellipse cx="150" cy="142" rx="128" ry="30" fill="#3a1020" opacity="0.35"/>

  <!-- Tier 1: Outer Layer Base (Green Pandan Petals) -->
  <g id="layer1Green">
    <path d="M 40,118 Q 70,75 105,108 C 85,128 55,126 40,118 Z" fill="url(#chanGreenGrad)"/>
    <path d="M 80,122 Q 115,70 145,110 C 125,130 95,128 80,122 Z" fill="url(#chanGreenGrad)"/>
    <path d="M 125,124 Q 155,68 185,112 C 165,132 140,130 125,124 Z" fill="url(#chanGreenGrad)"/>
    <path d="M 160,122 Q 190,70 225,118 C 210,128 180,130 160,122 Z" fill="url(#chanGreenGrad)"/>
    <path d="M 200,116 Q 230,75 260,116 C 245,126 215,126 200,116 Z" fill="url(#chanGreenGrad)"/>
  </g>

  <!-- Tier 2: Mid Coconut Milk White Translucent Layer -->
  <ellipse cx="150" cy="120" rx="114" ry="34" fill="url(#chanWhiteGrad)" opacity="0.95"/>

  <!-- Tier 3: Rose Pink Petals (Rose water & Butterfly Pea Layer) -->
  <g id="layer2Pink">
    <path d="M 55,120 Q 85,82 118,114 C 100,130 70,128 55,120 Z" fill="url(#chanPinkGrad)"/>
    <path d="M 95,123 Q 130,78 158,116 C 138,132 112,130 95,123 Z" fill="url(#chanPinkGrad)"/>
    <path d="M 142,123 Q 170,78 205,116 C 188,132 160,130 142,123 Z" fill="url(#chanPinkGrad)"/>
    <path d="M 185,118 Q 215,82 245,118 C 230,128 200,128 185,118 Z" fill="url(#chanPinkGrad)"/>
  </g>

  <!-- Tier 4: Inner White & Green Heart Core (ใจกลางขนมชั้น) -->
  <ellipse cx="150" cy="116" rx="90" ry="24" fill="url(#chanWhiteGrad)"/>
  <ellipse cx="150" cy="114" rx="72" ry="18" fill="url(#chanGreenGrad)"/>
  <ellipse cx="150" cy="112" rx="52" ry="13" fill="url(#chanPinkGrad)"/>

  <!-- Glossy oily sugar reflection (ความเงาวาวของผิวน้ำมันมะพร้าว) -->
  <ellipse cx="140" cy="110" rx="35" ry="6" fill="#ffffff" opacity="0.55"/>
  <circle cx="170" cy="112" r="3" fill="#ffffff" opacity="0.7"/>
</svg>`
    }
  ],

  flowers: [
    {
      id: 'flower_marigold',
      name: 'ดอกดาวเรือง',
      meaning: 'สัญลักษณ์แห่งความเจริญรุ่งเรือง รุ่งโรจน์ โชคลาภ มั่งคั่งเงินทอง สว่างไสวดั่งแสงทอง',
      wishTemplate: 'ขออัญเชิญบารมีพระแม่คงคา บันดาลให้ชีวิตสว่างไสวดุจดาวเรือง การงานรุ่งโรจน์ การเงินมั่งคั่งไหลมาเทมา สุขภาพแข็งแรงไร้โรคาพยาธิ',
      color: '#ffc107',
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="marigoldGrad" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="#fff59d"/>
      <stop offset="35%" stop-color="#ffca28"/>
      <stop offset="70%" stop-color="#ff9800"/>
      <stop offset="100%" stop-color="#e65100"/>
    </radialGradient>
  </defs>
  <!-- Green Calyx -->
  <ellipse cx="50" cy="62" rx="20" ry="12" fill="#33691e"/>
  <path d="M 45,65 Q 50,85 52,95" stroke="#2e7d32" stroke-width="4" fill="none" stroke-linecap="round"/>
  
  <!-- Outer Pompom Petals (Ruffled Marigold Bloom) -->
  <g fill="url(#marigoldGrad)" stroke="#ff8f00" stroke-width="0.7">
    <!-- Outer ring of petals -->
    <circle cx="50" cy="46" r="34"/>
    <circle cx="28" cy="46" r="14"/><circle cx="72" cy="46" r="14"/>
    <circle cx="50" cy="24" r="14"/><circle cx="50" cy="68" r="14"/>
    <circle cx="34" cy="30" r="14"/><circle cx="66" cy="30" r="14"/>
    <circle cx="34" cy="62" r="14"/><circle cx="66" cy="62" r="14"/>
    <!-- Middle ring -->
    <circle cx="40" cy="40" r="12"/><circle cx="60" cy="40" r="12"/>
    <circle cx="40" cy="52" r="12"/><circle cx="60" cy="52" r="12"/>
    <!-- Core frills -->
    <circle cx="50" cy="46" r="15" fill="#ffe082"/>
    <circle cx="47" cy="44" r="8" fill="#fff59d"/>
  </g>
</svg>`
    },
    {
      id: 'flower_amaranth',
      name: 'ดอกบานไม่รู้โรย',
      meaning: 'สัญลักษณ์แห่งความรักที่มั่นคง ยั่งยืน ซื่อสัตย์ ไม่จืดจาง หรือโรยราไปตามกาลเวลา',
      wishTemplate: 'ขอให้ความรักและความผูกพันในครอบครัว มั่นคง ยืนยาวดั่งดอกบานไม่รู้โรย ไม่พลัดพรากจากกัน พบเจอแต่มิตรแท้ที่ดีตลอดไป',
      color: '#d81b60',
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="amaranthGrad" cx="45%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#f48fb1"/>
      <stop offset="40%" stop-color="#d81b60"/>
      <stop offset="85%" stop-color="#880e4f"/>
      <stop offset="100%" stop-color="#4a0072"/>
    </radialGradient>
  </defs>
  <!-- Green Leaf Base -->
  <path d="M 50,68 C 30,78 20,60 38,55 Z" fill="#43a047"/>
  <path d="M 50,68 C 70,78 80,60 62,55 Z" fill="#2e7d32"/>
  <path d="M 50,65 Q 50,85 50,92" stroke="#2e7d32" stroke-width="3" fill="none"/>
  
  <!-- Globe Amaranth Cone Head -->
  <ellipse cx="50" cy="45" rx="26" ry="30" fill="url(#amaranthGrad)"/>
  <!-- Scaly floret bracts texture -->
  <g fill="#f06292" opacity="0.8">
    <ellipse cx="40" cy="30" rx="4" ry="3"/><ellipse cx="50" cy="25" rx="4" ry="3"/><ellipse cx="60" cy="30" rx="4" ry="3"/>
    <ellipse cx="34" cy="42" rx="4" ry="3"/><ellipse cx="46" cy="38" rx="5" ry="3"/><ellipse cx="58" cy="40" rx="5" ry="3"/><ellipse cx="66" cy="44" rx="4" ry="3"/>
    <ellipse cx="38" cy="54" rx="4" ry="3"/><ellipse cx="50" cy="50" rx="5" ry="3"/><ellipse cx="62" cy="54" rx="4" ry="3"/>
    <ellipse cx="48" cy="62" rx="4" ry="2"/>
  </g>
</svg>`
    },
    {
      id: 'flower_orchid',
      name: 'ดอกกล้วยไม้',
      meaning: 'สัญลักษณ์แห่งความสง่างาม ความสำเร็จอันประณีต ปัญญาเฉียบแหลม และมิตรภาพที่บริสุทธิ์',
      wishTemplate: 'ขอให้ชีวิตงดงามสง่าดั่งกล้วยไม้ ประสบความสำเร็จในหน้าที่การงาน มีสติปัญญาหลักแหลม มีผู้ใหญ่เมตตาอุปถัมภ์ค้ำชู',
      color: '#9c27b0',
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="orchidPetal" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="45%" stop-color="#e1bee7"/>
      <stop offset="85%" stop-color="#ab47bc"/>
      <stop offset="100%" stop-color="#6a1b9a"/>
    </radialGradient>
    <radialGradient id="orchidLip" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff59d"/>
      <stop offset="50%" stop-color="#ffb300"/>
      <stop offset="100%" stop-color="#d81b60"/>
    </radialGradient>
  </defs>
  <!-- 3 Sepals (Back Layer) -->
  <ellipse cx="50" cy="22" rx="12" ry="20" fill="url(#orchidPetal)"/>
  <ellipse cx="24" cy="64" rx="12" ry="20" transform="rotate(-40 24 64)" fill="url(#orchidPetal)"/>
  <ellipse cx="76" cy="64" rx="12" ry="20" transform="rotate(40 76 64)" fill="url(#orchidPetal)"/>

  <!-- 2 Large Upper Petals -->
  <ellipse cx="28" cy="38" rx="22" ry="16" transform="rotate(-20 28 38)" fill="url(#orchidPetal)"/>
  <ellipse cx="72" cy="38" rx="22" ry="16" transform="rotate(20 72 38)" fill="url(#orchidPetal)"/>

  <!-- Orchid Center Lip (ปากกล้วยไม้) -->
  <path d="M 40,55 C 30,75 50,86 50,86 C 50,86 70,75 60,55 Z" fill="url(#orchidLip)" stroke="#c2185b" stroke-width="1"/>
  <ellipse cx="50" cy="52" rx="6" ry="6" fill="#ffd54f"/>
  <circle cx="50" cy="50" r="2.5" fill="#ffffff"/>
</svg>`
    },
    {
      id: 'flower_crown',
      name: 'ดอกรักสีขาวบริสุทธิ์',
      meaning: 'สัญลักษณ์แห่งความรักอันบริสุทธิ์ เมตตามหานิยม ความรักใคร่เสน่หา และความจริงใจ',
      wishTemplate: 'ขอขมาพระแม่คงคา น้อมจิตตั้งมั่น ขอให้ชีวิตพบเจอแต่ความรักที่บริสุทธิ์ใจ มีเสน่ห์เมตตามหานิยม ผู้คนรักใคร่เอ็นดู',
      color: '#e0f2f1',
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="crownGrad" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="60%" stop-color="#e0f2f1"/>
      <stop offset="85%" stop-color="#b2dfdb"/>
      <stop offset="100%" stop-color="#80cbc4"/>
    </radialGradient>
  </defs>
  <!-- 5 Outer Star Points -->
  <g fill="url(#crownGrad)" stroke="#80cbc4" stroke-width="0.8">
    <path d="M 50,15 L 56,38 L 78,38 L 60,52 L 68,75 L 50,60 L 32,75 L 40,52 L 22,38 L 44,38 Z"/>
  </g>
  <!-- Center Star Petal Crown Corona (มงกุฎดอกรัก) -->
  <polygon points="50,30 55,42 67,42 57,50 61,62 50,54 39,62 43,50 33,42 45,42" fill="#ffffff" stroke="#b2dfdb" stroke-width="1"/>
  <!-- Central purple/lavender dot -->
  <circle cx="50" cy="48" r="4" fill="#ce93d8"/>
  <circle cx="50" cy="48" r="2" fill="#8e24aa"/>
</svg>`
    },
    {
      id: 'flower_ixora',
      name: 'ดอกเข็มสีแดงมงคล',
      meaning: 'สัญลักษณ์แห่งสติปัญญาเฉียบแหลม ความคิดสร้างสรรค์ ความฉลาดรอบรู้ และการเอาตัวรอด',
      wishTemplate: 'ขอให้ลูกช้างมีสติปัญญาเฉียบแหลมดุจดอกเข็ม คิดอ่านสิ่งใดทะลุปรุโปร่ง ผ่านพ้นทุกอุปสรรคได้อย่างชาญฉลาด มีชัยชนะเหนือศัตรูหมู่มาร',
      color: '#f44336',
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="ixoraPetal" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ff8a80"/>
      <stop offset="50%" stop-color="#f44336"/>
      <stop offset="100%" stop-color="#b71c1c"/>
    </radialGradient>
  </defs>
  <!-- Green Stem & Calyx -->
  <path d="M 50,65 Q 50,85 50,95" stroke="#33691e" stroke-width="3" fill="none"/>
  
  <!-- Cluster of Ixora Florets (ช่อดอกเข็ม 5 ดอกรวมกัน) -->
  <!-- Floret 1: Top Center -->
  <g transform="translate(50, 32)">
    <circle cx="0" cy="0" r="2" fill="#ffd54f"/>
    <ellipse cx="0" cy="-12" rx="4" ry="7" fill="url(#ixoraPetal)"/>
    <ellipse cx="0" cy="12" rx="4" ry="7" fill="url(#ixoraPetal)"/>
    <ellipse cx="-12" cy="0" rx="7" ry="4" fill="url(#ixoraPetal)"/>
    <ellipse cx="12" cy="0" rx="7" ry="4" fill="url(#ixoraPetal)"/>
  </g>
  <!-- Floret 2: Left -->
  <g transform="translate(30, 48)">
    <circle cx="0" cy="0" r="1.8" fill="#ffd54f"/>
    <ellipse cx="0" cy="-10" rx="3.5" ry="6" fill="url(#ixoraPetal)"/>
    <ellipse cx="0" cy="10" rx="3.5" ry="6" fill="url(#ixoraPetal)"/>
    <ellipse cx="-10" cy="0" rx="6" ry="3.5" fill="url(#ixoraPetal)"/>
    <ellipse cx="10" cy="0" rx="6" ry="3.5" fill="url(#ixoraPetal)"/>
  </g>
  <!-- Floret 3: Right -->
  <g transform="translate(70, 48)">
    <circle cx="0" cy="0" r="1.8" fill="#ffd54f"/>
    <ellipse cx="0" cy="-10" rx="3.5" ry="6" fill="url(#ixoraPetal)"/>
    <ellipse cx="0" cy="10" rx="3.5" ry="6" fill="url(#ixoraPetal)"/>
    <ellipse cx="-10" cy="0" rx="6" ry="3.5" fill="url(#ixoraPetal)"/>
    <ellipse cx="10" cy="0" rx="6" ry="3.5" fill="url(#ixoraPetal)"/>
  </g>
  <!-- Floret 4: Center-Bottom -->
  <g transform="translate(50, 60)">
    <circle cx="0" cy="0" r="2" fill="#ffd54f"/>
    <ellipse cx="0" cy="-11" rx="4" ry="6.5" fill="url(#ixoraPetal)"/>
    <ellipse cx="0" cy="11" rx="4" ry="6.5" fill="url(#ixoraPetal)"/>
    <ellipse cx="-11" cy="0" rx="6.5" ry="4" fill="url(#ixoraPetal)"/>
    <ellipse cx="11" cy="0" rx="6.5" ry="4" fill="url(#ixoraPetal)"/>
  </g>
</svg>`
    }
  ],

  items: [
    {
      id: 'item_incense_candle',
      name: 'ธูป ๓ ดอก & เทียนส่องสว่าง',
      description: 'ธูปหอมบูชาพระพุทธ พระธรรม พระสงฆ์ พร้อมเทียนนำทางชีวิตให้สว่างไสว',
      tag: 'ต้องมีบนกระทง',
      color: '#ff9800',
      svg: `<svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="candleFlame" cx="50%" cy="80%" r="70%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="25%" stop-color="#fff59d"/>
      <stop offset="60%" stop-color="#ffb300"/>
      <stop offset="85%" stop-color="#ff3d00"/>
      <stop offset="100%" stop-color="#d50000"/>
    </radialGradient>
    <radialGradient id="flameGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffea00" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#ff9100" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#ff3d00" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="candleWax" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fff9c4"/>
      <stop offset="50%" stop-color="#ffd54f"/>
      <stop offset="100%" stop-color="#ff8f00"/>
    </linearGradient>
  </defs>
  
  <!-- 3 Joss Sticks (Incense) Behind Candle -->
  <!-- Stick 1 (Left) -->
  <line x1="28" y1="125" x2="35" y2="40" stroke="#8d6e63" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="35" y1="40" x2="38" y2="20" stroke="#d32f2f" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="38" cy="20" r="2.5" fill="#ff1744"/>
  <circle cx="38" cy="20" r="1.5" fill="#ffeb3b"/>
  <!-- Smoke wisp 1 -->
  <path d="M 38,18 Q 33,10 39,2" fill="none" stroke="#cfd8dc" stroke-width="1.2" opacity="0.6"/>

  <!-- Stick 2 (Right) -->
  <line x1="72" y1="125" x2="65" y2="40" stroke="#8d6e63" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="65" y1="40" x2="62" y2="20" stroke="#d32f2f" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="62" cy="20" r="2.5" fill="#ff1744"/>
  <circle cx="62" cy="20" r="1.5" fill="#ffeb3b"/>
  <!-- Smoke wisp 2 -->
  <path d="M 62,18 Q 67,10 61,2" fill="none" stroke="#cfd8dc" stroke-width="1.2" opacity="0.6"/>

  <!-- Stick 3 (Center) -->
  <line x1="50" y1="125" x2="50" y2="35" stroke="#8d6e63" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="50" y1="35" x2="50" y2="15" stroke="#d32f2f" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="50" cy="15" r="2.5" fill="#ff1744"/>
  <circle cx="50" cy="15" r="1.5" fill="#ffeb3b"/>
  <!-- Smoke wisp 3 -->
  <path d="M 50,13 Q 54,6 48,0" fill="none" stroke="#cfd8dc" stroke-width="1.2" opacity="0.6"/>

  <!-- Golden Candle Body -->
  <rect x="42" y="65" width="16" height="60" rx="3" fill="url(#candleWax)" stroke="#ff6f00" stroke-width="1"/>
  <!-- Candle wick -->
  <line x1="50" y1="65" x2="50" y2="52" stroke="#212121" stroke-width="2"/>
  
  <!-- Radiant Candle Flame Glow Halo -->
  <circle cx="50" cy="40" r="24" fill="url(#flameGlow)"/>

  <!-- Candle Flame Tear Shape -->
  <path d="M 50,22 C 43,36 43,48 50,52 C 57,48 57,36 50,22 Z" fill="url(#candleFlame)"/>
  <!-- Inner White-Hot Flame Core -->
  <path d="M 50,34 C 47,42 47,49 50,51 C 53,49 53,42 50,34 Z" fill="#ffffff" opacity="0.9"/>
</svg>`
    },
    {
      id: 'item_coin',
      name: 'เหรียญบาทนำโชค',
      description: 'ใส่เหรียญลงในกระทงตามความเชื่อโบราณ เพื่อเสริมดวงชะตา การเงินคล่องตัว มั่งคั่งร่ำรวย',
      tag: 'เสริมโชคลาภ',
      color: '#ffd54f',
      svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="coinGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#fff9c4"/>
      <stop offset="40%" stop-color="#ffd54f"/>
      <stop offset="75%" stop-color="#ffb300"/>
      <stop offset="100%" stop-color="#ff6f00"/>
    </radialGradient>
  </defs>
  <ellipse cx="40" cy="40" rx="35" ry="35" fill="#e65100"/>
  <ellipse cx="40" cy="40" rx="34" ry="34" fill="url(#coinGrad)"/>
  <ellipse cx="40" cy="40" rx="27" ry="27" fill="none" stroke="#e65100" stroke-width="1.5" stroke-dasharray="3,2"/>
  <text x="40" y="47" font-size="20" font-family="'Kanit', sans-serif" font-weight="bold" fill="#bf360c" text-anchor="middle">฿</text>
  <ellipse cx="32" cy="28" rx="8" ry="4" transform="rotate(-30 32 28)" fill="#ffffff" opacity="0.5"/>
</svg>`
    },
    {
      id: 'item_lotus_petal',
      name: 'กลีบบัวหลวงสีชมพู',
      description: 'กลีบดอกบัวบริสุทธิ์ น้อมสักการะพระแม่คงคา เพื่อจิตใจที่ผ่องแผ้ว สงบเย็น และมีสติ',
      tag: 'จิตใจผ่องใส',
      color: '#f06292',
      svg: `<svg viewBox="0 0 80 90" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="lotusPetalGrad" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="40%" stop-color="#f8bbd0"/>
      <stop offset="75%" stop-color="#ec407a"/>
      <stop offset="100%" stop-color="#880e4f"/>
    </radialGradient>
  </defs>
  <path d="M 40,8 C 15,35 18,72 40,84 C 62,72 65,35 40,8 Z" fill="url(#lotusPetalGrad)" stroke="#c2185b" stroke-width="1"/>
  <!-- Dew drop -->
  <circle cx="38" cy="50" r="4" fill="#ffffff" opacity="0.7"/>
  <circle cx="37" cy="49" r="1.5" fill="#ffffff"/>
</svg>`
    }
  ],

  // Default twilight river scenery
  defaultBackground: {
    id: 'bg_default_twilight',
    name: 'คืนวันเพ็ญวัดอรุณราชวราราม',
    description: 'ทิวทัศน์ริมแม่น้ำเจ้าพระยา พระจันทร์เต็มดวงสว่างนวล พระปรางค์วัดอรุณ และโคมลอยส่องสว่าง',
    waterlineHeight: 62, // in percent from top
    reflectionOpacity: 0.55
  }
};

// Helper function to convert any SVG string to a loaded Image object or Data URL
function svgToDataUrl(svgString) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
}

// Find asset by ID helper
function findAssetById(id) {
  for (const b of KRATHONG_ASSETS.bases) {
    if (b.id === id) return { ...b, type: 'base' };
  }
  for (const f of KRATHONG_ASSETS.flowers) {
    if (f.id === id) return { ...f, type: 'flower' };
  }
  for (const item of KRATHONG_ASSETS.items) {
    if (item.id === id) return { ...item, type: 'item' };
  }
  return null;
}
