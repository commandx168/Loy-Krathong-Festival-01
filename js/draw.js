document.addEventListener('DOMContentLoaded', () => {
  const panel = document.getElementById('rewardPanel');
  const toggleBtn = document.getElementById('rewardToggleBtn');
  const button = document.getElementById('drawWinnerBtn');
  const viewWinnersBtn = document.getElementById('viewWinnersBtn');
  const result = document.getElementById('drawResult');

  const winnerModal = document.getElementById('winnerModal');
  const winnerModeBadge = document.getElementById('winnerModeBadge');
  const winnerModalSubtitle = document.getElementById('winnerModalSubtitle');
  const winnerModalName = document.getElementById('winnerModalName');
  const winnerModalMeta = document.getElementById('winnerModalMeta');
  const winnerHistorySection = document.getElementById('winnerHistorySection');
  const winnerHistoryList = document.getElementById('winnerHistoryList');
  const winnerDrawNextBtn = document.getElementById('winnerDrawNextBtn');

  const localPreview = ['localhost', '127.0.0.1'].includes(location.hostname)
    && new URLSearchParams(location.search).get('preview') === '30';
  const previewWinners = new Set();
  const previewHistory = [];

  if (localPreview) {
    button.textContent = 'ทดลองสุ่มจากกระทงตัวอย่าง 30 ใบ';
    result.textContent = 'โหมดทดลองในเครื่อง · ไม่ใช้รหัสและไม่บันทึกผู้ชนะจริง';
  }

  const setCollapsed = (collapsed) => {
    if (!panel || !toggleBtn) return;
    panel.classList.toggle('is-collapsed', collapsed);
    toggleBtn.setAttribute('aria-expanded', String(!collapsed));
    toggleBtn.textContent = collapsed ? '▾' : '▴';
  };

  if (panel && toggleBtn) {
    setCollapsed(true);
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setCollapsed(!panel.classList.contains('is-collapsed'));
    });
    panel.querySelector('.reward-panel-header')?.addEventListener('click', () => {
      setCollapsed(!panel.classList.contains('is-collapsed'));
    });
    document.addEventListener('click', (e) => {
      if (!panel.classList.contains('is-collapsed') && !panel.contains(e.target)) {
        setCollapsed(true);
      }
    });
  }

  const formatTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  const renderHistory = (items) => {
    if (!winnerHistorySection || !winnerHistoryList) return;
    winnerHistoryList.innerHTML = '';
    if (!items || !items.length) {
      winnerHistorySection.hidden = true;
      return;
    }
    items.slice(0, 20).forEach((item, index) => {
      const li = document.createElement('li');
      const nameSpan = document.createElement('span');
      nameSpan.textContent = `${index + 1}. ${item.display_name || item.name || '-'}`;
      const timeSpan = document.createElement('span');
      timeSpan.textContent = formatTime(item.drawn_at);
      li.append(nameSpan, timeSpan);
      winnerHistoryList.appendChild(li);
    });
    winnerHistorySection.hidden = false;
  };

  const fetchLiveHistory = async () => {
    try {
      const res = await fetch('/api/draw');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data.winners) ? data.winners : [];
    } catch {
      return [];
    }
  };

  const showWinnerModal = ({ name, remaining, subtitle, history }) => {
    if (!winnerModal) return;
    winnerModeBadge.hidden = !localPreview;
    winnerModalSubtitle.textContent = subtitle || 'ขอแสดงความยินดี ผู้ได้รับรางวัล';
    winnerModalName.textContent = name || 'ยังไม่มีรายชื่อผู้ได้รับรางวัล';
    winnerModalMeta.textContent = typeof remaining === 'number'
      ? `เหลือรายชื่อที่มีสิทธิ์สุ่มอีก ${remaining} รายชื่อ`
      : '';
    renderHistory(history);
    winnerModal.classList.add('active');
  };

  const performDraw = async () => {
    if (localPreview) {
      const entries = window.App?.river?.allKrathongs || [];
      if (entries.length !== 30) {
        result.textContent = 'กำลังเตรียมรายชื่อกระทงตัวอย่าง กรุณาลองอีกครั้ง';
        return;
      }
      const available = entries.filter((item) => !previewWinners.has(item.id));
      if (!available.length) {
        result.textContent = 'สุ่มครบ 30 ใบแล้ว · รีเฟรชหน้าเพื่อเริ่มใหม่';
        return;
      }
      const random = new Uint32Array(1);
      crypto.getRandomValues(random);
      const winner = available[random[0] % available.length];
      previewWinners.add(winner.id);
      previewHistory.unshift({ display_name: winner.name, drawn_at: new Date().toISOString() });
      const remaining = available.length - 1;
      result.textContent = `ทดลอง: ${winner.name} · เหลือ ${remaining} ใบ`;
      showWinnerModal({
        name: winner.name,
        remaining,
        history: previewHistory
      });
      return;
    }

    const code = sessionStorage.getItem('draw_admin_code') || prompt('กรอกรหัสสำหรับผู้บริหารเพื่อสุ่มรางวัล');
    if (!code) return;
    button.disabled = true;
    if (winnerDrawNextBtn) winnerDrawNextBtn.disabled = true;
    try {
      const response = await fetch('/api/draw', { method: 'POST', headers: { 'X-Draw-Admin': code } });
      const data = await response.json().catch(() => { throw new Error('API สุ่มรางวัลไม่พร้อมใช้งานบนเซิร์ฟเวอร์นี้'); });
      if (!response.ok) throw new Error(data.error || 'สุ่มรางวัลไม่สำเร็จ');
      sessionStorage.setItem('draw_admin_code', code);
      result.textContent = `ผู้ได้รับรางวัล: ${data.winner} · เหลือ ${data.remaining} รายชื่อ`;
      const history = await fetchLiveHistory();
      showWinnerModal({
        name: data.winner,
        remaining: data.remaining,
        history
      });
    } catch (error) {
      sessionStorage.removeItem('draw_admin_code');
      result.textContent = error.message;
    } finally {
      button.disabled = false;
      if (winnerDrawNextBtn) winnerDrawNextBtn.disabled = false;
    }
  };

  button.addEventListener('click', performDraw);
  winnerDrawNextBtn?.addEventListener('click', performDraw);

  viewWinnersBtn?.addEventListener('click', async () => {
    if (localPreview) {
      const latest = previewHistory[0]?.display_name;
      showWinnerModal({
        name: latest || 'ยังไม่มีผู้ได้รับรางวัล',
        subtitle: latest ? 'ผู้ได้รับรางวัลล่าสุด' : 'กดปุ่มสุ่มเพื่อเริ่มจับรางวัล',
        history: previewHistory
      });
      return;
    }
    const history = await fetchLiveHistory();
    const latest = history[0]?.display_name;
    showWinnerModal({
      name: latest || 'ยังไม่มีผู้ได้รับรางวัล',
      subtitle: latest ? 'ผู้ได้รับรางวัลล่าสุด' : 'กดปุ่มสุ่มเพื่อเริ่มจับรางวัล',
      history
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && winnerModal?.classList.contains('active')) {
      winnerModal.classList.remove('active');
    }
  });
});
