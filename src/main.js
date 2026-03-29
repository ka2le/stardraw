import './style.css';
import { bootstrap } from './app/bootstrap.js';

bootstrap().catch((error) => {
  console.error(error);
  const messageEl = document.getElementById('message');
  if (messageEl) {
    messageEl.textContent = error.message || 'Failed to start Stardraw.';
    messageEl.classList.remove('hidden');
  }
});
