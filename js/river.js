/**
 * river.js - Animated multi-layer river scene with perspective depth scaling,
 * water reflection, floating krathongs, speech bubble blessings, fireworks,
 * sky lanterns, and interactive clicks.
 */

class RiverScene {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Configuration
    this.waterlineHeight = options.waterlineHeight || 62; // in percent from top
    this.reflectionOpacity = options.reflectionOpacity || 0.45;
    this.currentBackground = null; // Image or preset
    this.onKrathongClick = options.onKrathongClick || null;
    this.onCountChange = options.onCountChange || null;

    // Simulation entities
    this.krathongs = []; // Active floating krathongs on screen
    this.allKrathongs = []; // All stored krathongs in database
    this.lanterns = []; // Sky lanterns
    this.fireworks = []; // Fireworks particles
    this.waterRipples = []; // Expanding ripples
    this.stars = []; // Twinkling stars

    // Animation loop state
    this.animId = null;
    this.lastTime = performance.now();
    this.dpr = window.devicePixelRatio || 1;
    this.isPaused = false;

    // Hit-testing / interaction
    this.hoveredKrathong = null;
    this.activeBubbleKrathong = null;

    // Image cache for krathong data URLs
    this.imageCache = new Map();

    // Init systems
    this.resize();
    this.initStars();
    this.initSkyLanterns();
    this.initEvents();
    this.startLoop();

