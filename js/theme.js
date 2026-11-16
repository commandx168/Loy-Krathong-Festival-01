async function setTheme(theme) {
  if (!['light', 'dark'].includes(theme)) return;

  document.documentElement.dataset.theme = theme;
  const button = document.getElementById('themeToggleBtn');
  const icon = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');
  if (button && icon && label) {
    const switchingTo = theme === 'dark' ? 'light' : 'dark';
    icon.textContent = switchingTo === 'light' ? '☀️' : '🌙';
    label.textContent = switchingTo === 'light' ? 'โหมดสว่าง' : 'โหมดมืด';
    button.setAttribute('aria-label', `เปลี่ยนเป็น${switchingTo === 'light' ? 'โหมดสว่าง' : 'โหมดมืด'}`);
  }
  await window.LoyDB.setSetting('theme', theme);
}

async function initTheme() {
  const saved = await window.LoyDB.getSetting('theme', 'dark');
  await setTheme(['light', 'dark'].includes(saved) ? saved : 'dark');
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme || 'dark';
  setTheme(current === 'light' ? 'dark' : 'light');
}

window.ThemeManager = {
  init: initTheme,
  set: setTheme,
  toggle: toggleTheme
};