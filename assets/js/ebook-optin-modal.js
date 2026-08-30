(function () {
  'use strict';

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const REQUEST_TIMEOUT_MS = 12000;

  document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('ebook-modal');
    const form = document.getElementById('ebook-form');
    if (!modal || !form) return;

    const openers = ['ebook-claim', 'ebook-claim-bottom', 'mobile-ebook-claim']
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);
    const closeButton = modal.querySelector('[data-ebook-optin-close]');
    const submitButton = form.querySelector('button[type="submit"]');
    const feedback = document.getElementById('ebook-feedback');
    const nameInput = document.getElementById('lead-name');
    const emailInput = document.getElementById('lead-email');
    if (!closeButton || !submitButton || !feedback || !nameInput || !emailInput) return;

    let lastFocusedElement = null;
    let submitting = false;
    let activeSubmissionId = 0;
    let activeAbortController = null;
    let activeTimeoutId = null;

    function setPageLocked(locked) {
      document.documentElement.classList.toggle('ebook-optin-modal-open', locked);
      document.body.classList.toggle('ebook-optin-modal-open', locked);
    }

    function resetFeedback() {
      feedback.hidden = true;
      feedback.textContent = '';
      submitButton.disabled = false;
      submitButton.textContent = 'Claim jouw exemplaar';
    }

    function showFeedback(message) {
      feedback.textContent = message;
      feedback.hidden = !message;
    }

    function focusableElements() {
      return Array.from(modal.querySelectorAll('button:not([disabled]), input:not([type="hidden"]):not([disabled]), a[href]'))
        .filter(function (element) { return !element.hidden; });
    }

    function cancelPendingRequest() {
      activeSubmissionId += 1;
      if (activeTimeoutId !== null) window.clearTimeout(activeTimeoutId);
      activeTimeoutId = null;
      if (activeAbortController) activeAbortController.abort();
      activeAbortController = null;
      submitting = false;
    }

    function openModal() {
      lastFocusedElement = document.activeElement;
      modal.classList.remove('hidden');
      modal.classList.add('is-active');
      modal.setAttribute('aria-hidden', 'false');
      setPageLocked(true);
      resetFeedback();
      nameInput.focus({ preventScroll: true });
    }

    function closeModal() {
      cancelPendingRequest();
      modal.classList.add('hidden');
      modal.classList.remove('is-active');
      modal.setAttribute('aria-hidden', 'true');
      setPageLocked(false);
      form.reset();
      resetFeedback();
      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus({ preventScroll: true });
      }
    }

    openers.forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        openModal();
      });
    });

    closeButton.addEventListener('click', function (event) {
      event.preventDefault();
      closeModal();
    });

    modal.addEventListener('click', function (event) {
      if (event.target === modal) closeModal();
    });

    document.addEventListener('keydown', function (event) {
      if (!modal.classList.contains('is-active')) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeModal();
        return;
      }
      if (event.key !== 'Tab') return;
      const elements = focusableElements();
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (submitting) return;
      showFeedback('');

      const firstName = String(nameInput.value || '').trim();
      const email = String(emailInput.value || '').trim();
      if (firstName.length < 2) {
        showFeedback('Vul je voornaam in (minimaal 2 tekens).');
        nameInput.focus();
        return;
      }
      if (!EMAIL_PATTERN.test(email)) {
        showFeedback('Vul een geldig e-mailadres in.');
        emailInput.focus();
        return;
      }

      submitting = true;
      submitButton.disabled = true;
      submitButton.textContent = 'Even geduld…';

      const submissionId = activeSubmissionId + 1;
      activeSubmissionId = submissionId;
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      activeAbortController = controller;
      let timedOut = false;
      let completed = false;
      let timeoutId = null;

      try {
        const timeout = new Promise(function (_, reject) {
          timeoutId = window.setTimeout(function () {
            timedOut = true;
            if (controller) controller.abort();
            reject(new Error('Dit duurt te lang. Controleer je verbinding en probeer opnieuw.'));
          }, REQUEST_TIMEOUT_MS);
          activeTimeoutId = timeoutId;
        });
        const requestOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstname: firstName, email: email, source: 'ebook_download' })
        };
        if (controller) requestOptions.signal = controller.signal;

        const responseWithData = Promise.resolve(fetch(form.action, requestOptions)).then(async function (response) {
          const data = await response.json().catch(function () { return {}; });
          return { response: response, data: data };
        });
        const result = await Promise.race([responseWithData, timeout]);
        if (submissionId !== activeSubmissionId || !modal.classList.contains('is-active')) return;
        if (!result.response.ok || !result.data.success) {
          throw new Error(result.data.error || 'Er ging iets mis. Probeer het opnieuw.');
        }

        try {
          localStorage.setItem('lead_data', JSON.stringify({
            name: firstName,
            email: email,
            source: 'ebook_download'
          }));
        } catch (error) {
          // De checkout blijft bruikbaar als lokale opslag is geblokkeerd.
        }

        completed = true;
        window.location.assign('/checkout');
      } catch (error) {
        if (submissionId !== activeSubmissionId || !modal.classList.contains('is-active')) return;
        showFeedback(timedOut
          ? 'Dit duurt te lang. Controleer je verbinding en probeer opnieuw.'
          : (error && error.message ? error.message : 'We konden je aanvraag niet versturen. Probeer het later opnieuw.'));
      } finally {
        if (timeoutId !== null) window.clearTimeout(timeoutId);
        if (submissionId !== activeSubmissionId) return;
        activeTimeoutId = null;
        activeAbortController = null;
        submitting = false;
        if (!completed && modal.classList.contains('is-active')) {
          submitButton.disabled = false;
          submitButton.textContent = 'Claim jouw exemplaar';
        }
      }
    });
  });
})();
