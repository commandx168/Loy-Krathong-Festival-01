/**
 * app.js - Main Controller for Local Custom Loy Krathong Web App
 * Integrates IndexedDB, SVG Assets, Interactive Canvas Editor,
 * Multi-layer Animated River Scene, Web Audio Synthesizer, and Postcard Generator.
 */

class LoyKrathongApp {
  constructor() {
    this.currentStep = 1;
    this.selectedBaseId = 'base_banana_leaf';
    this.selectedFlowers = new Set();
    this.selectedShortWishes = new Set();
    this.audioEnabled = true;
    this.audioCtx = null;

    // References to modules
    this.river = null;
    this.editor = null;

    // DOM Elements
    this.dom = {};
    this.cloudMode = false;
    this.cloudItems = [];
    this.cloudUnavailable = null;
  }

  async init() {
    this.cacheDomElements();
    this.initAudio();

    // 1. Initialize local drafts and detect the shared Cloudflare API.
    await LoyDB.ready();
    try {
      await CloudAPI.request('/api/events/current');
      this.cloudMode = true;
    } catch (error) {
      if (['localhost', '127.0.0.1', ''].includes(location.hostname)) {
        console.warn('Shared API unavailable; using local storage:', error);
        await this.seedInitialKrathongsIfEmpty();
      } else {
        this.cloudMode = true;
        this.cloudUnavailable = error;
        console.error('Shared API unavailable:', error);
      }
    }

    // 2. Load User Settings
    const waterline = await LoyDB.getSetting('waterlineHeight', 62);
    const reflection = await LoyDB.getSetting('reflectionOpacity', 0.45);
    const soundSetting = await LoyDB.getSetting('soundEnabled', true);
    this.audioEnabled = soundSetting;
    this.updateSoundBtnUI();

    // 3. Initialize River Scene
    this.river = new RiverScene(this.dom.riverContainer, {
      waterlineHeight: waterline,
      reflectionOpacity: reflection,
      onKrathongClick: (k) => this.showSpeechBubble(k),
      onCountChange: (count) => this.updateKrathongCount(count)
    });

    // Check active custom background, otherwise load default ref background
    const activeBgId = await LoyDB.getSetting('activeBackgroundId', null);
    let customBgLoaded = false;
    if (activeBgId) {
      const customBgs = await LoyDB.getCustomBackgrounds();
      const matched = customBgs.find((b) => b.id === activeBgId);
      if (matched && matched.dataUrl) {
        const bgImg = new Image();
        bgImg.onload = () => {
          this.river.setBackground({ imgElement: bgImg });
        };
        bgImg.src = matched.dataUrl;
        customBgLoaded = true;
      }
    }
    if (!customBgLoaded) {
      this.loadDefaultBackground();
    }

    // 4. Load all krathongs into river
    const storedKrathongs = this.cloudUnavailable ? [] : this.cloudMode ? (await this.loadCloudItems()).filter(k => k.visibility !== 'private') : await LoyDB.getAllKrathongs();
    const previewCount = ['localhost', '127.0.0.1'].includes(location.hostname)
      ? Number(new URLSearchParams(location.search).get('preview')) : 0;
    const riverKrathongs = previewCount === 30 && storedKrathongs.length
      ? Array.from({ length: 30 }, (_, index) => {
          const sample = storedKrathongs[Math.floor(Math.random() * storedKrathongs.length)];
          return { ...sample, id: `preview_${index + 1}`, name: `กระทงตัวอย่าง ${String(index + 1).padStart(2, '0')}` };
        })
      : storedKrathongs;
    await this.river.loadKrathongs(riverKrathongs);
    if (this.cloudMode) this.updateKrathongCount(this.cloudCount);

    // 5. Initialize Krathong Editor
    this.editor = new KrathongEditor(this.dom.editorCanvas, {
      width: 480,
      height: 360,
      onSelectionChange: (item) => this.updateEditorItemToolbar(item),
      onChange: () => this.updateWishFromFlowers()
    });

    // Set initial default base & candle on editor
    const initialBase = KRATHONG_ASSETS.bases[0];
    await this.editor.setBase(initialBase);
    const defaultCandle = KRATHONG_ASSETS.items[0];
    await this.editor.addDecoration(defaultCandle);

    // 6. Bind UI Events
    this.bindEvents();
    this.renderBasesGrid();
    this.renderDecorationsPicker('flowers');
  }

