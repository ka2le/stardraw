export function createWinModal(dom, { onRestart, onImport }) {
  function show({ collected, total }) {
    dom.winStars.textContent = `${collected} / ${total}`;
    dom.winModal.classList.remove('hidden');
    dom.winBackdrop.classList.remove('hidden');
  }

  function hide() {
    dom.winModal.classList.add('hidden');
    dom.winBackdrop.classList.add('hidden');
  }

  dom.restartButton.addEventListener('click', async () => {
    hide();
    await onRestart();
  });

  dom.newLevelButton.addEventListener('click', () => {
    hide();
    onImport();
  });

  dom.winBackdrop.addEventListener('click', hide);

  return { show, hide };
}
