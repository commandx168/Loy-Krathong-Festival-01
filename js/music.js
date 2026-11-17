document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('backgroundMusic');
  const button = document.getElementById('musicToggleBtn');
  const label = button.querySelector('.music-button-text');
  audio.volume = 0.15;
  const update = () => {
    const playing = !audio.paused;
    label.textContent = playing ? 'หยุดเพลง' : 'เล่นเพลง';
    button.setAttribute('aria-label', playing ? 'หยุดเพลง' : 'เล่นเพลง');
    button.title = playing ? 'หยุดเพลงลอยกระทง' : 'เล่นเพลงลอยกระทง';
  };
  button.addEventListener('click', async () => {
    if (!audio.paused) audio.pause();
    else {
      try { await audio.play(); }
      catch (error) { console.warn('Music playback requires a user gesture:', error); }
    }
    update();
  });
  audio.addEventListener('play', update);
  audio.addEventListener('pause', update);
  update();
});
