(function() {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('tk-ebook-modal');
    if (!modal) return;

    const openers = document.querySelectorAll('[data-modal-open]');
    const closers = modal.querySelectorAll('[data-modal-close]');
    const form = document.getElementById('tk-ebook-form');
    const loading = document.getElementById('tk-loading');
    const errorBox = document.getElementById('tk-ebook-error');
    const successBox = document.getElementById('tk-ebook-success');

    let lastFocusedElement = null;

    function setBodyScroll(disable) {
      document.body.style.overflow = disable ? 'hidden' : '';
    }

    function resetFeedback() {
      [errorBox, successBox].forEach(function(box) {
        if (!box) return;
        box.classList.remove('is-visible', 'is-error', 'is-success');
        box.textContent = '';
      });
    }

    function stopLoading() {
      if (loading) {
        loading.classList.remove('is-active');
        loading.setAttribute('aria-hidden', 'true');
      }
    }

    function openModal() {
      lastFocusedElement = document.activeElement;
      modal.classList.add('is-active');
      modal.setAttribute('aria-hidden', 'false');
      setBodyScroll(true);
      resetFeedback();
      if (form) {
        form.style.display = '';
        const firstField = form.querySelector('input');
        if (firstField) firstField.focus();
      }
      stopLoading();
    }

    function closeModal() {
      modal.classList.remove('is-active');
      modal.setAttribute('aria-hidden', 'true');
      setBodyScroll(false);
      resetFeedback();
      stopLoading();
      if (form) form.reset();
      if (form) form.style.display = '';
      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
      }
    }

    openers.forEach(function(btn) {
      btn.addEventListener('click', function(event) {
        event.preventDefault();
        openModal();
      });
    });

    closers.forEach(function(btn) {
      btn.addEventListener('click', function(event) {
        event.preventDefault();
        closeModal();
      });
    });

    modal.addEventListener('click', function(event) {
      if (event.target === modal) {
        closeModal();
      }
    });

    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && modal.classList.contains('is-active')) {
        event.preventDefault();
        closeModal();
      }
    });

    if (form) {
      form.addEventListener('submit', async function(event) {
        event.preventDefault();
        resetFeedback();

        const formData = new FormData(form);
        const payload = {};
        formData.forEach(function(value, key) {
          payload[key] = typeof value === 'string' ? value.trim() : value;
        });

        const firstName = payload.firstname || '';
        const email = payload.email || '';

        if (firstName.length < 2) {
          if (errorBox) {
            errorBox.textContent = 'Vul je voornaam in (minimaal 2 tekens).';
            errorBox.classList.add('is-visible', 'is-error');
          }
          return;
        }

        if (!emailRegex.test(email)) {
          if (errorBox) {
            errorBox.textContent = 'Vul een geldig e-mailadres in.';
            errorBox.classList.add('is-visible', 'is-error');
          }
          return;
        }

        payload.source = 'tk-ebook';

        if (loading) {
          loading.classList.add('is-active');
          loading.setAttribute('aria-hidden', 'false');
        }

        try {
          const response = await fetch(form.action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const data = await response.json().catch(function() { return {}; });

          if (!response.ok || !data.success) {
            const message = (data && data.error) ? data.error : 'Er ging iets mis. Probeer het opnieuw.';
            if (errorBox) {
              errorBox.textContent = message;
              errorBox.classList.add('is-visible', 'is-error');
            }
            stopLoading();
            return;
          }

          if (form) form.style.display = 'none';
          if (successBox) {
            successBox.textContent = 'Gelukt! Het e-book is naar je inbox gestuurd. Controleer eventueel ook je spam-map.';
            successBox.classList.add('is-visible', 'is-success');
          }

          stopLoading();
        } catch (error) {
          console.error('tk-ebook submit error', error);
          if (errorBox) {
            errorBox.textContent = 'We konden je aanvraag niet versturen. Controleer je verbinding en probeer het later opnieuw.';
            errorBox.classList.add('is-visible', 'is-error');
          }
          stopLoading();
        }
      });
    }
  });
})();
