export function createMenuController(dom, { onImport, onImportBackground, onReload }) {
  const open = () => {
    dom.menuPanel.classList.remove('hidden');
    dom.menuBackdrop.classList.remove('hidden');
    dom.menuButton.setAttribute('aria-expanded', 'true');
  };

  const close = () => {
    dom.menuPanel.classList.add('hidden');
    dom.menuBackdrop.classList.add('hidden');
    dom.menuButton.setAttribute('aria-expanded', 'false');
  };

  const toggle = () => {
    if (dom.menuPanel.classList.contains('hidden')) open();
    else close();
  };

  dom.menuButton.addEventListener('click', toggle);
  dom.menuBackdrop.addEventListener('click', close);
  dom.importButton.addEventListener('click', () => dom.levelFileInput.click());
  dom.backgroundButton.addEventListener('click', () => dom.backgroundFileInput.click());
  dom.levelFileInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await onImport(file);
    event.target.value = '';
    close();
  });
  dom.backgroundFileInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await onImportBackground(file);
    event.target.value = '';
    close();
  });

  dom.reloadButton.addEventListener('click', async () => {
    await onReload();
    close();
  });

  return { open, close, toggle };
}
