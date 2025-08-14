(function() {
  const ACCESS_KEY = 'vitalora_academy_access';
  const VALID_CODE = '000000';

  function qs(sel) { return document.querySelector(sel); }

  function showGate() {
    const gate = qs('#access-gate');
    if (!gate) return;
    gate.classList.add('visible');
    gate.setAttribute('aria-hidden', 'false');
    const first = gate.querySelector('.code-digit');
    if (first) setTimeout(() => first.focus(), 60);
  }

  function hideGate() {
    const gate = qs('#access-gate');
    if (!gate) return;
    gate.classList.remove('visible');
    gate.setAttribute('aria-hidden', 'true');
  }

  function isAuthorized() {
    try {
      return localStorage.getItem(ACCESS_KEY) === 'granted';
    } catch (e) {
      return false;
    }
  }

  function authorize() {
    try { localStorage.setItem(ACCESS_KEY, 'granted'); } catch (e) {}
    hideGate();
  }

  function setupInputs() {
    const inputs = Array.from(document.querySelectorAll('.code-digit'));
    const btn = qs('.access-btn');
    const err = qs('#access-error');

    function updateButton() {
      const code = inputs.map(i => i.value).join('');
      const ready = code.length === 6;
      btn.disabled = !ready;
    }

    inputs.forEach((inp, idx) => {
      inp.addEventListener('input', (e) => {
        const v = e.target.value.replace(/\D/g, '');
        e.target.value = v.slice(-1);
        if (v && idx < inputs.length - 1) inputs[idx + 1].focus();
        updateButton();
      });

      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !inp.value && idx > 0) {
          inputs[idx - 1].focus();
        }
        if ((e.key === 'ArrowLeft' || e.key === 'ArrowUp') && idx > 0) inputs[idx - 1].focus();
        if ((e.key === 'ArrowRight' || e.key === 'ArrowDown') && idx < inputs.length - 1) inputs[idx + 1].focus();
      });
    });

    const form = qs('#access-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = inputs.map(i => i.value).join('');
      if (code === VALID_CODE) {
        err.textContent = '';
        authorize();
      } else {
        err.textContent = 'Onjuiste code. Probeer opnieuw.';
        inputs.forEach(i => i.value = '');
        inputs[0].focus();
        updateButton();
      }
    });

    updateButton();
  }

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthorized()) {
      showGate();
      setupInputs();
    }
  });
})();