  cacheDomElements() {
    this.dom = {
      riverContainer: document.getElementById('riverContainer'),
      krathongCount: document.getElementById('krathongCount'),
      soundToggleBtn: document.getElementById('soundToggleBtn'),
      soundIcon: document.getElementById('soundIcon'),

      // Buttons
      btnOpenPlay: document.getElementById('btnOpenPlay'),
      btnOpenBlessings: document.getElementById('btnOpenBlessings'),
      btnOpenBgSettings: document.getElementById('btnOpenBgSettings'),
      btnOpenBackup: document.getElementById('btnOpenBackup'),

      // Modals
      playModal: document.getElementById('playModal'),
      bgSettingsModal: document.getElementById('bgSettingsModal'),
      blessingsModal: document.getElementById('blessingsModal'),
      backupModal: document.getElementById('backupModal'),
      speechBubbleContainer: document.getElementById('speechBubbleContainer'),

      // Speech bubble inner
      bubbleAuthor: document.getElementById('bubbleAuthor'),
      bubbleWish: document.getElementById('bubbleWish'),
      bubbleTime: document.getElementById('bubbleTime'),
      bubbleThumb: document.getElementById('bubbleThumb'),
      bubbleDownloadBtn: document.getElementById('bubbleDownloadBtn'),
      bubbleCloseBtn: document.getElementById('bubbleCloseBtn'),

      // Wizard (/play)
      editorCanvas: document.getElementById('editorCanvas'),
      stepIndicators: document.querySelectorAll('.step-indicator'),
      stepViews: document.querySelectorAll('.wizard-step-view'),
      basesGrid: document.getElementById('basesGrid'),
      baseUploadInput: document.getElementById('baseUploadInput'),
      autoRemoveBgBase: document.getElementById('autoRemoveBgBase'),
      decoUploadInput: document.getElementById('decoUploadInput'),
      autoRemoveBgDeco: document.getElementById('autoRemoveBgDeco'),
      decorationsGrid: document.getElementById('decorationsGrid'),
      decoTabs: document.querySelectorAll('.deco-tab-btn'),
      selectedItemBar: document.getElementById('selectedItemBar'),
      selectedItemName: document.getElementById('selectedItemName'),
      itemScaleSlider: document.getElementById('itemScaleSlider'),
      itemRotateSlider: document.getElementById('itemRotateSlider'),
      btnBringForward: document.getElementById('btnBringForward'),
      btnSendBackward: document.getElementById('btnSendBackward'),
      btnDeleteItem: document.getElementById('btnDeleteItem'),
      btnClearAllDeco: document.getElementById('btnClearAllDeco'),

      // Wizard Navigation
      wizardPrevBtn: document.getElementById('wizardPrevBtn'),
      wizardNextBtn: document.getElementById('wizardNextBtn'),
      wizardLaunchBtn: document.getElementById('wizardLaunchBtn'),

      // Step 3 Inputs
      ownerNameInput: document.getElementById('ownerNameInput'),
      visibilityInput: document.getElementById('visibilityInput'),
      wishTextInput: document.getElementById('wishTextInput'),
      quickWishTags: document.getElementById('quickWishTags'),
      shortWishesGrid: document.getElementById('shortWishesGrid'),

      // Background Modal Inputs
      waterlineSlider: document.getElementById('waterlineSlider'),
      waterlineVal: document.getElementById('waterlineVal'),
      reflectionSlider: document.getElementById('reflectionSlider'),
      reflectionVal: document.getElementById('reflectionVal'),
      bgDropzone: document.getElementById('bgDropzone'),
      bgFileInput: document.getElementById('bgFileInput'),
      bgPresetsGrid: document.getElementById('bgPresetsGrid'),
      btnResetBg: document.getElementById('btnResetBg'),

      // Blessings Modal
      blessingsSearchInput: document.getElementById('blessingsSearchInput'),
      blessingsList: document.getElementById('blessingsList'),

      // Backup Modal
      btnExportJson: document.getElementById('btnExportJson'),
      backupFileInput: document.getElementById('backupFileInput'),
      btnClearDatabase: document.getElementById('btnClearDatabase')
    };
  }

  // --- SEED SAMPLE DATA ---

  async seedInitialKrathongsIfEmpty() {
    const existing = await LoyDB.getAllKrathongs();
    if (existing && existing.length > 0) return;

    const samples = RiverScene.getSampleKrathongs();
    for (const sample of samples) {
      // Find matching base and render base image
      const baseAsset = KRATHONG_ASSETS.bases.find((b) => b.id === sample.baseId) || KRATHONG_ASSETS.bases[0];
      const candleAsset = KRATHONG_ASSETS.items[0];

      // Create quick composite sample on an offscreen canvas
      const cvs = document.createElement('canvas');
      cvs.width = 380;
      cvs.height = 280;
      const ctx = cvs.getContext('2d');

      const baseImg = await this.loadImageAsync(svgToDataUrl(baseAsset.svg));
      const candleImg = await this.loadImageAsync(svgToDataUrl(candleAsset.svg));

      if (baseImg) {
        ctx.drawImage(baseImg, 40, 100, 300, 170);
      }
      if (candleImg) {
        ctx.drawImage(candleImg, 150, 40, 80, 110);
      }

      sample.imageData = cvs.toDataURL('image/png');
      await LoyDB.saveKrathong(sample);
    }
  }