    // Schedule ambient fireworks
    this.scheduleAmbientFireworks();
  }

  resize() {
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.scale(this.dpr, this.dpr);

    this.waterlineY = (this.height * this.waterlineHeight) / 100;
  }

  setWaterline(percent) {
    this.waterlineHeight = Math.max(30, Math.min(85, percent));
    this.waterlineY = (this.height * this.waterlineHeight) / 100;

    // อัปเดตตำแหน่ง Y ของกระทงที่มีอยู่เดิมทันที ไม่ให้ลอยหลุดขอบผิวน้ำใหม่
    const waterDepth = this.height - this.waterlineY;
    for (const k of this.krathongs) {
      let minR = 0.16, maxR = 0.38;
      if (k.depthTier === 1) { minR = 0.42; maxR = 0.68; }
      else if (k.depthTier === 2) { minR = 0.72; maxR = 0.88; }
      const newCalculatedY = this.waterlineY + waterDepth * ((minR + maxR) / 2);
      k.baseY = Math.max(this.waterlineY + 30, Math.min(this.height - 40, newCalculatedY));
      k.y = k.baseY;
    }
  }

  setReflectionOpacity(val) {
    this.reflectionOpacity = Math.max(0, Math.min(1, val));
  }

  setBackground(bgImageOrPreset) {
    this.currentBackground = bgImageOrPreset;
  }

  // --- SEED SAMPLE KRATHONGS IF DATABASE EMPTY ---
  static getSampleKrathongs() {
    return [
      {
        id: 'sample_1',
        name: 'น้องน้ำใส ใจดี',
        wish: 'ขอขมาพระแม่คงคา ขอให้ปีนี้การเรียนราบรื่น สอบติดคณะที่ฝัน ครอบครัวมีแต่รอยยิ้มและความสุขตลอดปีค่ะ',
        baseId: 'base_banana_leaf',
        timestamp: Date.now() - 1000 * 60 * 18,
        sampleImgKey: 'sample_leaf'
      },
      {
        id: 'sample_2',
        name: 'พี่ต้นกล้า มหาเฮง',
        wish: 'ขอให้ธุรกิจการงานเจริญรุ่งเรือง ค้าขายร่ำรวย เงินทองไหลมาเทมา สุขภาพแข็งแรง ไร้โรคภัยเบียดเบียนครับ',
        baseId: 'base_darathong',
        timestamp: Date.now() - 1000 * 60 * 42,
        sampleImgKey: 'sample_gold'
      },
      {
        id: 'sample_3',
        name: 'คุณยายมาลัย',
        wish: 'ขอให้ลูกหลานมีความสุข ความเจริญ สุขภาพร่างกายแข็งแรง สมปรารถนาในสิ่งดีงามทุกคนเทอญ',
        baseId: 'base_kanom_chan',
        timestamp: Date.now() - 1000 * 60 * 65,
        sampleImgKey: 'sample_chan'
      },
      {
        id: 'sample_4',
        name: 'คู่รักสายลม & แสงจันทร์',
        wish: 'ขอให้ความรักของเราสองคนมั่นคง ยืนยาวดั่งสายน้ำ ไม่ทอดทิ้งกัน คอยเป็นกำลังใจให้กันเสมอ',
        baseId: 'base_kanom_ko',
        timestamp: Date.now() - 1000 * 60 * 95,
        sampleImgKey: 'sample_ko'
      },
      {
        id: 'sample_5',
        name: 'เด็กชายพายุ ยิ้มหวาน',
        wish: 'ขอให้ทำการบ้านเสร็จเร็วๆ ได้เล่นสนุกกับเพื่อนๆ และคุณพ่อคุณแม่พาไปเที่ยวทะเลครับ',
        baseId: 'base_khao_jee',
        timestamp: Date.now() - 1000 * 60 * 130,
        sampleImgKey: 'sample_jee'
      },
      {
        id: 'sample_6',
        name: 'สุขใจ ริมคุ้งน้ำ',
        wish: 'ขอปล่อยความทุกข์ ความเศร้า สิ่งไม่ดีทั้งหลายลอยไปกับสายน้ำ ขอให้มีแต่สิ่งมงคลเข้ามาในชีวิตนับแต่นี้',
        baseId: 'base_khao_tan',
        timestamp: Date.now() - 1000 * 60 * 180,
        sampleImgKey: 'sample_tan'
      }
    ];
  }

  // --- INITIALIZE AMBIENT PARTICLES ---

  initStars() {
    this.stars = [];
    const starCount = 80;
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height * 0.55),
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  initSkyLanterns() {
    this.lanterns = [];
    const lanternCount = 18;
    for (let i = 0; i < lanternCount; i++) {
      this.lanterns.push(this.createSkyLantern(true));
    }
  }

  createSkyLantern(randomY = false) {
    const scale = Math.random() * 0.45 + 0.35;
    return {
      x: Math.random() * this.width,
      y: randomY ? Math.random() * (this.height * 0.55) : this.height * 0.55 + Math.random() * 40,
      scale: scale,
      speedY: -(Math.random() * 0.18 + 0.12) * scale, // ความเร็วลอยขึ้น นุ่มนวล ช้าๆ
      swaySpeed: Math.random() * 0.003 + 0.002, // ไกวช้ามาก ไม่แกว่งรัว
      swayAmp: Math.random() * 4 + 2, // ส่ายแค่ 2-6px เบาๆ
      swayPhase: Math.random() * Math.PI * 2,
      baseX: Math.random() * this.width,
      opacity: Math.random() * 0.35 + 0.5
    };
  }

  // --- LOAD KRATHONGS FROM DB ---

  async loadKrathongs(krathongsList) {
    this.allKrathongs = krathongsList || [];
    if (this.onCountChange) {
      this.onCountChange(this.countFloatedKrathongs());
    }

    // Populate active river krathongs
    this.krathongs = [];
    // Spawn up to 12 simultaneous krathongs spread out across the river
    const spawnCount = Math.min(this.allKrathongs.length, 12);
    for (let i = 0; i < spawnCount; i++) {
      const data = this.allKrathongs[i % this.allKrathongs.length];
      await this.spawnFloatingKrathong(data, {
        initialProgress: Math.random() * this.width
      });
    }
  }

  countFloatedKrathongs() {
    return this.allKrathongs.filter((krathong) => !String(krathong.id).startsWith('sample_')).length;
  }

  async getCachedImage(srcOrSvg) {
    if (!srcOrSvg) return null;
    if (this.imageCache.has(srcOrSvg)) {
      return this.imageCache.get(srcOrSvg);
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache.set(srcOrSvg, img);
        resolve(img);
      };
      img.onerror = () => resolve(null);
      img.src = srcOrSvg;
    });
  }

  // Spawn a krathong into the river animation
  async spawnFloatingKrathong(data, options = {}) {
    let img = null;
    if (data.imageData) {
      img = await this.getCachedImage(data.imageData);
    } else if (data.baseId) {
      const baseAsset = KRATHONG_ASSETS.bases.find((b) => b.id === data.baseId) || KRATHONG_ASSETS.bases[0];
      img = await this.getCachedImage(svgToDataUrl(baseAsset.svg));
    }

    if (!img) return null;

    // Assign perspective depth: 0 = Far, 1 = Mid, 2 = Near
    const depthTier = options.depthTier !== undefined ? options.depthTier : Math.floor(Math.random() * 3);

    // คำนวณช่วงความสูงผิวน้ำที่มีอยู่จริงจาก this.waterlineY จนถึงขอบจอด้านล่าง (this.height)
    const waterDepth = this.height - this.waterlineY;

    let scale, minRatio, maxRatio, speed;
    if (depthTier === 0) {
      // Far (ไกล - อยู่ติดใต้ขอบผิวน้ำลงมาพอดี ไม่ลอยเกยขึ้นไปบนฝั่ง/ท้องฟ้า)
      scale = 0.35 + Math.random() * 0.08; // 0.35 - 0.43
      minRatio = 0.16; // ลงมา 16% ของแม่น้ำ (พ้นขอบตลิ่ง)
      maxRatio = 0.38;
      speed = 0.20 + Math.random() * 0.10;
    } else if (depthTier === 1) {
      // Mid (กลาง - ลอยช่วงกลางลำน้ำ)
      scale = 0.50 + Math.random() * 0.10; // 0.50 - 0.60
      minRatio = 0.42;
      maxRatio = 0.68;
      speed = 0.32 + Math.random() * 0.14;
    } else {
      // Near (ใกล้ - ลอยริมน้ำด้านหน้า)
      scale = 0.70 + Math.random() * 0.15; // 0.70 - 0.85
      minRatio = 0.72;
      maxRatio = 0.88; // ไม่จมขอบจอล่าง
      speed = 0.45 + Math.random() * 0.18;
    }

    const calculatedY = this.waterlineY + waterDepth * (minRatio + Math.random() * (maxRatio - minRatio));
    const baseY = Math.max(this.waterlineY + 30, Math.min(this.height - 40, calculatedY));
    const startX = options.initialProgress !== undefined ? options.initialProgress : -160;

    const floatingObj = {
      id: data.id,
      name: data.privacy === 'private'
        ? 'กระทงส่วนตัว'
        : data.privacy === 'anonymous'
          ? 'ไม่ประสงค์ออกนาม'
          : data.name || 'ผู้ไม่ประสงค์ออกนาม',
      wish: data.privacy === 'private'
        ? 'คำอธิษฐานนี้เป็นส่วนตัว'
        : data.wish || 'ขอขมาพระแม่คงคา สุขกายสบายใจตลอดปี',
      privacy: data.privacy || 'public',
      timestamp: data.timestamp || Date.now(),
      imgElement: img,
      imageData: data.imageData,
      x: startX,
      baseY: baseY,
      y: baseY,
      depthTier: depthTier,
      scale: scale,
      speed: speed,
      width: 180 * scale,
      height: 125 * scale,
      bobAmp: 1.0 + depthTier * 0.6, // ลดระยะกระเพื่อมขึ้นลง เหลือ 1.0 - 2.2px นิ่งสงบ
      bobSpeed: 0.0012 + Math.random() * 0.0004,
      bobPhase: Math.random() * Math.PI * 2,
      tiltAmp: 0.8 + depthTier * 0.4, // เอียงส่ายไม่เกิน 0.8 - 1.6 องศา
      tiltSpeed: 0.0010 + Math.random() * 0.0004,
      tiltPhase: Math.random() * Math.PI * 2,
      isUserNewLaunch: options.isUserNewLaunch || false
    };

    // Keep sorted by depthTier (Far first, Near last)
    this.krathongs.push(floatingObj);
    this.krathongs.sort((a, b) => a.depthTier - b.depthTier);

    return floatingObj;
  }

  // Add freshly launched krathong with celebratory camera focus & ripple
  async launchNewKrathong(krathongData) {
    this.allKrathongs.unshift(krathongData);
    if (this.onCountChange) {
      this.onCountChange(this.countFloatedKrathongs());
    }

    const newObj = await this.spawnFloatingKrathong(krathongData, {
      depthTier: 2, // Near, prominent view
      initialProgress: this.width * 0.42,
      isUserNewLaunch: true
    });

    if (newObj) {
      const waterDepth = this.height - this.waterlineY;
      newObj.baseY = Math.min(this.height - 45, this.waterlineY + waterDepth * 0.82);
      newObj.y = newObj.baseY;

      // Create expanding water ripples
      this.createRipple(newObj.x, newObj.y + 20);

      // Launch fireworks!
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          this.triggerFirework(
            this.width * (0.3 + Math.random() * 0.4),
            this.height * (0.15 + Math.random() * 0.25)
          );
        }, i * 350);
      }

      // Automatically open speech bubble for this krathong
      setTimeout(() => {
        this.openSpeechBubble(newObj);
      }, 700);
    }

    return newObj;
  }

  // --- FIREWORKS PARTICLE SYSTEM ---

  triggerFirework(targetX, targetY, color = null) {
    const colors = [
      ['#ff5252', '#ff8a80', '#ffd700'],
      ['#ffd700', '#ffb300', '#fff9c4'],
      ['#69f0ae', '#b9f6ca', '#00e676'],
      ['#e040fb', '#ea80fc', '#ffffff'],
      ['#40c4ff', '#80d8ff', '#ffd700']
    ];
    const palette = color ? [color, '#ffffff'] : colors[Math.floor(Math.random() * colors.length)];
    const particleCount = 45;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.2;
      const speed = Math.random() * 4.5 + 2;
      this.fireworks.push({
        x: targetX,
        y: targetY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.05,
        friction: 0.96,
        color: palette[Math.floor(Math.random() * palette.length)],
        radius: Math.random() * 2.5 + 1.2,
        alpha: 1.0,
        decay: Math.random() * 0.018 + 0.012
      });
    }
  }

  scheduleAmbientFireworks() {
    const nextInterval = Math.random() * 4000 + 3500;
    setTimeout(() => {
      if (!this.isPaused) {
        this.triggerFirework(
          this.width * (0.15 + Math.random() * 0.7),
          this.height * (0.12 + Math.random() * 0.3)
        );
      }
      this.scheduleAmbientFireworks();
    }, nextInterval);
  }

  createRipple(x, y) {
    this.waterRipples.push({
      x: x,
      y: y,
      rx: 8,
      ry: 3,
      maxRx: 130,
      maxRy: 40,
      lineWidth: 2.5,
      alpha: 0.75,
      expandSpeed: 1.4
    });
  }

  // --- EVENT HANDLERS & HIT TESTING ---

  initEvents() {
    window.addEventListener('resize', () => this.resize());

    const getMousePos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const handlePointerDown = (e) => {
      // Check if clicked on a speech bubble or close button
      if (e.target && e.target.closest('#speechBubbleContainer')) {
        return; // Handled by bubble UI
      }

      const pos = getMousePos(e);
      let clicked = null;

      // Check krathongs in reverse order (Near first)
      for (let i = this.krathongs.length - 1; i >= 0; i--) {
        const k = this.krathongs[i];
        const halfW = k.width / 2;
        const halfH = k.height / 2;
        if (
          pos.x >= k.x - halfW &&
          pos.x <= k.x + halfW &&
          pos.y >= k.y - halfH &&
          pos.y <= k.y + halfH + 20
        ) {
          clicked = k;
          break;
        }
      }

      if (clicked) {
        e.preventDefault();
        this.openSpeechBubble(clicked);
      } else {
        this.closeSpeechBubble();
        // Clicked on water: create a ripple and small sparkle
        if (pos.y >= this.waterlineY) {
          this.createRipple(pos.x, pos.y);
        }
      }
    };

    const handlePointerMove = (e) => {
      const pos = getMousePos(e);
      let hovered = null;
      for (let i = this.krathongs.length - 1; i >= 0; i--) {
        const k = this.krathongs[i];
        const halfW = k.width / 2;
        const halfH = k.height / 2;
        if (
          pos.x >= k.x - halfW &&
          pos.x <= k.x + halfW &&
          pos.y >= k.y - halfH &&
          pos.y <= k.y + halfH + 20
        ) {
          hovered = k;
          break;
        }
      }

      this.hoveredKrathong = hovered;
      this.canvas.style.cursor = hovered ? 'pointer' : 'default';
    };

    this.canvas.addEventListener('click', handlePointerDown);
    this.canvas.addEventListener('mousemove', handlePointerMove);
    this.canvas.addEventListener('touchstart', handlePointerDown, { passive: true });
  }

  // --- SPEECH BUBBLE POPUP ---

  openSpeechBubble(krathong) {
    this.activeBubbleKrathong = krathong;
    if (this.onKrathongClick) {
      this.onKrathongClick(krathong);
    }
  }

  closeSpeechBubble() {
    this.activeBubbleKrathong = null;
    const bubbleContainer = document.getElementById('speechBubbleContainer');
    if (bubbleContainer) {
      bubbleContainer.style.display = 'none';
    }
  }

  // --- MAIN ANIMATION LOOP ---

  startLoop() {
    const loop = (now) => {
      const dt = Math.min(now - this.lastTime, 100);
      this.lastTime = now;

      if (!this.isPaused) {
        this.update(now, dt);
        this.render(now);
      }

      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  update(now, dt) {
    // 1. Update Sky Lanterns
    for (const lantern of this.lanterns) {
      lantern.y += lantern.speedY;
      lantern.x = lantern.baseX + Math.sin(now * lantern.swaySpeed + lantern.swayPhase) * lantern.swayAmp;
      if (lantern.y < -30) {
        // Reset to horizon
        lantern.y = this.waterlineY - 20 + Math.random() * 20;
        lantern.baseX = Math.random() * this.width;
      }
    }

    // 2. Update Fireworks Particles
    for (let i = this.fireworks.length - 1; i >= 0; i--) {
      const p = this.fireworks[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.fireworks.splice(i, 1);
      }
    }

    // 3. Update Ripples
    for (let i = this.waterRipples.length - 1; i >= 0; i--) {
      const r = this.waterRipples[i];
      r.rx += r.expandSpeed * 1.5;
      r.ry += r.expandSpeed * 0.45;
      r.alpha -= 0.008;
      if (r.alpha <= 0 || r.rx >= r.maxRx) {
        this.waterRipples.splice(i, 1);
      }
    }

    // 4. Update Floating Krathongs
    for (const k of this.krathongs) {
      // Gentle drift downstream (left to right)
      // Slight pause or slowdown when hovered
      const currentSpeed = (this.hoveredKrathong === k) ? k.speed * 0.3 : k.speed;
      k.x += currentSpeed;

      // Sinusoidal bobbing
      k.y = k.baseY + Math.sin(now * k.bobSpeed + k.bobPhase) * k.bobAmp;
      k.currentTilt = Math.sin(now * k.tiltSpeed + k.tiltPhase) * k.tiltAmp;

      // Wrap around when off-screen to the right
      if (k.x > this.width + 160) {
        k.x = -160;
        // Occasionally pick a different random krathong from allKrathongs pool
        if (this.allKrathongs.length > this.krathongs.length) {
          const randomIdx = Math.floor(Math.random() * this.allKrathongs.length);
          const freshData = this.allKrathongs[randomIdx];
          k.id = freshData.id;
          k.name = freshData.privacy === 'private'
            ? 'กระทงส่วนตัว'
            : freshData.privacy === 'anonymous'
              ? 'ไม่ประสงค์ออกนาม'
              : freshData.name;
          k.wish = freshData.privacy === 'private'
            ? 'คำอธิษฐานนี้เป็นส่วนตัว'
            : freshData.wish;
          k.privacy = freshData.privacy || 'public';
          k.timestamp = freshData.timestamp;
          if (freshData.imageData) {
            this.getCachedImage(freshData.imageData).then((img) => {
              if (img) k.imgElement = img;
            });
          }
        }
      }
    }
  }

  // --- RENDERING SCENE ---

  render(now) {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Sky Background
    this.drawSkyBackground(now);

    // 2. Draw Fireworks
    this.drawFireworks();

    // 3. Draw Water River Layer
    this.drawWaterLayer(now);

    // 4. Draw Water Ripples
    this.drawRipples();

    // 5. Draw Krathongs & Water Reflections
    this.drawKrathongs(now);
  }

  drawSkyBackground(now) {
    if (this.currentBackground && this.currentBackground.imgElement) {
      // Custom uploaded background
      this.ctx.drawImage(
        this.currentBackground.imgElement,
        0,
        0,
        this.width,
        this.height
      );
    } else {
      // Default festive Thai twilight panorama
      // Sky gradient
      const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.waterlineY);
      skyGrad.addColorStop(0, '#0a0d24'); // Deep midnight navy
      skyGrad.addColorStop(0.4, '#1b143d'); // Twilight indigo
      skyGrad.addColorStop(0.75, '#3b1c4a'); // Temple purple
      skyGrad.addColorStop(1, '#662244'); // Horizon amber crimson
      this.ctx.fillStyle = skyGrad;
      this.ctx.fillRect(0, 0, this.width, this.waterlineY);

      // Stars
      for (const s of this.stars) {
        const curAlpha = s.alpha * (0.6 + 0.4 * Math.sin(now * s.twinkleSpeed + s.phase));
        this.ctx.fillStyle = `rgba(255, 255, 255, ${curAlpha})`;
        this.ctx.beginPath();
        this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // Full Moon
      const moonX = this.width * 0.78;
      const moonY = this.height * 0.22;
      const moonR = Math.min(54, this.width * 0.08);

      // Outer Moon Halo
      const moonGlow = this.ctx.createRadialGradient(moonX, moonY, moonR * 0.8, moonX, moonY, moonR * 2.8);
      moonGlow.addColorStop(0, 'rgba(255, 248, 220, 0.45)');
      moonGlow.addColorStop(0.5, 'rgba(255, 215, 0, 0.15)');
      moonGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
      this.ctx.fillStyle = moonGlow;
      this.ctx.beginPath();
      this.ctx.arc(moonX, moonY, moonR * 2.8, 0, Math.PI * 2);
      this.ctx.fill();

      // Moon Body
      const moonBody = this.ctx.createRadialGradient(moonX - moonR * 0.3, moonY - moonR * 0.3, moonR * 0.2, moonX, moonY, moonR);
      moonBody.addColorStop(0, '#ffffff');
      moonBody.addColorStop(0.7, '#fff8e1');
      moonBody.addColorStop(1, '#ffe082');
      this.ctx.fillStyle = moonBody;
      this.ctx.beginPath();
      this.ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      this.ctx.fill();

      // Moon Craters / Rabbit on the Moon silhouette
      this.ctx.fillStyle = 'rgba(215, 204, 200, 0.32)';
      this.ctx.beginPath();
      this.ctx.arc(moonX - moonR * 0.15, moonY - moonR * 0.1, moonR * 0.28, 0, Math.PI * 2);
      this.ctx.arc(moonX + moonR * 0.25, moonY + moonR * 0.2, moonR * 0.22, 0, Math.PI * 2);
      this.ctx.fill();

      // Thai Pagoda / Wat Arun Silhouette on Opposite Bank
      this.drawTempleSilhouette();

      // Sky Lanterns (โคมลอย)
      this.drawSkyLanterns();
    }
  }

  drawTempleSilhouette() {
    this.ctx.save();
    this.ctx.fillStyle = '#0f081c'; // Silhouetted temple roof
    const baseY = this.waterlineY;
    const templeBaseX = this.width * 0.22;

    // Center Prang (พระปรางค์ประธาน)
    const prangW = 38;
    const prangH = 110;
    this.ctx.beginPath();
    this.ctx.moveTo(templeBaseX - prangW / 2, baseY);
    this.ctx.lineTo(templeBaseX - prangW / 2, baseY - 40);
    this.ctx.quadraticCurveTo(templeBaseX - prangW * 0.3, baseY - 80, templeBaseX, baseY - prangH);
    this.ctx.quadraticCurveTo(templeBaseX + prangW * 0.3, baseY - 80, templeBaseX + prangW / 2, baseY - 40);
    this.ctx.lineTo(templeBaseX + prangW / 2, baseY);
    this.ctx.closePath();
    this.ctx.fill();

    // Spire peak
    this.ctx.fillRect(templeBaseX - 1.5, baseY - prangH - 18, 3, 20);

    // Minor prangs (ปรางค์ทิศ)
    [-55, 55].forEach((offset) => {
      const sx = templeBaseX + offset;
      const sw = 22;
      const sh = 65;
      this.ctx.beginPath();
      this.ctx.moveTo(sx - sw / 2, baseY);
      this.ctx.quadraticCurveTo(sx, baseY - sh * 0.8, sx, baseY - sh);
      this.ctx.quadraticCurveTo(sx, baseY - sh * 0.8, sx + sw / 2, baseY);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.fillRect(sx - 1, baseY - sh - 10, 2, 12);
    });

    // Traditional Thai tiered temple gable roof (หลังคาทรงจั่วไทย)
    const roofX = this.width * 0.52;
    this.ctx.beginPath();
    this.ctx.moveTo(roofX - 70, baseY);
    this.ctx.lineTo(roofX - 45, baseY - 28);
    this.ctx.lineTo(roofX, baseY - 48); // Ridge
    this.ctx.lineTo(roofX + 45, baseY - 28);
    this.ctx.lineTo(roofX + 70, baseY);
    this.ctx.closePath();
    this.ctx.fill();

    // Chofah (ช่อฟ้า ปลายจั่ว)
    this.ctx.beginPath();
    this.ctx.moveTo(roofX - 45, baseY - 28);
    this.ctx.quadraticCurveTo(roofX - 52, baseY - 38, roofX - 48, baseY - 40);
    this.ctx.moveTo(roofX + 45, baseY - 28);
    this.ctx.quadraticCurveTo(roofX + 52, baseY - 38, roofX + 48, baseY - 40);
    this.ctx.strokeStyle = '#0f081c';
    this.ctx.lineWidth = 2.5;
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawSkyLanterns() {
    this.ctx.save();
    for (const l of this.lanterns) {
      this.ctx.save();
      this.ctx.translate(l.x, l.y);
      this.ctx.scale(l.scale, l.scale);
      this.ctx.globalAlpha = l.opacity;

      // Glow halo
      const glow = this.ctx.createRadialGradient(0, 0, 4, 0, 0, 22);
      glow.addColorStop(0, 'rgba(255, 215, 64, 0.9)');
      glow.addColorStop(0.5, 'rgba(255, 110, 0, 0.4)');
      glow.addColorStop(1, 'rgba(255, 61, 0, 0)');
      this.ctx.fillStyle = glow;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 22, 0, Math.PI * 2);
      this.ctx.fill();

      // Lantern body (cylinder paper)
      this.ctx.fillStyle = '#fff9c4';
      this.ctx.beginPath();
      this.ctx.roundRect(-8, -12, 16, 22, [3, 3, 2, 2]);
      this.ctx.fill();

      // Inner flame core
      this.ctx.fillStyle = '#ff6f00';
      this.ctx.beginPath();
      this.ctx.arc(0, 6, 3.5, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }
    this.ctx.restore();
  }

  drawFireworks() {
    this.ctx.save();
    for (const p of this.fireworks) {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  drawWaterLayer(now) {
    const waterHeight = this.height - this.waterlineY;
    if (waterHeight <= 0) return;

    this.ctx.save();

    // River Base Gradient (Dark flowing water)
    const waterGrad = this.ctx.createLinearGradient(0, this.waterlineY, 0, this.height);
    waterGrad.addColorStop(0, '#0d1d36');
    waterGrad.addColorStop(0.35, '#09152b');
    waterGrad.addColorStop(0.7, '#040b17');
    waterGrad.addColorStop(1, '#02060c');
    this.ctx.fillStyle = waterGrad;
    this.ctx.fillRect(0, this.waterlineY, this.width, waterHeight);

    // Golden Moon Water Reflection Beam (แสงจันทร์พาดผ่านสายน้ำ)
    const moonX = this.width * 0.78;
    const moonReflect = this.ctx.createLinearGradient(0, this.waterlineY, 0, this.height);
    moonReflect.addColorStop(0, 'rgba(255, 236, 179, 0.45)');
    moonReflect.addColorStop(0.4, 'rgba(255, 193, 7, 0.22)');
    moonReflect.addColorStop(1, 'rgba(255, 160, 0, 0.05)');

    this.ctx.fillStyle = moonReflect;
    this.ctx.beginPath();
    this.ctx.moveTo(moonX - 25, this.waterlineY);
    this.ctx.lineTo(moonX + 25, this.waterlineY);
    this.ctx.lineTo(moonX + 160, this.height);
    this.ctx.lineTo(moonX - 160, this.height);
    this.ctx.closePath();
    this.ctx.fill();

    // Shimmering horizontal wave ripples (คลื่นผิวน้ำ นิ่งสงบ สบายตา)
    this.ctx.strokeStyle = 'rgba(128, 222, 234, 0.12)';
    this.ctx.lineWidth = 1.0;
    const waveRows = 10;
    for (let r = 0; r < waveRows; r++) {
      const rowY = this.waterlineY + (waterHeight * (r + 1)) / (waveRows + 1);
      const waveSpeed = 0.0006 + r * 0.0001; // คลื่นไหลช้าลง 3 เท่า
      const waveAmp = 0.6 + r * 0.25; // คลื่นสูงเพียง 0.6 - 3px นุ่มนวลไม่กระเพื่อมแรง
      const waveFreq = 0.012 - r * 0.0005;

      this.ctx.beginPath();
      for (let x = 0; x <= this.width; x += 20) {
        const y = rowY + Math.sin(x * waveFreq + now * waveSpeed) * waveAmp;
        if (x === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawRipples() {
    this.ctx.save();
    for (const r of this.waterRipples) {
      this.ctx.beginPath();
      this.ctx.ellipse(r.x, r.y, r.rx, r.ry, 0, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(178, 235, 242, ${Math.max(0, r.alpha)})`;
      this.ctx.lineWidth = r.lineWidth;
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  drawKrathongs(now) {
    for (const k of this.krathongs) {
      if (!k.imgElement) continue;

      this.ctx.save();
      this.ctx.translate(k.x, k.y);
      this.ctx.rotate((k.currentTilt * Math.PI) / 180);

      const halfW = k.width / 2;
      const halfH = k.height / 2;

      // 1. Water Reflection (Flipped vertically with ripple effect)
      if (this.reflectionOpacity > 0.05) {
        this.ctx.save();
        this.ctx.translate(0, halfH * 0.7);
        this.ctx.scale(1, -0.45); // Squash and flip vertically
        this.ctx.globalAlpha = this.reflectionOpacity * (k.depthTier === 2 ? 0.7 : 0.45);
        this.ctx.drawImage(
          k.imgElement,
          -halfW,
          -halfH,
          k.width,
          k.height
        );
        this.ctx.restore();
      }

      // 2. Water Contact Shadow
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.ellipse(0, halfH * 0.55, halfW * 0.85, halfH * 0.28, 0, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(2, 10, 18, 0.45)';
      this.ctx.fill();
      this.ctx.restore();

      // 3. Hover / Highlight Glow
      if (this.hoveredKrathong === k || this.activeBubbleKrathong === k) {
        this.ctx.save();
        this.ctx.shadowColor = '#ffd54f';
        this.ctx.shadowBlur = 24;
        this.ctx.drawImage(
          k.imgElement,
          -halfW,
          -halfH,
          k.width,
          k.height
        );
        this.ctx.restore();
      }

      // 4. Draw Main Krathong Image
      this.ctx.drawImage(
        k.imgElement,
        -halfW,
        -halfH,
        k.width,
        k.height
      );

      // 5. Owner Name Tag Floating Underneath
      this.drawKrathongNameTag(k);

      this.ctx.restore();
    }
  }

  drawKrathongNameTag(k) {
    this.ctx.save();
    const tagY = k.height * 0.52 + 10;
    const maxChars = 14;
    const displayName = k.privacy === 'private'
      ? 'กระทงส่วนตัว'
      : k.privacy === 'anonymous'
        ? 'ไม่ประสงค์ออกนาม'
        : k.name.length > maxChars ? k.name.substring(0, maxChars) + '…' : k.name;

    // Measurement
    this.ctx.font = `600 ${Math.max(10, Math.round(11 * k.scale))}px "Kanit", sans-serif`;
    const textWidth = this.ctx.measureText(displayName).width;
    const paddingX = 10;
    const tagW = textWidth + paddingX * 2 + 16;
    const tagH = Math.max(18, Math.round(20 * k.scale));

    // Tag background capsule
    this.ctx.fillStyle = (this.hoveredKrathong === k)
      ? 'rgba(255, 179, 0, 0.95)'
      : 'rgba(20, 24, 40, 0.82)';
    this.ctx.strokeStyle = (this.hoveredKrathong === k) ? '#ffffff' : '#ffd54f';
    this.ctx.lineWidth = 1;

    this.ctx.beginPath();
    this.ctx.roundRect(-tagW / 2, tagY, tagW, tagH, tagH / 2);
    this.ctx.fill();
    this.ctx.stroke();

    // Plus icon / lotus icon badge on left of tag
    this.ctx.fillStyle = '#ffd54f';
    this.ctx.beginPath();
    this.ctx.arc(-tagW / 2 + 10, tagY + tagH / 2, 3.5, 0, Math.PI * 2);
    this.ctx.fill();

    // Text label
    this.ctx.fillStyle = (this.hoveredKrathong === k) ? '#1a1005' : '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(displayName, 4, tagY + tagH / 2 + 0.5);

    this.ctx.restore();
  }
}

// Global exposure
window.RiverScene = RiverScene;
