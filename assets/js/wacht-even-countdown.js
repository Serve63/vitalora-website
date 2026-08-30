(function () {
  'use strict';

  const STORAGE_KEY = 'vitalora_wacht_even_deadline_v1';
  const DEFAULT_DURATION_MS = 30 * 60 * 1000;

  function safeRead(storage) {
    try {
      return Number(storage.getItem(STORAGE_KEY)) || 0;
    } catch (error) {
      return 0;
    }
  }

  function safeWrite(storage, value) {
    try {
      storage.setItem(STORAGE_KEY, String(value));
    } catch (error) {
      // De timer blijft in deze paginalaad werken als opslag is geblokkeerd.
    }
  }

  function browserStorage(win) {
    try {
      return win.sessionStorage;
    } catch (error) {
      return null;
    }
  }

  function setupWachtEvenCountdown(options) {
    const settings = options || {};
    const doc = settings.document || (typeof document !== 'undefined' ? document : null);
    const win = settings.window || (typeof window !== 'undefined' ? window : null);
    const storage = Object.prototype.hasOwnProperty.call(settings, 'storage') ? settings.storage : browserStorage(win);
    const now = settings.now || function () { return Date.now(); };
    if (!doc || !win) return null;

    const bar = doc.querySelector('[data-offer-countdown]');
    if (!bar) return null;
    const timer = bar.querySelector('[data-offer-countdown-timer]');
    const status = bar.querySelector('[data-offer-countdown-status]');
    if (!timer || !status) return null;

    const minutes = Math.max(1, Number(bar.dataset.durationMinutes) || 30);
    const duration = minutes * 60 * 1000 || DEFAULT_DURATION_MS;
    let deadline = safeRead(storage);
    if (!deadline) {
      deadline = now() + duration;
      safeWrite(storage, deadline);
    }
    let intervalId = null;
    let expired = false;

    function expire() {
      if (expired) return;
      expired = true;
      bar.classList.add('is-expired');
      status.textContent = 'Rond af wanneer jij wilt';
      timer.textContent = '00:00';
      timer.setAttribute('datetime', 'PT0S');
      timer.setAttribute('aria-label', 'Aftelperiode afgelopen');
      if (intervalId !== null) win.clearInterval(intervalId);
    }

    function render() {
      const remaining = Math.max(0, deadline - now());
      if (remaining <= 0) {
        expire();
        return;
      }
      const totalSeconds = Math.ceil(remaining / 1000);
      const displayMinutes = Math.floor(totalSeconds / 60);
      const displaySeconds = totalSeconds % 60;
      timer.textContent = String(displayMinutes).padStart(2, '0') + ':' + String(displaySeconds).padStart(2, '0');
      timer.setAttribute('datetime', 'PT' + totalSeconds + 'S');
      timer.setAttribute('aria-label', displayMinutes + ' minuten en ' + displaySeconds + ' seconden resterend');
    }

    render();
    if (!expired) intervalId = win.setInterval(render, 250);

    return {
      render: render,
      expire: expire,
      deadline: deadline,
      destroy: function () {
        if (intervalId !== null) win.clearInterval(intervalId);
      }
    };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      setupWachtEvenCountdown: setupWachtEvenCountdown,
      STORAGE_KEY: STORAGE_KEY,
      DEFAULT_DURATION_MS: DEFAULT_DURATION_MS
    };
  }

  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        setupWachtEvenCountdown();
      }, { once: true });
    } else {
      setupWachtEvenCountdown();
    }
  }
})();
