export function createDeathModal(dom, { onRestart, onImport }) {
  function show(lives) {
    dom.deathLives.textContent = String(lives);
    dom.deathBackdrop.classList.remove('hidden');
    dom.deathModal.classList.remove('hidden');
  }

  function hide() {
    dom.deathBackdrop.classList.add('hidden');
    dom.deathModal.classList.add('hidden');
  }

  dom.deathRestartButton.addEventListener('click', async () => {
    hide();
    await onRestart();
  });
  dom.deathNewLevelButton.addEventListener('click', () => {
    hide();
    onImport();
  });
  return { show, hide };
}
