export function createHud(dom) {
  function setStars(collected, total = null) {
    dom.starsEl.textContent = total == null ? String(collected) : `${collected}/${total}`;
  }

  function setLives(value) {
    dom.livesEl.textContent = String(value);
  }

  function setKeys(value) {
    dom.keysEl.textContent = String(value);
  }

  function setBootsActive(active) {
    dom.bootsEl.textContent = active ? 'Active' : 'Off';
    dom.bootsCard.classList.toggle('hud-card--active', active);
  }

  return { setStars, setLives, setKeys, setBootsActive };
}
