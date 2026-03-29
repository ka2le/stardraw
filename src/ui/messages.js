export function createMessages(messageEl) {
  let timeoutId = null;

  function show(text, durationMs = 2600, type = 'info') {
    messageEl.textContent = text;
    messageEl.className = `toast toast--${type}`;
    if (timeoutId) clearTimeout(timeoutId);
    if (durationMs > 0) timeoutId = setTimeout(hide, durationMs);
  }

  function hide() {
    messageEl.className = 'toast hidden';
  }

  return { show, hide };
}
