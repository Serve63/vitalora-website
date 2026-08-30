(function () {
  'use strict';

  const STORAGE_KEY = 'vitalora_blog_ebook_promo_v2';
  const SESSION_KEY = 'vitalora_blog_ebook_promo_seen_v2';
  const CLOSE_SUPPRESSION_MS = 30 * 24 * 60 * 60 * 1000;
  const SUCCESS_SUPPRESSION_MS = 90 * 24 * 60 * 60 * 1000;
  const SHOW_DELAY_MS = 3500;
  const REQUEST_TIMEOUT_MS = 12000;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function readSuppressedUntil(storage) {
    try {
      const stored = JSON.parse(storage.getItem(STORAGE_KEY) || 'null');
      return Number(stored && stored.suppressedUntil) || 0;
    } catch (error) {
      return 0;
    }
  }

  function remember(storage, duration) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify({
        suppressedUntil: Date.now() + duration
      }));
    } catch (error) {
      // De modal blijft bruikbaar wanneer browseropslag is geblokkeerd.
    }
  }

  function hasBeenSeen(storage) {
    try {
      return storage.getItem(SESSION_KEY) === '1';
    } catch (error) {
      return false;
    }
  }

  function rememberSeen(storage) {
    try {
      storage.setItem(SESSION_KEY, '1');
    } catch (error) {
      // De modal werkt ook zonder sessieopslag.
    }
  }

  function rememberLead(storage, firstName, email) {
    try {
      storage.setItem('lead_data', JSON.stringify({
        name: firstName,
        email: email,
        source: 'blog_ebook_popup'
      }));
    } catch (error) {
      // Voorinvullen van de checkout is alleen extra gemak.
    }
  }

  function browserStorage(win, name) {
    try {
      return win ? win[name] : null;
    } catch (error) {
      return null;
    }
  }

  function setupBlogEbookPromo(options) {
    const settings = options || {};
    const doc = settings.document || (typeof document !== 'undefined' ? document : null);
    const win = settings.window || (typeof window !== 'undefined' ? window : null);
    const storage = Object.prototype.hasOwnProperty.call(settings, 'storage')
      ? settings.storage
      : browserStorage(win, 'localStorage');
    const sessionStorage = Object.prototype.hasOwnProperty.call(settings, 'sessionStorage')
      ? settings.sessionStorage
      : browserStorage(win, 'sessionStorage');
    const request = settings.fetch || (win && typeof win.fetch === 'function' ? win.fetch.bind(win) : null);
    if (!doc || !win) return null;

    const promo = doc.querySelector('[data-blog-ebook-promo]');
    if (!promo || readSuppressedUntil(storage) > Date.now() || hasBeenSeen(sessionStorage)) return null;

    const closeButton = promo.querySelector('[data-blog-ebook-promo-close]');
    const form = promo.querySelector('[data-blog-ebook-promo-form]');
    const submitButton = promo.querySelector('[data-blog-ebook-promo-cta]');
    const feedback = promo.querySelector('[data-blog-ebook-promo-feedback]');
    const nameInput = form && form.querySelector('input[name="firstname"]');
    const emailInput = form && form.querySelector('input[name="email"]');
    if (!closeButton || !form || !submitButton || !nameInput || !emailInput) return null;

    let showTimer = null;
    let visible = false;
    let previousFocus = null;
    let submitting = false;
    let closing = false;
    let activeAbortController = null;
    let requestTimeoutId = null;
    let rejectPendingRequest = null;

    function clearPendingRequest() {
      if (requestTimeoutId !== null) win.clearTimeout(requestTimeoutId);
      requestTimeoutId = null;
      rejectPendingRequest = null;
      activeAbortController = null;
    }

    function cancelPendingRequest() {
      const reject = rejectPendingRequest;
      rejectPendingRequest = null;
      if (requestTimeoutId !== null) win.clearTimeout(requestTimeoutId);
      requestTimeoutId = null;
      if (activeAbortController) activeAbortController.abort();
      activeAbortController = null;
      if (reject) reject(new Error('Aanvraag geannuleerd.'));
    }

    function setPageLocked(locked) {
      if (doc.documentElement && doc.documentElement.classList) {
        doc.documentElement.classList.toggle('blog-ebook-promo-open', locked);
      }
      if (doc.body && doc.body.classList) {
        doc.body.classList.toggle('blog-ebook-promo-open', locked);
      }
    }

    function focusableElements() {
      if (typeof promo.querySelectorAll !== 'function') return [closeButton, nameInput, emailInput, submitButton];
      return Array.from(promo.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href]'))
        .filter(function (element) { return !element.hidden; });
    }

    function showFeedback(message) {
      if (!feedback) return;
      feedback.textContent = message;
      feedback.hidden = !message;
    }

    function reveal() {
      if (visible || closing || !promo.isConnected) return;
      visible = true;
      previousFocus = doc.activeElement && !promo.contains(doc.activeElement) ? doc.activeElement : null;
      rememberSeen(sessionStorage);
      promo.hidden = false;
      setPageLocked(true);
      win.removeEventListener('scroll', handleScroll);
      if (showTimer) win.clearTimeout(showTimer);
      (win.requestAnimationFrame || win.setTimeout).call(win, function () {
        promo.classList.add('is-visible');
        if (typeof nameInput.focus === 'function') nameInput.focus();
      });
    }

    function dismiss(duration) {
      if (!promo.isConnected || closing) return;
      closing = true;
      if (duration) remember(storage, duration);
      visible = false;
      submitting = false;
      cancelPendingRequest();
      win.removeEventListener('scroll', handleScroll);
      if (typeof doc.removeEventListener === 'function') doc.removeEventListener('keydown', handleKeydown);
      if (showTimer) win.clearTimeout(showTimer);
      promo.classList.remove('is-visible');
      promo.classList.add('is-closing');
      setPageLocked(false);
      win.setTimeout(function () {
        promo.remove();
        if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
      }, win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 230);
    }

    function handleScroll() {
      const pageHeight = Math.max(doc.documentElement.scrollHeight - win.innerHeight, 1);
      if (win.scrollY >= 420 || win.scrollY / pageHeight >= .18) reveal();
    }

    function handleKeydown(event) {
      if (!visible) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        dismiss(CLOSE_SUPPRESSION_MS);
        return;
      }
      if (event.key !== 'Tab') return;
      const elements = focusableElements();
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    async function handleSubmit(event) {
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
      if (!request) {
        showFeedback('We konden je aanvraag niet versturen. Probeer het later opnieuw.');
        return;
      }

      submitting = true;
      submitButton.disabled = true;
      submitButton.textContent = 'Even geduld…';
      let completed = false;

      try {
        const AbortControllerClass = settings.AbortController
          || (win && win.AbortController)
          || (typeof AbortController !== 'undefined' ? AbortController : null);
        activeAbortController = AbortControllerClass ? new AbortControllerClass() : null;
        const requestOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstname: firstName, email: email, source: 'blog_ebook_popup' })
        };
        if (activeAbortController) requestOptions.signal = activeAbortController.signal;

        const timeout = new Promise(function (_, reject) {
          rejectPendingRequest = reject;
          requestTimeoutId = win.setTimeout(function () {
            if (activeAbortController) activeAbortController.abort();
            reject(new Error('Dit duurt te lang. Controleer je verbinding en probeer opnieuw.'));
          }, REQUEST_TIMEOUT_MS);
        });
        const responseWithData = Promise.resolve(request(form.action, requestOptions)).then(async function (response) {
          const data = await response.json().catch(function () { return {}; });
          return { response: response, data: data };
        });
        const result = await Promise.race([responseWithData, timeout]);
        const response = result.response;
        const data = result.data;
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Er ging iets mis. Probeer het opnieuw.');
        }

        completed = true;
        remember(storage, SUCCESS_SUPPRESSION_MS);
        rememberLead(storage, firstName, email);
        win.location.assign('/checkout');
      } catch (error) {
        if (!visible || closing || !promo.isConnected) return;
        showFeedback(error && error.message ? error.message : 'We konden je aanvraag niet versturen. Probeer het later opnieuw.');
      } finally {
        clearPendingRequest();
        if (!completed && visible && !closing && promo.isConnected) {
          submitting = false;
          submitButton.disabled = false;
          submitButton.textContent = 'Claim jouw exemplaar';
        }
      }
    }

    closeButton.addEventListener('click', function () { dismiss(CLOSE_SUPPRESSION_MS); });
    promo.addEventListener('click', function (event) {
      if (event.target === promo) dismiss(CLOSE_SUPPRESSION_MS);
    });
    form.addEventListener('submit', handleSubmit);
    doc.addEventListener('keydown', handleKeydown);
    win.addEventListener('scroll', handleScroll, { passive: true });
    showTimer = win.setTimeout(reveal, SHOW_DELAY_MS);
    handleScroll();

    return {
      reveal: reveal,
      dismiss: dismiss,
      submit: handleSubmit,
      element: promo
    };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      setupBlogEbookPromo: setupBlogEbookPromo,
      STORAGE_KEY: STORAGE_KEY,
      SESSION_KEY: SESSION_KEY,
      CLOSE_SUPPRESSION_MS: CLOSE_SUPPRESSION_MS,
      SUCCESS_SUPPRESSION_MS: SUCCESS_SUPPRESSION_MS,
      REQUEST_TIMEOUT_MS: REQUEST_TIMEOUT_MS
    };
  }

  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        setupBlogEbookPromo();
      }, { once: true });
    } else {
      setupBlogEbookPromo();
    }
  }
})();
