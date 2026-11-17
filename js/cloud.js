const CloudAPI = {
  get token() { return localStorage.getItem('loy_guest_token'); },
  async request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (this.token) headers.set('Authorization', `Bearer ${this.token}`);
    const response = await fetch(path, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  },
  async ensureGuest(name) {
    if (this.token) return;
    const data = await this.request('/api/guests', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: name })
    });
    localStorage.setItem('loy_guest_token', data.token);
  },
  async list() { return this.request('/api/krathongs'); },
  async mine() {
    if (!this.token) return { items: [] };
    return this.request('/api/mine');
  },
  async upload(dataUrl) {
    const img = new Image();
    await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = dataUrl; });
    const canvas = document.createElement('canvas');
    canvas.width = 480; canvas.height = 360;
    canvas.getContext('2d').drawImage(img, 0, 0, 480, 360);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.72));
    if (!blob || blob.size > 250000) throw new Error('ภาพกระทงใหญ่เกิน 250 KB');
    return this.request('/api/media', { method: 'POST', headers: { 'Content-Type': 'image/webp' }, body: blob });
  },
  async create(data) {
    return this.request('/api/krathongs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
  },
  async remove(id) { return this.request(`/api/krathongs/${encodeURIComponent(id)}`, { method: 'DELETE' }); },
  async adminRemove(id, code) {
    return this.request(`/api/krathongs/${encodeURIComponent(id)}`, {
      method: 'DELETE', headers: { 'X-Delete-Admin': code }
    });
  },
  async privateImage(url) {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${this.token}` } });
    if (!response.ok) throw new Error('เปิดภาพส่วนตัวไม่ได้');
    return URL.createObjectURL(await response.blob());
  }
};
