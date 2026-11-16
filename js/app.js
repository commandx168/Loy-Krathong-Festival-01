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
    this.audioEnabled = true;
    this.audioCtx = null;
    this.clockInterval = null;

    // References to modules
    this.river = null;
    this.editor = null;

    // DOM Elements
    this.dom = {};
  }

  async init() {
    this.cacheDomElements();
    this.initAudio();

    // 1. Initialize Database & Seed initial sample krathongs if empty
    await LoyDB.ready();
    await this.seedInitialKrathongsIfEmpty();
    await ThemeManager.init();

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

    // Check active custom background
    const activeBgId = await LoyDB.getSetting('activeBackgroundId', null);
    if (activeBgId) {
      const customBgs = await LoyDB.getCustomBackgrounds();
      const matched = customBgs.find((b) => b.id === activeBgId);
      if (matched && matched.dataUrl) {
        const bgImg = new Image();
        bgImg.onload = () => {
          this.river.setBackground({ imgElement: bgImg });
        };
        bgImg.src = matched.dataUrl;
      }
    }

    // 4. Load all krathongs into river
    const storedKrathongs = await LoyDB.getAllKrathongs();
    await this.river.loadKrathongs(storedKrathongs);

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
      siteDateTime: document.getElementById('siteDateTime'),
      soundToggleBtn: document.getElementById('soundToggleBtn'),
      soundIcon: document.getElementById('soundIcon'),
      themeToggleBtn: document.getElementById('themeToggleBtn'),

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
      decoUploadInput: document.getElementById('decoUploadInput'),
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
      btnRandomKrathong: document.getElementById('btnRandomKrathong'),
      btnShareKrathong: document.getElementById('btnShareKrathong'),
      btnDownloadKrathong: document.getElementById('btnDownloadKrathong'),

      // Step 3 Inputs
      ownerNameInput: document.getElementById('ownerNameInput'),
      coupleModeInput: document.getElementById('coupleModeInput'),
      partnerNameGroup: document.getElementById('partnerNameGroup'),
      partnerNameInput: document.getElementById('partnerNameInput'),
      wishTextInput: document.getElementById('wishTextInput'),
      privacySelect: document.getElementById('privacySelect'),
      summaryOwnerName: document.getElementById('summaryOwnerName'),
      summaryWish: document.getElementById('summaryWish'),
      summaryPrivacy: document.getElementById('summaryPrivacy'),
      summaryCanvas: document.getElementById('summaryCanvas'),
      quickWishTags: document.getElementById('quickWishTags'),

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
    this.dom.themeToggleBtn.addEventListener('click', () => ThemeManager.toggle());
    this.updateSiteDateTime();
    this.clockInterval = window.setInterval(() => this.updateSiteDateTime(), 1000);

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
      if (this.currentStep < 4) this.goToStep(this.currentStep + 1);
    });

    this.dom.wizardLaunchBtn.addEventListener('click', () => this.handleLaunchKrathong());
    this.dom.btnRandomKrathong.addEventListener('click', () => this.randomizeKrathong());
    this.dom.btnShareKrathong.addEventListener('click', () => this.shareDraftKrathong());
    this.dom.btnDownloadKrathong.addEventListener('click', () => this.downloadDraftKrathong());
    this.dom.coupleModeInput.addEventListener('change', () => {
      this.dom.partnerNameGroup.hidden = !this.dom.coupleModeInput.checked;
    });

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
      this.river.setBackground(null);
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

  updateSiteDateTime() {
    if (!this.dom.siteDateTime) return;
    const now = new Date();
    this.dom.siteDateTime.dateTime = now.toISOString();
    this.dom.siteDateTime.textContent = now.toLocaleString('th-TH', {
      dateStyle: 'medium',
      timeStyle: 'medium'
    });
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
    if (stepNumber === 4) {
      this.dom.wizardNextBtn.style.display = 'none';
      this.dom.wizardLaunchBtn.style.display = 'inline-flex';
    } else {
      this.dom.wizardNextBtn.style.display = 'inline-flex';
      this.dom.wizardLaunchBtn.style.display = 'none';
    }
    if (stepNumber === 4) this.updateConfirmationSummary();

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
        <img class="base-card-thumb" src="${svgToDataUrl(base.svg)}" alt="${base.name}">
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

  async randomizeKrathong() {
    const base = KRATHONG_ASSETS.bases[Math.floor(Math.random() * KRATHONG_ASSETS.bases.length)];
    const choices = [...KRATHONG_ASSETS.flowers, ...KRATHONG_ASSETS.items.slice(1)];
    const decorationCount = 1 + Math.floor(Math.random() * 3);
    const decorations = [];

    while (decorations.length < decorationCount && choices.length > 0) {
      const index = Math.floor(Math.random() * choices.length);
      decorations.push(choices.splice(index, 1)[0]);
    }

    this.selectedBaseId = base.id;
    await this.editor.setBase(base);
    this.editor.clearDecorations();
    await this.editor.addDecoration(KRATHONG_ASSETS.items[0]);
    for (const decoration of decorations) {
      await this.editor.addDecoration(decoration);
    }
    this.selectedFlowers = new Set(decorations.filter((item) => KRATHONG_ASSETS.flowers.includes(item)));
    this.renderBasesGrid();
    this.updateWishFromFlowers();
    this.playChimeSound();
  }

  async handleCustomBaseUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
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
      const dataUrl = e.target.result;
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
        this.dom.wishTextInput.value = cat.text;
      });
      this.dom.quickWishTags.appendChild(tag);
    });
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

  async getDraftKrathong() {
    const firstName = this.dom.ownerNameInput.value.trim();
    const secondName = this.dom.partnerNameInput.value.trim();
    const name = this.dom.coupleModeInput.checked && secondName
      ? `${firstName || 'ผู้ร่วมลอย'} & ${secondName}`
      : firstName || 'ผู้ไม่ประสงค์ออกนาม';
    return {
      id: 'preview_' + Date.now(),
      name,
      wish: this.dom.wishTextInput.value.trim() || 'ขอขมาพระแม่คงคา สุขกายสบายใจตลอดปี ๒๕๖๙',
      baseId: this.selectedBaseId,
      timestamp: Date.now(),
      imageData: await this.editor.renderCompositeImage(480, 360),
      decorationsSummary: this.editor.getDecorationsSummary(),
      privacy: this.dom.privacySelect.value,
      isCouple: this.dom.coupleModeInput.checked
    };
  }

  async updateConfirmationSummary() {
    const krathong = await this.getDraftKrathong();
    const ctx = this.dom.summaryCanvas.getContext('2d');
    const image = await this.loadImageAsync(krathong.imageData);
    ctx.clearRect(0, 0, this.dom.summaryCanvas.width, this.dom.summaryCanvas.height);
    if (image) ctx.drawImage(image, 0, 0, this.dom.summaryCanvas.width, this.dom.summaryCanvas.height);

    this.dom.summaryOwnerName.textContent = krathong.name;
    this.dom.summaryWish.textContent = krathong.wish;
    this.dom.summaryPrivacy.textContent = this.privacyLabel(krathong.privacy);
  }

  privacyLabel(privacy) {
    return {
      public: 'แสดงชื่อและคำอธิษฐาน',
      anonymous: 'แสดงคำอธิษฐานโดยไม่แสดงชื่อ',
      private: 'ซ่อนชื่อและคำอธิษฐานจากผู้อื่น'
    }[privacy] || 'แสดงชื่อและคำอธิษฐาน';
  }

  async handleLaunchKrathong() {
    const krathongData = await this.getDraftKrathong();
    krathongData.id = 'krathong_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    await LoyDB.saveKrathong(krathongData);

    this.closeModal(this.dom.playModal);

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
    const list = await LoyDB.getAllKrathongs();
    this.dom.blessingsList.innerHTML = '';

    const q = filterQuery.toLowerCase().trim();
    const filtered = list.filter((k) => k.privacy !== 'private').filter((k) => {
      const visible = this.getPrivacySafeKrathong(k);
      if (!q) return true;
      return (visible.name && visible.name.toLowerCase().includes(q)) || (visible.wish && visible.wish.toLowerCase().includes(q));
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
      const visible = this.getPrivacySafeKrathong(k);
      const card = document.createElement('div');
      card.className = 'blessing-card';
      const timeStr = new Date(k.timestamp).toLocaleString('th-TH', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });

      const header = document.createElement('div');
      header.className = 'blessing-card-header';
      const thumbnail = document.createElement('img');
      thumbnail.className = 'blessing-card-thumb';
      thumbnail.alt = 'กระทง';
      if (typeof k.imageData === 'string' && k.imageData.startsWith('data:image/')) {
        thumbnail.src = k.imageData;
      }
      const info = document.createElement('div');
      info.className = 'blessing-card-info';
      const name = document.createElement('div');
      name.className = 'blessing-card-name';
      name.textContent = visible.name;
      const date = document.createElement('div');
      date.className = 'blessing-card-date';
      date.textContent = timeStr;
      info.append(name, date);
      header.append(thumbnail, info);

      const body = document.createElement('div');
      body.className = 'blessing-card-body';
      body.textContent = visible.wish;
      const footer = document.createElement('div');
      footer.className = 'blessing-card-footer';
      const downloadButton = document.createElement('button');
      downloadButton.className = 'btn-glass';
      downloadButton.textContent = '🖼️ บันทึกการ์ด (PNG)';
      downloadButton.addEventListener('click', () => {
        this.generateAndDownloadCard(visible);
      });
      const deleteButton = document.createElement('button');
      deleteButton.className = 'btn-glass';
      deleteButton.textContent = '🗑️ ลบ';
      deleteButton.addEventListener('click', async () => {
        if (confirm(`คุณต้องการลบกระทงของ "${visible.name}" ใช่หรือไม่?`)) {
          await LoyDB.deleteKrathong(k.id);
          const updated = await LoyDB.getAllKrathongs();
          await this.river.loadKrathongs(updated);
          this.renderBlessingsList(this.dom.blessingsSearchInput.value);
        }
      });
      footer.append(downloadButton, deleteButton);
      card.append(header, body, footer);
      this.dom.blessingsList.appendChild(card);
    });
  }

  filterBlessings(query) {
    this.renderBlessingsList(query);
  }

  getPrivacySafeKrathong(krathong) {
    if (krathong.privacy === 'private') {
      return { ...krathong, name: 'กระทงส่วนตัว', wish: 'คำอธิษฐานนี้เป็นส่วนตัว' };
    }
    if (krathong.privacy === 'anonymous') {
      return { ...krathong, name: 'ไม่ประสงค์ออกนาม' };
    }
    return krathong;
  }

  async shareDraftKrathong() {
    const krathong = this.getPrivacySafeKrathong(await this.getDraftKrathong());
    await this.generateAndDownloadCard(krathong, true);
  }

  async downloadDraftKrathong() {
    const krathong = this.getPrivacySafeKrathong(await this.getDraftKrathong());
    await this.generateAndDownloadCard(krathong);
  }

  // --- POSTCARD PNG CARD GENERATOR ---

  async generateAndDownloadCard(krathong, share = false) {
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
    const blob = await new Promise((resolve) => cardCanvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('ไม่สามารถสร้างภาพกระทงได้');

    const file = new File([blob], 'LoyKrathong.png', { type: 'image/png' });
    if (share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'ลอยกระทงออนไลน์',
        text: 'กระทงและคำอธิษฐานของฉัน',
        files: [file]
      });
    } else {
      const downloadLink = document.createElement('a');
      downloadLink.download = `LoyKrathong_${krathong.name.replace(/\s+/g, '_')}.png`;
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.click();
      window.setTimeout(() => URL.revokeObjectURL(downloadLink.href), 1000);
    }
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

    // ตรวจสอบประเภทไฟล์
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      event.target.value = '';
      return;
    }

    // จำกัดขนาดไฟล์ 10 MB
    if (file.size > 10 * 1024 * 1024) {
      alert('รูปภาพต้องมีขนาดไม่เกิน 10 MB');
      event.target.value = '';
      return;
    }

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
        reader.readAsDataURL(file);
      });

      // ตรวจสอบว่ารูปโหลดได้จริง
      const img = await this.loadImageAsync(dataUrl);

      if (!img) {
        throw new Error('ไม่สามารถเปิดรูปภาพนี้ได้');
      }
    

      // บันทึกรูปภาพลง IndexedDB
      const bgObj = {
        name: file.name.replace(/\.[^/.]+$/, ''),
        dataUrl: dataUrl
      };

      const saved = await LoyDB.saveCustomBackground(bgObj);

      // บันทึก Background ที่กำลังใช้งาน
      await LoyDB.setSetting('activeBackgroundId', saved.id);

      // แสดงพื้นหลังใหม่
      this.river.setBackground({
        imgElement: img
      });

      this.playChimeSound();

      alert('เปลี่ยนฉากหลังสำเร็จแล้ว! 🪷');

    } catch (err) {
      console.error('Background Upload Error:', err);
      alert('ไม่สามารถเปลี่ยนฉากหลังได้: ' + err.message);

    } finally {
      event.target.value = '';
    }
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
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลทั้งหมด? (กระทงทั้งหมดและรูปภาพที่อัปโหลดจะถูกลบถาวร)')) {
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