  loadImageAsync(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  // --- AUDIO SYNTHESIZER (WEB AUDIO API) ---

  initAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      this.audioCtx = new AudioContext();
    }
  }

  resumeAudioContext() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playChimeSound() {
    if (!this.audioEnabled || !this.audioCtx) return;
    this.resumeAudioContext();

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Thai chime chord)
    const now = this.audioCtx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.3);
    });
  }

  playSplashSound() {
    if (!this.audioEnabled || !this.audioCtx) return;
    this.resumeAudioContext();

    const now = this.audioCtx.currentTime;
    const bufferSize = this.audioCtx.sampleRate * 0.6;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.5);

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    noise.start(now);
  }

  playFireworkSound() {
    if (!this.audioEnabled || !this.audioCtx) return;
    this.resumeAudioContext();

    const now = this.audioCtx.currentTime;
    // Low rumble boom
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.7);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.8);
  }

  playClickSound() {
    if (!this.audioEnabled || !this.audioCtx) return;
    this.resumeAudioContext();

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  toggleSound() {
    this.audioEnabled = !this.audioEnabled;
    LoyDB.setSetting('soundEnabled', this.audioEnabled);
    this.updateSoundBtnUI();
    if (this.audioEnabled) {
      this.playChimeSound();
    }
  }

  updateSoundBtnUI() {
    if (this.dom.soundIcon) {
      this.dom.soundIcon.textContent = this.audioEnabled ? '🔔' : '🔕';
    }
  }

  // --- UI EVENT BINDING ---

  bindEvents() {
    // Top Bar Actions
    this.dom.btnOpenPlay.addEventListener('click', () => {
      this.playClickSound();
      this.openModal(this.dom.playModal);
      this.goToStep(1);
    });

    this.dom.btnOpenBlessings.addEventListener('click', () => {
      this.playClickSound();
      this.openBlessingsModal();
    });

    this.dom.btnOpenBgSettings.addEventListener('click', () => {
      this.playClickSound();
      this.openModal(this.dom.bgSettingsModal);
    });

    this.dom.btnOpenBackup.addEventListener('click', () => {
      this.playClickSound();
      this.openModal(this.dom.backupModal);
    });

    this.dom.soundToggleBtn.addEventListener('click', () => this.toggleSound());

    // Modal Close buttons
    document.querySelectorAll('.modal-close-btn, [data-modal-close]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay');
        if (modal) this.closeModal(modal);
      });
    });

    // Close on overlay backdrop click
    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeModal(overlay);
      });
    });

    // Speech Bubble Close
    this.dom.bubbleCloseBtn.addEventListener('click', () => {
      this.dom.speechBubbleContainer.style.display = 'none';
      this.river.closeSpeechBubble();
    });

    // Speech Bubble Download Card
    this.dom.bubbleDownloadBtn.addEventListener('click', () => {
      if (this.river.activeBubbleKrathong) {
        this.generateAndDownloadCard(this.river.activeBubbleKrathong);
      }
    });

    // Wizard Navigation Buttons
    this.dom.wizardPrevBtn.addEventListener('click', () => {
      this.playClickSound();
      if (this.currentStep > 1) this.goToStep(this.currentStep - 1);
    });

    this.dom.wizardNextBtn.addEventListener('click', () => {
      this.playClickSound();
      if (this.currentStep < 3) this.goToStep(this.currentStep + 1);
    });

    this.dom.wizardLaunchBtn.addEventListener('click', () => this.handleLaunchKrathong());

    // Step indicators click
    this.dom.stepIndicators.forEach((ind) => {
      ind.addEventListener('click', () => {
        const step = parseInt(ind.getAttribute('data-step'), 10);
        this.playClickSound();
        this.goToStep(step);
      });
    });

    // Step 1: Base Upload
    this.dom.baseUploadInput.addEventListener('change', (e) => this.handleCustomBaseUpload(e));

    // Step 2: Decoration Tabs
    this.dom.decoTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        this.dom.decoTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const category = tab.getAttribute('data-category');
        this.renderDecorationsPicker(category);
      });
    });

    // Step 2: Custom Decoration Upload
    this.dom.decoUploadInput.addEventListener('change', (e) => this.handleCustomDecoUpload(e));

    // Step 2: Selected Item Toolbar Controls
    this.dom.itemScaleSlider.addEventListener('input', (e) => {
      if (this.editor.selectedItem) {
        this.editor.updateSelectedItem({ scale: parseFloat(e.target.value) });
      }
    });

    this.dom.itemRotateSlider.addEventListener('input', (e) => {
      if (this.editor.selectedItem) {
        this.editor.updateSelectedItem({ rotation: parseInt(e.target.value, 10) });
      }
    });

    this.dom.btnBringForward.addEventListener('click', () => {
      if (this.editor.selectedItem) this.editor.bringForward(this.editor.selectedItem.id);
    });

    this.dom.btnSendBackward.addEventListener('click', () => {
      if (this.editor.selectedItem) this.editor.sendBackward(this.editor.selectedItem.id);
    });

    this.dom.btnDeleteItem.addEventListener('click', () => {
      if (this.editor.selectedItem) this.editor.removeDecoration(this.editor.selectedItem.id);
    });

    this.dom.btnClearAllDeco.addEventListener('click', () => {
      if (confirm('คุณต้องการลบของตกแต่งทั้งหมดบนกระทงใช่หรือไม่?')) {
        this.editor.clearDecorations();
        this.selectedFlowers.clear();
      }
    });

    // Step 3: Quick Wish Tags
    this.renderQuickWishTags();

    // Background Modal Sliders
    this.dom.waterlineSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.dom.waterlineVal.textContent = val + '%';
      this.river.setWaterline(val);
      LoyDB.setSetting('waterlineHeight', val);
    });

    this.dom.reflectionSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.dom.reflectionVal.textContent = val + '%';
      const opacity = val / 100;
      this.river.setReflectionOpacity(opacity);
      LoyDB.setSetting('reflectionOpacity', opacity);
    });

    // Background Dropzone & File Input
    this.dom.bgDropzone.addEventListener('click', () => this.dom.bgFileInput.click());
    this.dom.bgFileInput.addEventListener('change', (e) => this.handleCustomBgUpload(e));

    this.dom.btnResetBg.addEventListener('click', () => {
      this.loadDefaultBackground();
      LoyDB.setSetting('activeBackgroundId', null);
      alert('เปลี่ยนกลับไปใช้ฉากหลังเริ่มต้นแล้ว');
    });

    // Blessings Search
    this.dom.blessingsSearchInput.addEventListener('input', (e) => {
      this.filterBlessings(e.target.value);
    });

    // Backup & Restore
    this.dom.btnExportJson.addEventListener('click', () => this.handleExportBackup());
    this.dom.backupFileInput.addEventListener('change', (e) => this.handleImportBackup(e));
    this.dom.btnClearDatabase.addEventListener('click', () => this.handleClearDatabase());
  }

  // --- MODAL CONTROLS ---

  openModal(modalElem) {
    modalElem.classList.add('active');
  }

  closeModal(modalElem) {
    modalElem.classList.remove('active');
  }

  updateKrathongCount(count) {
    if (this.dom.krathongCount) {
      this.dom.krathongCount.textContent = count;
    }
  }

  async loadCloudItems() {
    const [feed, mine] = await Promise.all([CloudAPI.list(), CloudAPI.mine()]);
    for (const item of mine.items) {
      if (item.imageData) item.imageData = await CloudAPI.privateImage(item.imageData);
    }
    this.cloudItems = [...mine.items, ...feed.items];
    this.cloudCount = feed.count;
    return this.cloudItems;
  }

  // --- WIZARD STEP NAVIGATION ---

  goToStep(stepNumber) {
    this.currentStep = stepNumber;

    // Update Indicators
    this.dom.stepIndicators.forEach((ind) => {
      const s = parseInt(ind.getAttribute('data-step'), 10);
      ind.classList.toggle('active', s === stepNumber);
      ind.classList.toggle('completed', s < stepNumber);
    });

    // Update Views
    this.dom.stepViews.forEach((view) => {
      const s = parseInt(view.getAttribute('data-step'), 10);
      view.style.display = s === stepNumber ? 'block' : 'none';
    });

    // Navigation Buttons visibility
    this.dom.wizardPrevBtn.style.visibility = stepNumber === 1 ? 'hidden' : 'visible';
    if (stepNumber === 3) {
      this.dom.wizardNextBtn.style.display = 'none';
      this.dom.wizardLaunchBtn.style.display = 'inline-flex';
    } else {
      this.dom.wizardNextBtn.style.display = 'inline-flex';
      this.dom.wizardLaunchBtn.style.display = 'none';
    }

    // Deselect transform handles when moving away from Step 2
    if (stepNumber !== 2 && this.editor) {
      this.editor.selectItem(null);
    }

    if (this.editor) {
      this.editor.redraw();
    }
  }

  // --- STEP 1: BASES GRID ---

  async renderBasesGrid() {
    this.dom.basesGrid.innerHTML = '';

    // 1. Preset 6 bases
    KRATHONG_ASSETS.bases.forEach((base) => {
      const card = document.createElement('div');
      card.className = `base-card ${this.selectedBaseId === base.id ? 'active' : ''}`;
      card.innerHTML = `
        <img class="base-card-thumb" src="${base.src || svgToDataUrl(base.svg)}" alt="${base.name}">
        <div class="base-card-name">${base.name}</div>
        <div class="base-card-tag">${base.tag}</div>
      `;
      card.addEventListener('click', () => {
        this.playClickSound();
        this.selectedBaseId = base.id;
        document.querySelectorAll('.base-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        this.editor.setBase(base);
      });
      this.dom.basesGrid.appendChild(card);
    });

    // 2. Custom Uploaded Bases from DB
    const customBases = await LoyDB.getCustomBases();
    customBases.forEach((cBase) => {
      const card = document.createElement('div');
      card.className = `base-card ${this.selectedBaseId === cBase.id ? 'active' : ''}`;
      card.innerHTML = `
        <img class="base-card-thumb" src="${cBase.dataUrl}" alt="${cBase.name}">
        <div class="base-card-name">${cBase.name}</div>
        <div class="base-card-tag">กำหนดเอง</div>
      `;
      card.addEventListener('click', () => {
        this.playClickSound();
        this.selectedBaseId = cBase.id;
        document.querySelectorAll('.base-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        this.editor.setBase(cBase);
      });
      this.dom.basesGrid.appendChild(card);
    });

    // 3. "+ อัปโหลดฐานกระทงใหม่" card
    const uploadCard = document.createElement('div');
    uploadCard.className = 'base-card base-upload-card';
    uploadCard.innerHTML = `
      <div style="font-size:26px;color:#ffd54f;margin-bottom:4px;">＋</div>
      <div class="base-card-name" style="color:#ffd54f;">อัปโหลดฐานใหม่</div>
      <div class="base-card-tag">รูปของคุณ</div>
    `;
    uploadCard.addEventListener('click', () => this.dom.baseUploadInput.click());
    this.dom.basesGrid.appendChild(uploadCard);
  }

  async handleCustomBaseUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      let dataUrl = e.target.result;
      if (this.dom.autoRemoveBgBase && this.dom.autoRemoveBgBase.checked) {
        dataUrl = await this.autoRemoveBackground(dataUrl);
      }
      const baseObj = {
        name: file.name.replace(/\.[^/.]+$/, ''),
        dataUrl: dataUrl
      };
      const saved = await LoyDB.saveCustomBase(baseObj);
      this.selectedBaseId = saved.id;
      await this.renderBasesGrid();
      this.editor.setBase(saved);
      this.playChimeSound();
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  // --- STEP 2: DECORATIONS & ITEMS ---

  renderDecorationsPicker(category) {
    this.dom.decorationsGrid.innerHTML = '';

    if (category === 'flowers') {
      KRATHONG_ASSETS.flowers.forEach((flower) => {
        const card = document.createElement('div');
        card.className = 'deco-item-card';
        card.innerHTML = `
          <img class="deco-item-thumb" src="${svgToDataUrl(flower.svg)}" alt="${flower.name}">
          <div class="deco-item-name">${flower.name}</div>
        `;
        card.addEventListener('click', () => {
          this.playClickSound();
          this.editor.addDecoration(flower);
          this.selectedFlowers.add(flower);
          this.updateWishFromFlowers();
        });
        this.dom.decorationsGrid.appendChild(card);
      });
    } else if (category === 'items') {
      KRATHONG_ASSETS.items.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'deco-item-card';
        card.innerHTML = `
          <img class="deco-item-thumb" src="${svgToDataUrl(item.svg)}" alt="${item.name}">
          <div class="deco-item-name">${item.name}</div>
        `;
        card.addEventListener('click', () => {
          this.playClickSound();
          this.editor.addDecoration(item);
        });
        this.dom.decorationsGrid.appendChild(card);
      });
    } else if (category === 'custom') {
      // "+ อัปโหลดรูปเอง" trigger card
      const uploadCard = document.createElement('div');
      uploadCard.className = 'deco-item-card';
      uploadCard.style.border = '1px dashed #ffd54f';
      uploadCard.innerHTML = `
        <div style="font-size:24px;color:#ffd54f;margin:8px 0;">＋</div>
        <div class="deco-item-name" style="color:#ffd54f;">อัปโหลดรูป</div>
      `;
      uploadCard.addEventListener('click', () => this.dom.decoUploadInput.click());
      this.dom.decorationsGrid.appendChild(uploadCard);

      // Render custom uploaded stickers from DB
      LoyDB.getCustomDecorations().then((items) => {
        items.forEach((item) => {
          const card = document.createElement('div');
          card.className = 'deco-item-card';
          card.innerHTML = `
            <img class="deco-item-thumb" src="${item.dataUrl}" alt="${item.name}">
            <div class="deco-item-name">${item.name}</div>
          `;
          card.addEventListener('click', () => {
            this.playClickSound();
            this.editor.addDecoration(item);
          });
          this.dom.decorationsGrid.appendChild(card);
        });
      });
    }
  }

  async handleCustomDecoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      let dataUrl = e.target.result;
      if (this.dom.autoRemoveBgDeco && this.dom.autoRemoveBgDeco.checked) {
        dataUrl = await this.autoRemoveBackground(dataUrl);
      }
      const decoObj = {
        name: file.name.replace(/\.[^/.]+$/, ''),
        dataUrl: dataUrl
      };
      const saved = await LoyDB.saveCustomDecoration(decoObj);
      this.editor.addDecoration(saved);
      this.renderDecorationsPicker('custom');
      this.playChimeSound();
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  /**
   * Auto-remove solid/light background from uploaded image using edge-connected flood-fill
   * + soft edge feathering + bounding-box trim (100% client-side, no external API).
   */
  autoRemoveBackground(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 640;
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;
          if (!w || !h) return resolve(dataUrl);

          if (w > maxDim || h > maxDim) {
            const ratio = Math.min(maxDim / w, maxDim / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }

          const cvs = document.createElement('canvas');
          cvs.width = w;
          cvs.height = h;
          const ctx = cvs.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, w, h);

          const imgData = ctx.getImageData(0, 0, w, h);
          const data = imgData.data;
          const total = w * h;

          // 1. Check if image already has significant transparency along borders
          let transparentBorder = 0;
          let borderCount = 0;
          for (let x = 0; x < w; x++) {
            borderCount += 2;
            if (data[x * 4 + 3] < 30) transparentBorder++;
            if (data[((h - 1) * w + x) * 4 + 3] < 30) transparentBorder++;
          }
          for (let y = 1; y < h - 1; y++) {
            borderCount += 2;
            if (data[(y * w) * 4 + 3] < 30) transparentBorder++;
            if (data[(y * w + (w - 1)) * 4 + 3] < 30) transparentBorder++;
          }
          if (transparentBorder / borderCount > 0.2) {
            return resolve(dataUrl);
          }

          // 2. Sample average background color from the 4 corners (5x5 patches)
          let sumR = 0, sumG = 0, sumB = 0, samples = 0;
          const patch = Math.min(5, Math.floor(Math.min(w, h) / 4));
          const corners = [
            [0, 0],
            [w - patch, 0],
            [0, h - patch],
            [w - patch, h - patch]
          ];
          for (const [cx, cy] of corners) {
            for (let dy = 0; dy < patch; dy++) {
              for (let dx = 0; dx < patch; dx++) {
                const idx = ((cy + dy) * w + (cx + dx)) * 4;
                sumR += data[idx];
                sumG += data[idx + 1];
                sumB += data[idx + 2];
                samples++;
              }
            }
          }
          const bgR = sumR / samples;
          const bgG = sumG / samples;
          const bgB = sumB / samples;

          const colorDist = (idx, r, g, b) => {
            const dr = data[idx] - r;
            const dg = data[idx + 1] - g;
            const db = data[idx + 2] - b;
            return Math.sqrt(dr * dr + dg * dg + db * db);
          };

          // 3. Edge-connected BFS flood fill
          const visited = new Uint8Array(total);
          const isBg = new Uint8Array(total);
          const queue = new Int32Array(total);
          let head = 0, tail = 0;

          const seedTolerance = 54;
          const neighborTolerance = 22;

          const trySeed = (x, y) => {
            const p = y * w + x;
            if (visited[p]) return;
            const idx = p * 4;
            if (colorDist(idx, bgR, bgG, bgB) <= seedTolerance) {
              visited[p] = 1;
              isBg[p] = 1;
              queue[tail++] = p;
            }
          };

          for (let x = 0; x < w; x++) {
            trySeed(x, 0);
            trySeed(x, h - 1);
          }
          for (let y = 1; y < h - 1; y++) {
            trySeed(0, y);
            trySeed(w - 1, y);
          }

          while (head < tail) {
            const p = queue[head++];
            const x = p % w;
            const y = (p - x) / w;
            const pIdx = p * 4;
            const pr = data[pIdx], pg = data[pIdx + 1], pb = data[pIdx + 2];

            const neighbors = [
              x > 0 ? p - 1 : -1,
              x < w - 1 ? p + 1 : -1,
              y > 0 ? p - w : -1,
              y < h - 1 ? p + w : -1
            ];

            for (let i = 0; i < 4; i++) {
              const np = neighbors[i];
              if (np < 0 || visited[np]) continue;
              const nIdx = np * 4;
              const distToSeed = colorDist(nIdx, bgR, bgG, bgB);
              const distToPrev = colorDist(nIdx, pr, pg, pb);
              if (distToSeed <= seedTolerance || (distToPrev <= neighborTolerance && distToSeed <= seedTolerance * 1.45)) {
                visited[np] = 1;
                isBg[np] = 1;
                queue[tail++] = np;
              }
            }
          }

          // 4. Apply transparency + soft feathering on boundary pixels
          let minX = w, minY = h, maxX = -1, maxY = -1;
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const p = y * w + x;
              const idx = p * 4;
              if (isBg[p]) {
                data[idx + 3] = 0;
              } else {
                // Check if adjacent to a removed background pixel for 1px soft feather
                const nearBg =
                  (x > 0 && isBg[p - 1]) ||
                  (x < w - 1 && isBg[p + 1]) ||
                  (y > 0 && isBg[p - w]) ||
                  (y < h - 1 && isBg[p + w]);
                if (nearBg) {
                  const d = colorDist(idx, bgR, bgG, bgB);
                  if (d < seedTolerance + 28) {
                    const alphaFactor = Math.max(0.15, Math.min(1, (d - seedTolerance * 0.6) / 40));
                    data[idx + 3] = Math.round(data[idx + 3] * alphaFactor);
                  }
                }
                if (data[idx + 3] > 20) {
                  if (x < minX) minX = x;
                  if (x > maxX) maxX = x;
                  if (y < minY) minY = y;
                  if (y > maxY) maxY = y;
                }
              }
            }
          }

          ctx.putImageData(imgData, 0, 0);

          // If almost nothing left, fallback to original
          if (maxX <= minX || maxY <= minY) {
            return resolve(dataUrl);
          }

          // 5. Trim transparent padding with 4% margin
          const cropW = maxX - minX + 1;
          const cropH = maxY - minY + 1;
          const pad = Math.round(Math.max(cropW, cropH) * 0.04);
          const outCvs = document.createElement('canvas');
          outCvs.width = cropW + pad * 2;
          outCvs.height = cropH + pad * 2;
          const outCtx = outCvs.getContext('2d');
          outCtx.drawImage(cvs, minX, minY, cropW, cropH, pad, pad, cropW, cropH);

          resolve(outCvs.toDataURL('image/png'));
        } catch (err) {
          console.warn('Auto background removal fallback:', err);
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  updateEditorItemToolbar(item) {
    if (item) {
      this.dom.selectedItemBar.style.display = 'flex';
      this.dom.selectedItemName.textContent = item.name;
      this.dom.itemScaleSlider.value = item.scale;
      this.dom.itemRotateSlider.value = item.rotation;
    } else {
      this.dom.selectedItemBar.style.display = 'none';
    }
  }

  // --- STEP 3: WISH & LAUNCH ---

  renderQuickWishTags() {
    const categories = [
      {
        label: '❤️ ความรักยั่งยืน',
        text: 'ขอให้ความรักมั่นคง ยืนยาว ซื่อสัตย์ต่อกัน ไม่โรยราดั่งดอกบานไม่รู้โรย พบเจอแต่มิตรแท้ที่ดีตลอดไป'
      },
      {
        label: '💼 การงานก้าวหน้า',
        text: 'ขอให้หน้าที่การงานเจริญรุ่งเรือง ก้าวหน้าดั่งขนมชั้น ๙ ชั้น มีสติปัญญาเฉียบแหลม ผู้ใหญ่เมตตาอุปถัมภ์'
      },
      {
        label: '💰 เงินทองโชคลาภ',
        text: 'ขอให้เงินทองไหลมาเทมา ค้าขายร่ำรวย โชคลาภสว่างไสวดุจดาวเรือง ไร้หนี้สิน มีกินมีใช้ไม่ขาดมือ'
      },
      {
        label: '🌿 สุขภาพแข็งแรง',
        text: 'ขอขมาพระแม่คงคา ขอพรให้ร่างกายแข็งแรง ไร้โรคภัยไข้เจ็บ จิตใจผ่องใสสงบเย็นดั่งสายน้ำ'
      },
      {
        label: '🌊 ลอยเคราะห์ปล่อยทุกข์',
        text: 'ขอขมาพระแม่คงคา สิ่งใดที่เคยล่วงเกินโปรดยกโทษ ขอปล่อยความทุกข์โศกโรคภัยลอยไปกับสายน้ำ ขอเริ่มต้นชีวิตใหม่ที่สดใส'
      }
    ];

    this.dom.quickWishTags.innerHTML = '';
    categories.forEach((cat) => {
      const tag = document.createElement('span');
      tag.className = 'wish-tag';
      tag.textContent = cat.label;
      tag.addEventListener('click', () => {
        this.playClickSound();
        this.selectedShortWishes.clear();
        if (this.dom.shortWishesGrid) {
          this.dom.shortWishesGrid.querySelectorAll('.short-wish-btn').forEach((b) => {
            b.classList.remove('active');
            const dot = b.querySelector('.wish-dot');
            if (dot) dot.textContent = '';
          });
        }
        this.dom.wishTextInput.value = cat.text;
      });
      this.dom.quickWishTags.appendChild(tag);
    });

    // Multi-select short wish buttons from ref/S__135684124.jpg
    const shortWishes = [
      'ความสุขจงลอยมา',
      'ความทุกข์จงลอยไป',
      'สุขภาพแข็งแรงตลอดปี',
      'เงินทองไหลมาเทมา',
      'งานปัง โบนัสปัง',
      'รักดี ชีวิตดี มีความสุข',
      'น้ำใส ใจสะอาด โลกสดใส',
      'ชาว กปน. มีความสุขทุกคน',
      'ขอให้ทุกหยดน้ำมีคุณค่า',
      'ขอให้โลกนี้น่าอยู่ตลอดไป'
    ];

    if (this.dom.shortWishesGrid) {
      this.dom.shortWishesGrid.innerHTML = '';
      shortWishes.forEach((phrase) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'short-wish-btn';
        if (this.selectedShortWishes.has(phrase)) {
          btn.classList.add('active');
        }

        const dot = document.createElement('span');
        dot.className = 'wish-dot';
        dot.textContent = this.selectedShortWishes.has(phrase) ? '✓' : '';

        const label = document.createElement('span');
        label.textContent = phrase;

        btn.appendChild(dot);
        btn.appendChild(label);

        btn.addEventListener('click', () => {
          this.playClickSound();
          if (this.selectedShortWishes.has(phrase)) {
            this.selectedShortWishes.delete(phrase);
            btn.classList.remove('active');
            dot.textContent = '';
          } else {
            this.selectedShortWishes.add(phrase);
            btn.classList.add('active');
            dot.textContent = '✓';
          }
          if (this.selectedShortWishes.size > 0) {
            this.dom.wishTextInput.value = Array.from(this.selectedShortWishes).join(' • ');
          } else {
            this.dom.wishTextInput.value = '';
          }
        });

        this.dom.shortWishesGrid.appendChild(btn);
      });
    }
  }

  loadDefaultBackground() {
    const defaultBg = new Image();
    defaultBg.onload = () => {
      if (this.river) {
        this.river.setBackground({ imgElement: defaultBg, isDefault: true });
      }
    };
    defaultBg.onerror = () => {
      if (this.river) {
        this.river.setBackground(null);
      }
    };
    defaultBg.src = 'ref/S__135725097.jpg';
  }

  updateWishFromFlowers() {
    // Only auto-fill if wish input is currently blank or was previously generated
    if (this.selectedFlowers.size > 0 && !this.dom.wishTextInput.value.trim()) {
      const flowerArray = Array.from(this.selectedFlowers);
      const chosen = flowerArray[flowerArray.length - 1]; // most recently added flower
      if (chosen && chosen.wishTemplate) {
        this.dom.wishTextInput.value = chosen.wishTemplate;
      }
    }
  }

  async handleLaunchKrathong() {
    if (this.cloudUnavailable) return alert('ระบบออนไลน์ยังไม่พร้อม: ' + this.cloudUnavailable.message);
    if (this.dom.wizardLaunchBtn.disabled) return;
    const name = this.dom.ownerNameInput.value.trim() || 'ผู้ไม่ประสงค์ออกนาม';
    const wish = this.dom.wishTextInput.value.trim() || 'ขอขมาพระแม่คงคา สุขกายสบายใจตลอดปี ๒๕๖๙';
    const visibility = this.dom.visibilityInput.value;

    if (this.cloudMode) {
      this.dom.wizardLaunchBtn.disabled = true;
      try {
        await CloudAPI.ensureGuest(name);
        const image = await CloudAPI.upload(await this.editor.renderCompositeImage(480, 360));
        const result = await CloudAPI.create({ name, wish, baseId: this.selectedBaseId, imageMediaId: image.id, visibility });
        await this.loadCloudItems();
        this.closeModal(this.dom.playModal);
        this.playSplashSound();
        this.playFireworkSound();
        if (visibility !== 'private') await this.river.launchNewKrathong(result.item);
        this.updateKrathongCount(this.cloudCount);
      } catch (error) {
        alert('ยังบันทึกกระทงออนไลน์ไม่ได้: ' + error.message);
      } finally {
        this.dom.wizardLaunchBtn.disabled = false;
      }
      return;
    }

    // 1. Render Composite High-Res Image of Krathong
    const highResDataUrl = await this.editor.renderCompositeImage(480, 360);

    // 2. Build Krathong Data Object
    const krathongData = {
      id: 'krathong_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: name,
      wish: wish,
      baseId: this.selectedBaseId,
      timestamp: Date.now(),
      imageData: highResDataUrl,
      decorationsSummary: this.editor.getDecorationsSummary()
    };

    // 3. Save to IndexedDB
    await LoyDB.saveKrathong(krathongData);

    // 4. Close Modal
    this.closeModal(this.dom.playModal);

    // 5. Sound & Launch into River
    this.playSplashSound();
    this.playFireworkSound();
    await this.river.launchNewKrathong(krathongData);
  }

  // --- SPEECH BUBBLE INTERACTION ---

  showSpeechBubble(k) {
    this.playChimeSound();
    this.dom.bubbleAuthor.textContent = k.name;
    this.dom.bubbleWish.textContent = k.wish;
    this.dom.bubbleTime.textContent = new Date(k.timestamp).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short'
    });

    if (k.imageData) {
      this.dom.bubbleThumb.src = k.imageData;
      this.dom.bubbleThumb.style.display = 'block';
    } else {
      this.dom.bubbleThumb.style.display = 'none';
    }

    this.dom.speechBubbleContainer.style.display = 'block';
  }

  // --- BLESSINGS FEED DRAWER (/blessing) ---

  async openBlessingsModal() {
    this.openModal(this.dom.blessingsModal);
    await this.renderBlessingsList();
  }

  async renderBlessingsList(filterQuery = '') {
    if (this.cloudUnavailable) return alert('ระบบออนไลน์ยังไม่พร้อม: ' + this.cloudUnavailable.message);
    const list = this.cloudMode ? await this.loadCloudItems() : await LoyDB.getAllKrathongs();
    this.dom.blessingsList.innerHTML = '';

    const q = filterQuery.toLowerCase().trim();
    const filtered = list.filter((k) => {
      if (!q) return true;
      return (k.name && k.name.toLowerCase().includes(q)) || (k.wish && k.wish.toLowerCase().includes(q));
    });

    if (filtered.length === 0) {
      this.dom.blessingsList.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: #90a4ae; padding: 40px 0;">
          ไม่พบคำอธิษฐานที่ตรงกับการค้นหา
        </div>
      `;
      return;
    }

    filtered.forEach((k) => {
      const card = document.createElement('div');
      card.className = 'blessing-card';
      const timeStr = new Date(k.timestamp).toLocaleString('th-TH', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });

      card.innerHTML = `
        <div class="blessing-card-header">
          <img class="blessing-card-thumb" alt="กระทง">
          <div class="blessing-card-info">
            <div class="blessing-card-name"></div>
            <div class="blessing-card-date">${timeStr}</div>
          </div>
        </div>
        <div class="blessing-card-body"></div>
        <div class="blessing-card-footer">
          <button class="btn-glass" data-action="download-card" style="font-size:12px;padding:5px 12px;">
            🖼️ บันทึกการ์ด (PNG)
          </button>
          <button class="btn-glass" data-action="delete-krathong" style="font-size:12px;padding:5px 10px;color:#ff5252;${this.cloudMode && !k.mine ? 'display:none;' : ''}">
            🗑️ ลบ
          </button>
          ${this.cloudMode && !k.mine ? '<button class="btn-glass" data-action="admin-delete" style="font-size:12px;padding:5px 10px;color:#ff8a80;">🔒 แอดมินลบ</button>' : ''}
        </div>
      `;

      card.querySelector('.blessing-card-thumb').src = k.imageData || '';
      card.querySelector('.blessing-card-name').textContent = k.name;
      card.querySelector('.blessing-card-body').textContent = k.wish;

      card.querySelector('[data-action="download-card"]').addEventListener('click', () => {
        this.generateAndDownloadCard(k);
      });

      card.querySelector('[data-action="delete-krathong"]').addEventListener('click', async () => {
        if (confirm(`คุณต้องการลบกระทงของ "${k.name}" ใช่หรือไม่?`)) {
          if (this.cloudMode) await CloudAPI.remove(k.id);
          else await LoyDB.deleteKrathong(k.id);
          const updated = this.cloudMode ? (await this.loadCloudItems()).filter(item => item.visibility !== 'private') : await LoyDB.getAllKrathongs();
          await this.river.loadKrathongs(updated);
          if (this.cloudMode) this.updateKrathongCount(this.cloudCount);
          this.renderBlessingsList(this.dom.blessingsSearchInput.value);
        }
      });

      card.querySelector('[data-action="admin-delete"]')?.addEventListener('click', async () => {
        const code = prompt('กรอกรหัสแอดมินเพื่อลบรายการคำอธิษฐานนี้');
        if (!code || !confirm(`ยืนยันลบรายการของ "${k.name}"?`)) return;
        try {
          await CloudAPI.adminRemove(k.id, code);
          const updated = (await this.loadCloudItems()).filter(item => item.visibility !== 'private');
          await this.river.loadKrathongs(updated);
          this.updateKrathongCount(this.cloudCount);
          await this.renderBlessingsList(this.dom.blessingsSearchInput.value);
        } catch (error) {
          alert('ลบรายการไม่สำเร็จ: ' + error.message);
        }
      });

      this.dom.blessingsList.appendChild(card);
    });
  }

  filterBlessings(query) {
    this.renderBlessingsList(query);
  }

  // --- POSTCARD PNG CARD GENERATOR ---

  async generateAndDownloadCard(krathong) {
    const cardCanvas = document.createElement('canvas');
    cardCanvas.width = 800;
    cardCanvas.height = 1000;
    const ctx = cardCanvas.getContext('2d');

    // 1. Night Sky Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1000);
    bgGrad.addColorStop(0, '#090d24');
    bgGrad.addColorStop(0.45, '#1e143d');
    bgGrad.addColorStop(0.7, '#3b1c4a');
    bgGrad.addColorStop(1, '#081220');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 1000);

    // 2. Stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 90; i++) {
      const sx = (i * 123) % 800;
      const sy = (i * 247) % 550;
      const r = (i % 3) * 0.7 + 0.6;
      ctx.globalAlpha = 0.3 + (i % 5) * 0.15;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 3. Golden Full Moon with Glow
    const moonGlow = ctx.createRadialGradient(400, 190, 40, 400, 190, 150);
    moonGlow.addColorStop(0, 'rgba(255, 235, 59, 0.5)');
    moonGlow.addColorStop(0.5, 'rgba(255, 179, 0, 0.2)');
    moonGlow.addColorStop(1, 'rgba(255, 179, 0, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(400, 190, 150, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff9c4';
    ctx.beginPath();
    ctx.arc(400, 190, 60, 0, Math.PI * 2);
    ctx.fill();

    // 4. Gold Ornamental Border Frame
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, 740, 940);
    ctx.strokeStyle = 'rgba(255, 213, 79, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(40, 40, 720, 920);

    // Corner Ornaments
    const drawCorner = (x, y, flipX, flipY) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(flipX, flipY);
      ctx.strokeStyle = '#ffd54f';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(10, 35);
      ctx.lineTo(10, 10);
      ctx.lineTo(35, 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(20, 20, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd54f';
      ctx.fill();
      ctx.restore();
    };
    drawCorner(45, 45, 1, 1);
    drawCorner(755, 45, -1, 1);
    drawCorner(45, 955, 1, -1);
    drawCorner(755, 955, -1, -1);

    // 5. Header Title
    ctx.fillStyle = '#ffd54f';
    ctx.font = 'bold 36px "Kanit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('สุขสันต์วันลอยกระทง ๒๕๖๙', 400, 100);

    ctx.fillStyle = '#e0f2f1';
    ctx.font = '16px "Prompt", sans-serif';
    ctx.fillText('ขอขมาพระแม่คงคา น้อมจิตตั้งมั่นสู่สายน้ำอันศักดิ์สิทธิ์', 400, 135);

    // 6. Draw Krathong Composite
    if (krathong.imageData) {
      const kImg = await this.loadImageAsync(krathong.imageData);
      if (kImg) {
        // Water ripple under krathong
        ctx.beginPath();
        ctx.ellipse(400, 530, 260, 45, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(77, 208, 225, 0.18)';
        ctx.fill();

        ctx.drawImage(kImg, 160, 310, 480, 360);
      }
    }

    // 7. Owner Badge & Wish Box
    ctx.fillStyle = 'rgba(12, 16, 36, 0.85)';
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(80, 620, 640, 250, 16);
    ctx.fill();
    ctx.stroke();

    // Owner Name
    ctx.fillStyle = '#ffd54f';
    ctx.font = 'bold 24px "Kanit", sans-serif';
    ctx.fillText(`กระทงของ: ${krathong.name}`, 400, 665);

    // Wish Text Wrapped
    ctx.fillStyle = '#f5f5f5';
    ctx.font = '17px "Prompt", sans-serif';
    this.wrapText(ctx, `“${krathong.wish}”`, 400, 715, 560, 28);

    // Footer Timestamp
    ctx.fillStyle = '#90a4ae';
    ctx.font = '14px "Prompt", sans-serif';
    const dateFormatted = new Date(krathong.timestamp).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    ctx.fillText(`ลอยเมื่อ: ${dateFormatted}`, 400, 915);

    // 8. Trigger Browser Download
    const downloadLink = document.createElement('a');
    downloadLink.download = `LoyKrathong_${krathong.name.replace(/\s+/g, '_')}.png`;
    downloadLink.href = cardCanvas.toDataURL('image/png');
    downloadLink.click();
    this.playChimeSound();
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }

  // --- BACKGROUND CUSTOMIZATION ---

  async handleCustomBgUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      const bgObj = {
        name: file.name.replace(/\.[^/.]+$/, ''),
        dataUrl: dataUrl
      };
      const saved = await LoyDB.saveCustomBackground(bgObj);
      await LoyDB.setSetting('activeBackgroundId', saved.id);

      const img = new Image();
      img.onload = () => {
        this.river.setBackground({ imgElement: img });
      };
      img.src = dataUrl;
      this.playChimeSound();
      alert('เปลี่ยนฉากหลังสำเร็จแล้ว!');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  // --- BACKUP & RESTORE ---

  async handleExportBackup() {
    try {
      const backupData = await LoyDB.exportAllData();
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LoyKrathong_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.playChimeSound();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการสำรองข้อมูล: ' + err.message);
    }
  }

  async handleImportBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        await LoyDB.importAllData(e.target.result);
        alert('กู้คืนข้อมูลสำเร็จ! ระบบจะรีเฟรชหน้าเว็บเพื่อแสดงข้อมูลใหม่');
        window.location.reload();
      } catch (err) {
        alert('ไม่สามารถกู้คืนข้อมูลได้: ' + err.message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  async handleClearDatabase() {
    if (confirm(this.cloudMode ? 'ล้างข้อมูลที่บันทึกในเบราว์เซอร์นี้? กระทงออนไลน์จะยังอยู่' : 'คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลทั้งหมดในเครื่อง?')) {
      await LoyDB.clearAllData();
      alert('ล้างข้อมูลเรียบร้อยแล้ว');
      window.location.reload();
    }
  }
}

// Instantiate and initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.App = new LoyKrathongApp();
  window.App.init();
});
