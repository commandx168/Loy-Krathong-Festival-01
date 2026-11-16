/**
 * editor.js - Interactive HTML5 Canvas Krathong Builder
 * Allows selecting base, adding preset flowers/candles/custom images,
 * free dragging, scaling, rotating, reordering layers, and exporting composite PNG.
 */

class KrathongEditor {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.width = options.width || 480;
    this.height = options.height || 360;

    // Internal state
    this.base = null; // { id, name, type, src, imgElement, width, height, x, y }
    this.decorations = []; // Array of decoration objects
    this.selectedItem = null; // Reference to currently selected item
    this.nextZIndex = 1;

    // Interaction flags
    this.isDragging = false;
    this.isTransforming = false;
    this.transformMode = null; // 'rotate', 'scale', 'drag'
    this.dragStart = { x: 0, y: 0 };
    this.itemStartProps = null;

    // UI callbacks
    this.onSelectionChange = options.onSelectionChange || null;
    this.onChange = options.onChange || null;

    // HiDPI support
    this.dpr = window.devicePixelRatio || 1;
    this.setupCanvasDimensions();

    // Event listeners
    this.initEvents();
  }

  setupCanvasDimensions() {
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.scale(this.dpr, this.dpr);
  }

  // Load an image from URL or SVG string
  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  }

  // Set the base of the krathong
  async setBase(baseAssetOrCustom) {
    let src = baseAssetOrCustom.dataUrl || baseAssetOrCustom.src;
    if (!src && baseAssetOrCustom.svg) {
      src = svgToDataUrl(baseAssetOrCustom.svg);
    }

    try {
      const img = await this.loadImage(src);
      const baseWidth = 320;
      const baseHeight = (img.height / img.width) * baseWidth;

      this.base = {
        id: baseAssetOrCustom.id,
        name: baseAssetOrCustom.name,
        type: 'base',
        src: src,
        imgElement: img,
        x: this.width / 2,
        y: this.height / 2 + 50,
        width: baseWidth,
        height: baseHeight,
        scale: 1,
        rotation: 0
      };

      this.redraw();
      if (this.onChange) this.onChange();
    } catch (err) {
      console.error('Failed to load base image:', err);
    }
  }

  // Add a decoration (flower, candle, custom sticker)
  async addDecoration(itemAssetOrCustom, customProps = {}) {
    let src = itemAssetOrCustom.dataUrl || itemAssetOrCustom.src;
    if (!src && itemAssetOrCustom.svg) {
      src = svgToDataUrl(itemAssetOrCustom.svg);
    }

    try {
      const img = await this.loadImage(src);

      // Determine appropriate default size
      let defaultWidth = 85;
      let defaultHeight = 85;
      if (itemAssetOrCustom.id === 'item_incense_candle') {
        defaultWidth = 75;
        defaultHeight = (img.height / img.width) * defaultWidth;
      } else if (img.width && img.height) {
        const aspect = img.height / img.width;
        defaultHeight = defaultWidth * aspect;
      }

      // Default spawn position: slightly scattered around krathong bed
      const scatterX = (Math.random() - 0.5) * 80;
      const scatterY = (Math.random() - 0.5) * 40;
      const initialY = itemAssetOrCustom.id === 'item_incense_candle'
        ? (this.height / 2 - 10)
        : (this.height / 2 + 15 + scatterY);

      const deco = {
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        assetId: itemAssetOrCustom.id,
        name: itemAssetOrCustom.name || 'ของตกแต่ง',
        meaning: itemAssetOrCustom.meaning || '',
        wishTemplate: itemAssetOrCustom.wishTemplate || '',
        type: itemAssetOrCustom.type || 'decoration',
        src: src,
        imgElement: img,
        x: customProps.x !== undefined ? customProps.x : (this.width / 2 + scatterX),
        y: customProps.y !== undefined ? customProps.y : initialY,
        width: customProps.width || defaultWidth,
        height: customProps.height || defaultHeight,
        scale: customProps.scale || 1.0,
        rotation: customProps.rotation || (Math.random() * 20 - 10), // gentle natural tilt
        zIndex: this.nextZIndex++
      };

      // If it is incense/candle, put it at a lower zIndex so flowers sit in front of its base
      if (itemAssetOrCustom.id === 'item_incense_candle') {
        deco.zIndex = 0;
      }

      this.decorations.push(deco);
      this.selectItem(deco);
      this.sortDecorationsByZIndex();
      this.redraw();

      if (this.onChange) this.onChange();
      return deco;
    } catch (err) {
      console.error('Failed to add decoration:', err);
      return null;
    }
  }

  // Remove a decoration
  removeDecoration(id) {
    const idx = this.decorations.findIndex((d) => d.id === id);
    if (idx !== -1) {
      if (this.selectedItem && this.selectedItem.id === id) {
        this.selectItem(null);
      }
      this.decorations.splice(idx, 1);
      this.redraw();
      if (this.onChange) this.onChange();
    }
  }

  // Clear all decorations
  clearDecorations() {
    this.decorations = [];
    this.selectItem(null);
    this.redraw();
    if (this.onChange) this.onChange();
  }

  // Reorder layers
  bringForward(id) {
    const idx = this.decorations.findIndex((d) => d.id === id);
    if (idx !== -1 && idx < this.decorations.length - 1) {
      const temp = this.decorations[idx];
      this.decorations[idx] = this.decorations[idx + 1];
      this.decorations[idx + 1] = temp;
      this.reassignZIndexes();
      this.redraw();
      if (this.onChange) this.onChange();
    }
  }

  sendBackward(id) {
    const idx = this.decorations.findIndex((d) => d.id === id);
    if (idx > 0) {
      const temp = this.decorations[idx];
      this.decorations[idx] = this.decorations[idx - 1];
      this.decorations[idx - 1] = temp;
      this.reassignZIndexes();
      this.redraw();
      if (this.onChange) this.onChange();
    }
  }

  bringToFront(id) {
    const idx = this.decorations.findIndex((d) => d.id === id);
    if (idx !== -1 && idx < this.decorations.length - 1) {
      const item = this.decorations.splice(idx, 1)[0];
      this.decorations.push(item);
      this.reassignZIndexes();
      this.redraw();
      if (this.onChange) this.onChange();
    }
  }

  sendToBack(id) {
    const idx = this.decorations.findIndex((d) => d.id === id);
    if (idx > 0) {
      const item = this.decorations.splice(idx, 1)[0];
      this.decorations.unshift(item);
      this.reassignZIndexes();
      this.redraw();
      if (this.onChange) this.onChange();
    }
  }

  reassignZIndexes() {
    this.decorations.forEach((item, index) => {
      item.zIndex = index + 1;
    });
    this.nextZIndex = this.decorations.length + 1;
  }

  sortDecorationsByZIndex() {
    this.decorations.sort((a, b) => a.zIndex - b.zIndex);
  }

  selectItem(item) {
    this.selectedItem = item;
    if (this.onSelectionChange) {
      this.onSelectionChange(this.selectedItem);
    }
    this.redraw();
  }

  // Update selected item attributes directly
  updateSelectedItem(props) {
    if (!this.selectedItem) return;
    if (props.scale !== undefined) this.selectedItem.scale = Math.max(0.2, Math.min(3.5, props.scale));
    if (props.rotation !== undefined) this.selectedItem.rotation = props.rotation;
    if (props.x !== undefined) this.selectedItem.x = props.x;
    if (props.y !== undefined) this.selectedItem.y = props.y;
    this.redraw();
    if (this.onChange) this.onChange();
  }

  // --- DRAWING / RENDERING ---

  redraw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Subtle water rippling guide ellipse under krathong
    this.drawWaterGuideline();

    // 1. Draw Base
    if (this.base && this.base.imgElement) {
      this.ctx.save();
      this.ctx.translate(this.base.x, this.base.y);
      this.ctx.rotate((this.base.rotation * Math.PI) / 180);
      this.ctx.scale(this.base.scale, this.base.scale);
      this.ctx.drawImage(
        this.base.imgElement,
        -this.base.width / 2,
        -this.base.height / 2,
        this.base.width,
        this.base.height
      );
      this.ctx.restore();
    }

    // 2. Draw Decorations in order of zIndex
    for (const item of this.decorations) {
      if (!item.imgElement) continue;
      this.ctx.save();
      this.ctx.translate(item.x, item.y);
      this.ctx.rotate((item.rotation * Math.PI) / 180);
      this.ctx.scale(item.scale, item.scale);
      this.ctx.drawImage(
        item.imgElement,
        -item.width / 2,
        -item.height / 2,
        item.width,
        item.height
      );
      this.ctx.restore();
    }

    // 3. Draw Transform Controls for selected item
    if (this.selectedItem) {
      this.drawTransformControls(this.selectedItem);
    }
  }

  drawWaterGuideline() {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.ellipse(this.width / 2, this.height / 2 + 75, 145, 30, 0, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(77, 208, 225, 0.25)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([6, 6]);
    this.ctx.stroke();

    this.ctx.fillStyle = 'rgba(77, 208, 225, 0.4)';
    this.ctx.font = '12px "Kanit", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('ผิวน้ำ (Waterline)', this.width / 2, this.height / 2 + 115);
    this.ctx.restore();
  }

  drawTransformControls(item) {
    this.ctx.save();
    this.ctx.translate(item.x, item.y);
    this.ctx.rotate((item.rotation * Math.PI) / 180);

    const w = item.width * item.scale;
    const h = item.height * item.scale;
    const halfW = w / 2;
    const halfH = h / 2;

    // Bounding box dashed line
    this.ctx.strokeStyle = '#ffd54f';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([4, 4]);
    this.ctx.strokeRect(-halfW - 4, -halfH - 4, w + 8, h + 8);

    // Corner Resize Handles
    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#ff9800';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([]);

    const handleRadius = 6;
    // Bottom Right (scale handle)
    this.ctx.beginPath();
    this.ctx.arc(halfW + 4, halfH + 4, handleRadius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    // Top Rotation Stem & Handle
    this.ctx.beginPath();
    this.ctx.moveTo(0, -halfH - 4);
    this.ctx.lineTo(0, -halfH - 24);
    this.ctx.strokeStyle = '#ffd54f';
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(0, -halfH - 24, handleRadius + 1, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ffd54f';
    this.ctx.strokeStyle = '#e65100';
    this.ctx.fill();
    this.ctx.stroke();

    // Top-right Delete Button ('X')
    this.ctx.beginPath();
    this.ctx.arc(halfW + 10, -halfH - 10, 9, 0, Math.PI * 2);
    this.ctx.fillStyle = '#f44336';
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1.5;
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 11px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('✕', halfW + 10, -halfH - 9);

    this.ctx.restore();
  }

  // --- HIT TESTING ---

  getCanvasCoords(event) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    return {
      x: (clientX - rect.left) * (this.width / rect.width),
      y: (clientY - rect.top) * (this.height / rect.height)
    };
  }

  // Transform point into item's local coordinate space
  toLocalCoords(x, y, item) {
    const dx = x - item.x;
    const dy = y - item.y;
    const rad = (-item.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return {
      x: dx * cos - dy * sin,
      y: dx * sin + dy * cos
    };
  }

  testItemHit(x, y, item) {
    const local = this.toLocalCoords(x, y, item);
    const halfW = (item.width * item.scale) / 2;
    const halfH = (item.height * item.scale) / 2;
    return local.x >= -halfW && local.x <= halfW && local.y >= -halfH && local.y <= halfH;
  }

  testRotateHandleHit(x, y, item) {
    const local = this.toLocalCoords(x, y, item);
    const halfH = (item.height * item.scale) / 2;
    const handleY = -halfH - 24;
    const dist = Math.hypot(local.x - 0, local.y - handleY);
    return dist <= 14;
  }

  testScaleHandleHit(x, y, item) {
    const local = this.toLocalCoords(x, y, item);
    const halfW = (item.width * item.scale) / 2;
    const halfH = (item.height * item.scale) / 2;
    const dist = Math.hypot(local.x - (halfW + 4), local.y - (halfH + 4));
    return dist <= 14;
  }

  testDeleteHandleHit(x, y, item) {
    const local = this.toLocalCoords(x, y, item);
    const halfW = (item.width * item.scale) / 2;
    const halfH = (item.height * item.scale) / 2;
    const dist = Math.hypot(local.x - (halfW + 10), local.y - (-halfH - 10));
    return dist <= 14;
  }

  // --- EVENT HANDLERS ---

  initEvents() {
    const onPointerDown = (e) => {
      const pos = this.getCanvasCoords(e);

      // 1. If an item is already selected, check handles first
      if (this.selectedItem) {
        if (this.testDeleteHandleHit(pos.x, pos.y, this.selectedItem)) {
          e.preventDefault();
          this.removeDecoration(this.selectedItem.id);
          return;
        }

        if (this.testRotateHandleHit(pos.x, pos.y, this.selectedItem)) {
          e.preventDefault();
          this.isTransforming = true;
          this.transformMode = 'rotate';
          this.dragStart = pos;
          this.itemStartProps = {
            rotation: this.selectedItem.rotation,
            cx: this.selectedItem.x,
            cy: this.selectedItem.y
          };
          return;
        }

        if (this.testScaleHandleHit(pos.x, pos.y, this.selectedItem)) {
          e.preventDefault();
          this.isTransforming = true;
          this.transformMode = 'scale';
          this.dragStart = pos;
          const initialDist = Math.hypot(pos.x - this.selectedItem.x, pos.y - this.selectedItem.y);
          this.itemStartProps = {
            scale: this.selectedItem.scale,
            initialDist: Math.max(initialDist, 10)
          };
          return;
        }
      }

      // 2. Check if clicked on any decoration (top-most first)
      let found = null;
      for (let i = this.decorations.length - 1; i >= 0; i--) {
        const item = this.decorations[i];
        if (this.testItemHit(pos.x, pos.y, item)) {
          found = item;
          break;
        }
      }

      if (found) {
        e.preventDefault();
        this.selectItem(found);
        this.isDragging = true;
        this.transformMode = 'drag';
        this.dragStart = pos;
        this.itemStartProps = {
          x: found.x,
          y: found.y
        };
      } else {
        // Deselect if clicked empty space
        this.selectItem(null);
      }
    };

    const onPointerMove = (e) => {
      if (!this.selectedItem) return;
      const pos = this.getCanvasCoords(e);

      if (this.isDragging && this.transformMode === 'drag') {
        e.preventDefault();
        const dx = pos.x - this.dragStart.x;
        const dy = pos.y - this.dragStart.y;
        this.selectedItem.x = this.itemStartProps.x + dx;
        this.selectedItem.y = this.itemStartProps.y + dy;
        this.redraw();
        if (this.onChange) this.onChange();
      } else if (this.isTransforming && this.transformMode === 'rotate') {
        e.preventDefault();
        const angleRad = Math.atan2(pos.y - this.itemStartProps.cy, pos.x - this.itemStartProps.cx);
        let angleDeg = (angleRad * 180) / Math.PI + 90; // offset so top handle is 0
        this.selectedItem.rotation = Math.round(angleDeg);
        this.redraw();
        if (this.onChange) this.onChange();
      } else if (this.isTransforming && this.transformMode === 'scale') {
        e.preventDefault();
        const currentDist = Math.hypot(pos.x - this.selectedItem.x, pos.y - this.selectedItem.y);
        const scaleFactor = currentDist / this.itemStartProps.initialDist;
        const newScale = Math.max(0.2, Math.min(3.5, this.itemStartProps.scale * scaleFactor));
        this.selectedItem.scale = parseFloat(newScale.toFixed(2));
        this.redraw();
        if (this.onChange) this.onChange();
      }
    };

    const onPointerUp = () => {
      this.isDragging = false;
      this.isTransforming = false;
      this.transformMode = null;
    };

    // Attach listeners
    this.canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    this.canvas.addEventListener('touchstart', onPointerDown, { passive: false });
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);

    // Keyboard delete / nudge
    window.addEventListener('keydown', (e) => {
      if (!this.selectedItem) return;
      // If typing in input / textarea, don't trigger editor keys
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        this.removeDecoration(this.selectedItem.id);
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        this.selectedItem.x -= 2;
        this.redraw();
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        this.selectedItem.x += 2;
        this.redraw();
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        this.selectedItem.y -= 2;
        this.redraw();
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        this.selectedItem.y += 2;
        this.redraw();
        e.preventDefault();
      }
    });
  }

  // --- RENDER COMPOSITE IMAGE (HIGH-RES PNG FOR RIVER & CARDS) ---

  /**
   * Renders the complete krathong at high resolution (no guidelines or transform handles)
   * returns DataURL (image/png)
   */
  async renderCompositeImage(exportWidth = 480, exportHeight = 360) {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportWidth;
    exportCanvas.height = exportHeight;
    const ctx = exportCanvas.getContext('2d');

    // Scale ratio from editor canvas to export canvas
    const scaleRatio = exportWidth / this.width;

    // 1. Draw Base
    if (this.base && this.base.imgElement) {
      ctx.save();
      ctx.translate(this.base.x * scaleRatio, this.base.y * scaleRatio);
      ctx.rotate((this.base.rotation * Math.PI) / 180);
      ctx.scale(this.base.scale * scaleRatio, this.base.scale * scaleRatio);
      ctx.drawImage(
        this.base.imgElement,
        -this.base.width / 2,
        -this.base.height / 2,
        this.base.width,
        this.base.height
      );
      ctx.restore();
    }

    // 2. Draw Decorations in order
    for (const item of this.decorations) {
      if (!item.imgElement) continue;
      ctx.save();
      ctx.translate(item.x * scaleRatio, item.y * scaleRatio);
      ctx.rotate((item.rotation * Math.PI) / 180);
      ctx.scale(item.scale * scaleRatio, item.scale * scaleRatio);
      ctx.drawImage(
        item.imgElement,
        -item.width / 2,
        -item.height / 2,
        item.width,
        item.height
      );
      ctx.restore();
    }

    return exportCanvas.toDataURL('image/png');
  }

  // Get summary of items on the krathong (for blessings feed)
  getDecorationsSummary() {
    return this.decorations.map((d) => ({
      assetId: d.assetId,
      name: d.name,
      meaning: d.meaning
    }));
  }
}

// Global exposure
window.KrathongEditor = KrathongEditor;
