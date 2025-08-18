// Generic lesson script v3: autosave all [data-store] inputs per lesson
(function () {
  const root = document.querySelector('main.lesson');
  if (!root) return;

  const lessonId = root.dataset.lessonId || 'lesson';
  const doneKey  = `${lessonId}_done`;

  // Restore + autosave for any input/textarea/select with [data-store]
  const fields = Array.from(root.querySelectorAll('[data-store]'));
  fields.forEach(el => {
    const name = el.getAttribute('name') || el.id;
    if (!name) return;
    const key = `${lessonId}:${name}`;

    // Restore
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      if (el.type === 'radio' || el.type === 'checkbox') {
        el.checked = (el.value === saved);
      } else {
        el.value = saved;
      }
    }

    // Autosave on change/input
    const handler = () => {
      try {
        const val = (el.type === 'radio' || el.type === 'checkbox')
          ? (el.checked ? el.value : (localStorage.getItem(key) || ''))
          : (el.value ?? '');
        if (val === '') {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, val);
        }
      } catch {}
    };

    el.addEventListener('input', handler);
    el.addEventListener('change', handler);
  });

  // Manual "save all" button (optional)
  const saveAllBtn = document.getElementById('saveAll');
  const saveMsg    = document.getElementById('saveAllStatus');
  saveAllBtn?.addEventListener('click', () => {
    fields.forEach(el => el.dispatchEvent(new Event('change')));
    if (saveMsg) { saveMsg.textContent = 'Opgeslagen.'; setTimeout(()=> saveMsg.textContent='', 2000); }
  });

  // Reset for this lesson
  const resetBtn = document.getElementById('resetForm');
  resetBtn?.addEventListener('click', () => {
    if (!confirm('Weet je zeker dat je dit kaartje voor deze les wilt legen?')) return;
    fields.forEach(el => {
      const name = el.getAttribute('name') || el.id;
      if (!name) return;
      const key = `${lessonId}:${name}`;
      localStorage.removeItem(key);
      if (el.type === 'radio' || el.type === 'checkbox') {
        el.checked = false;
      } else {
        el.value = '';
      }
    });
  });

  // Mark complete
  const doneBtn = document.getElementById('markComplete');
  const doneMsg = document.getElementById('completeStatus');
  if (localStorage.getItem(doneKey) === 'true' && doneMsg) {
    doneMsg.textContent = 'Les voltooid ✓';
  }
  doneBtn?.addEventListener('click', () => {
    localStorage.setItem(doneKey, 'true');
    if (doneMsg) doneMsg.textContent = 'Les voltooid ✓';
  });
})();
