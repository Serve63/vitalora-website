const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('ebook-modal');
    const form = document.getElementById('ebook-form');
    if (!modal || !form) return;

    const openers = ['ebook-claim', 'ebook-claim-bottom', 'mobile-ebook-claim']
        .map(id => document.getElementById(id))
        .filter(Boolean);
    const closeBtn = modal.querySelector('.modal-close');
    const backdrop = modal.querySelector('.modal-backdrop');
    const loading = document.getElementById('modal-loading');
    const errorBox = document.getElementById('ebook-error');
    const successBox = document.getElementById('ebook-success');
    const nameInput = document.getElementById('lead-name');
    const emailInput = document.getElementById('lead-email');

    let lastFocusedElement = null;

    function toggleBodyScroll(disable) {
        document.body.style.overflow = disable ? 'hidden' : '';
    }

    function resetFeedback() {
        [errorBox, successBox].forEach(box => {
            if (!box) return;
            box.classList.remove('is-visible');
            box.textContent = '';
        });
        if (loading) {
            loading.classList.remove('is-visible');
            loading.setAttribute('aria-hidden', 'true');
        }
        form.classList.remove('hidden');
    }

    function showFeedback(box, message) {
        if (!box) return;
        box.textContent = message;
        box.classList.add('is-visible');
    }

    function focusFirstField() {
        const target = form.querySelector('input:not([type="hidden"])');
        if (target) target.focus({ preventScroll: true });
    }

    function openModal() {
        lastFocusedElement = document.activeElement;
        modal.classList.remove('hidden');
        modal.classList.add('is-active');
        modal.setAttribute('aria-hidden', 'false');
        toggleBodyScroll(true);
        resetFeedback();
        focusFirstField();
    }

    function closeModal() {
        modal.classList.add('hidden');
        modal.classList.remove('is-active');
        modal.setAttribute('aria-hidden', 'true');
        toggleBodyScroll(false);
        form.reset();
        resetFeedback();
        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
            lastFocusedElement.focus({ preventScroll: true });
        }
    }

    openers.forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            openModal();
        });
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', event => {
            event.preventDefault();
            closeModal();
        });
    }

    if (backdrop) {
        backdrop.addEventListener('click', closeModal);
    }

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && modal.classList.contains('is-active')) {
            event.preventDefault();
            closeModal();
        }
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();
        resetFeedback();

        const firstName = (nameInput?.value || '').trim();
        const email = (emailInput?.value || '').trim();

        if (firstName.length < 2) {
            showFeedback(errorBox, 'Vul je voornaam in (minimaal 2 tekens).');
            return;
        }
        if (!emailRegex.test(email)) {
            showFeedback(errorBox, 'Vul een geldig e-mailadres in.');
            return;
        }

        const payload = {
            firstname: firstName,
            email,
            source: 'ebook_download'
        };

        if (loading) {
            loading.classList.add('is-visible');
            loading.setAttribute('aria-hidden', 'false');
        }

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.success) {
                const message = data?.error || 'Er ging iets mis. Probeer het opnieuw.';
                showFeedback(errorBox, message);
                return;
            }

            try {
                localStorage.setItem('lead_data', JSON.stringify({
                    name: firstName,
                    email,
                    source: 'ebook_download'
                }));
            } catch (_) {}

            form.classList.add('hidden');
            showFeedback(successBox, 'Gelukt! Het e-book is onderweg naar je inbox. Controleer zo nodig je spamfolder.');
        } catch (error) {
            console.error('ebook submit error', error);
            showFeedback(errorBox, 'We konden je aanvraag niet versturen. Controleer je verbinding en probeer het later opnieuw.');
        } finally {
            if (loading) {
                loading.classList.remove('is-visible');
                loading.setAttribute('aria-hidden', 'true');
            }
        }
    });

    const directAccessButton = document.querySelector('.direct-access');
    if (directAccessButton) {
        directAccessButton.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    }

    document.querySelectorAll('.testimonial-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.06)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        });
    });

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetElement = document.querySelector(this.getAttribute('href'));
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    if (nameInput) {
        nameInput.style.outline = 'none';
        nameInput.addEventListener('input', function() {
            if (this.value.length >= 2) {
                this.style.borderColor = '#10b981';
                this.style.borderWidth = '2px';
                this.style.backgroundColor = '#E0EEDF';
            } else {
                this.style.borderColor = '#C7D2FE';
                this.style.borderWidth = '1px';
                this.style.backgroundColor = '';
            }
        });
    }

    if (emailInput) {
        emailInput.style.outline = 'none';
        emailInput.addEventListener('input', function() {
            if (emailRegex.test(this.value.trim())) {
                this.style.borderColor = '#10b981';
                this.style.borderWidth = '2px';
                this.style.backgroundColor = '#E0EEDF';
            } else {
                this.style.borderColor = '#C7D2FE';
                this.style.borderWidth = '1px';
                this.style.backgroundColor = '';
            }
        });
    }
});
