// Checkout page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Countdown Timer (mobile badge should show 5:00)
    let timeLeft = 5 * 60; // 5 minutes in seconds
    
    function updateTimer() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const timerDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update main timer
        const mainTimer = document.getElementById('timer');
        if (mainTimer) {
            mainTimer.textContent = timerDisplay;
        }
        
        // Update badge timers
        const badgeTimers = document.querySelectorAll('#badge-timer');
        badgeTimers.forEach(timer => {
            timer.textContent = timerDisplay;
        });
        
        if (timeLeft <= 0) {
            // Timer expired - you could redirect or show a message
            const expiredDisplay = '00:00';
            if (mainTimer) {
                mainTimer.textContent = expiredDisplay;
                mainTimer.style.color = '#ef4444';
            }
            badgeTimers.forEach(timer => {
                timer.textContent = expiredDisplay;
                timer.style.color = '#ef4444';
            });
            return;
        }
        
        timeLeft--;
        setTimeout(updateTimer, 1000);
    }
    
    updateTimer();

    // Deduplicate duplicated discounted totals (e.g., double € 27,00)
    // If for any reason multiple .discounted-price nodes are rendered inside
    // a single .total-price container, keep only the first one.
    try {
        document.querySelectorAll('.total-price').forEach(container => {
            const discountedNodes = container.querySelectorAll('.discounted-price');
            if (discountedNodes.length > 1) {
                discountedNodes.forEach((node, index) => {
                    if (index > 0) node.remove();
                });
            }
        });
        // Also remove any duplicate amounts inside the same .total block that
        // accidentally repeat the discounted price (seen on both desktop and mobile).
        document.querySelectorAll('.order-summary .total').forEach(totalEl => {
            const finalNode = totalEl.querySelector('.discounted-price');
            if (!finalNode) return;
            const normalize = (s) => (s || '').replace(/\s+/g, '').trim();
            const finalText = normalize(finalNode.textContent);
            if (!finalText) return;
            totalEl.querySelectorAll('*').forEach(el => {
                if (el === finalNode) return;
                if (el.classList && el.classList.contains('original-price')) return;
                if (normalize(el.textContent) === finalText) {
                    // Remove duplicates of the same discounted amount
                    el.remove();
                }
            });
        });
    } catch (_) {}

    // Ensure total block and correct price are visible on /checkout
    try {
        const path = (window.location && window.location.pathname) || '';
        const isCheckout = (path === '/checkout' || path === '/checkout-new.html');
        const isWachtEven = (path === '/wacht-even' || path === '/wacht-even.html');
        const priceText = isWachtEven ? '€ 27,00' : (isCheckout ? '€ 47,00' : null);

        if (priceText) {
            document.querySelectorAll('.order-summary').forEach(summary => {
                let totalEl = summary.querySelector('.total');
                if (!totalEl) {
                    totalEl = document.createElement('div');
                    totalEl.className = 'total';
                    const label = document.createElement('div');
                    label.className = 'total-label';
                    label.textContent = 'Totaal:';
                    const priceWrap = document.createElement('div');
                    priceWrap.className = 'total-price';
                    const priceSpan = document.createElement('span');
                    priceSpan.className = 'discounted-price';
                    priceSpan.textContent = priceText;
                    priceWrap.appendChild(priceSpan);
                    totalEl.appendChild(label);
                    totalEl.appendChild(priceWrap);
                    summary.appendChild(totalEl);
                } else {
                    // Update or create price inside existing total block
                    let priceSpan = totalEl.querySelector('.total-price .discounted-price');
                    if (!priceSpan) {
                        let priceWrap = totalEl.querySelector('.total-price');
                        if (!priceWrap) {
                            priceWrap = document.createElement('div');
                            priceWrap.className = 'total-price';
                            totalEl.appendChild(priceWrap);
                        }
                        priceSpan = document.createElement('span');
                        priceSpan.className = 'discounted-price';
                        priceWrap.appendChild(priceSpan);
                    }
                    priceSpan.textContent = priceText;
                }
            });
        }
    } catch (_) {}

    // Payment Method Selection
    const paymentMethods = document.querySelectorAll('.payment-method');
    
    paymentMethods.forEach(method => {
        method.addEventListener('click', function() {
            // Remove selected class from all methods
            paymentMethods.forEach(m => m.classList.remove('selected'));
            
            // Add selected class to clicked method
            this.classList.add('selected');
        });
    });

    // Form Validation and Submission
    const activeForm = (function(){
        const mobile = document.querySelector('.order-form-mobile');
        if (mobile && mobile.offsetParent !== null) return mobile;
        // Support both checkout.html (.order-form) and checkout-new.html (.checkout-form)
        return document.querySelector('.order-form') || document.querySelector('.checkout-form');
    })();
    const checkoutButton = activeForm?.querySelector('.checkout-button');
    const isWarmCheckout = document.body.classList.contains('page-checkout-warm');
    
    if (checkoutButton) {
        checkoutButton.addEventListener('click', async function(e) {
            e.preventDefault();
            
            // Get form inputs (scoped to active form)
            const firstName = activeForm.querySelector('input[placeholder="Voornaam"]')?.value?.trim() || '';
            const lastName = activeForm.querySelector('input[placeholder="Achternaam"]')?.value?.trim() || '';
            const email = activeForm.querySelector('input[placeholder="E-mailadres"]')?.value?.trim() || '';
            const termsEl = activeForm.querySelector('#terms') || activeForm.querySelector('#terms-mobile');
            const terms = !!termsEl && termsEl.checked;
            
            // Basic validation
            if (!firstName || !lastName || !email || !terms) {
                alert('Vul alle verplichte velden in en ga akkoord met de voorwaarden.');
                return;
            }
            
            if (!isValidEmail(email)) {
                alert('Vul een geldig e-mailadres in.');
                return;
            }
            
            // Add loading state
            this.textContent = 'Bezig met afrekenen...';
            this.disabled = true;

            try {
                // Determine amount per page
                const path = (window.location && window.location.pathname) || '';
                // Real pricing
                let amountValue = '27.00';
                if (path === '/checkout' || path === '/checkout-new.html') amountValue = '47.00';
                if (path === '/clean-reset' || path === '/clean-reset.html') amountValue = '47.00';
                if (path === '/wacht-even' || path === '/wacht-even.html') amountValue = '27.00';

                const origin = window.location?.origin || 'https://www.vitalora.nl';
                const body = {
                    amount: amountValue,
                    description: 'Clean Reset Cursus',
                    name: (firstName + ' ' + (lastName || '')).trim(),
                    email,
                    method: (function(){
                        // Check mobile dropdown first
                        const mobileSelect = document.getElementById('payment-method-mobile');
                        if (mobileSelect && mobileSelect.offsetParent !== null) {
                            return mobileSelect.value;
                        }
                        // Fallback to desktop selection
                        const m = document.querySelector('.payment-method.selected span')?.textContent?.toLowerCase();
                        if (!m) return undefined;
                        if (m.includes('ideal')) return 'ideal';
                        if (m.includes('bancontact')) return 'bancontact';
                        if (m.includes('credit')) return 'creditcard';
                        if (m.includes('klarna')) return 'klarna';
                        return undefined;
                    })(),
                    redirectUrl: `${origin}/gefeliciteerd.html`,
                    postSaleRedirect: `${origin}/bedankt.html`
                };

                const resp = await fetch('/api/create-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...body, enableRecurring: true })
                });
                const data = await resp.json();
                if (!resp.ok || !data.checkoutUrl) throw new Error('Kon betaalpagina niet openen');
                window.location.href = data.checkoutUrl;
            } catch (err) {
                alert('Er ging iets mis met starten van de betaling. Probeer opnieuw.');
                this.textContent = isWarmCheckout ? 'Veilig afrekenen →' : 'Afrekenen →';
                this.disabled = false;
            }
        });
    }

    // Email validation function
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Warm Vitalora country picker (avoids the browser/OS-native dropdown UI)
    const countryPicker = document.querySelector('[data-country-picker]');
    if (countryPicker) {
        const trigger = countryPicker.querySelector('.country-trigger');
        const listbox = countryPicker.querySelector('[role="listbox"]');
        const hiddenInput = countryPicker.querySelector('input[name="country"]');
        const label = countryPicker.querySelector('[data-country-label]');
        const options = Array.from(countryPicker.querySelectorAll('[role="option"]'));
        let activeIndex = Math.max(0, options.findIndex(option => option.getAttribute('aria-selected') === 'true'));

        const focusOption = index => {
            activeIndex = (index + options.length) % options.length;
            options[activeIndex].focus();
        };

        const closeCountryPicker = (returnFocus = false) => {
            countryPicker.classList.remove('is-open');
            listbox.hidden = true;
            trigger.setAttribute('aria-expanded', 'false');
            if (returnFocus) trigger.focus();
        };

        const openCountryPicker = () => {
            countryPicker.classList.add('is-open');
            listbox.hidden = false;
            trigger.setAttribute('aria-expanded', 'true');
            activeIndex = Math.max(0, options.findIndex(option => option.getAttribute('aria-selected') === 'true'));
            focusOption(activeIndex);
        };

        const selectCountry = option => {
            options.forEach(candidate => {
                const selected = candidate === option;
                candidate.classList.toggle('is-selected', selected);
                candidate.setAttribute('aria-selected', String(selected));
            });
            hiddenInput.value = option.dataset.value;
            label.textContent = option.dataset.value;
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
            closeCountryPicker(true);
        };

        trigger.addEventListener('click', () => {
            if (trigger.getAttribute('aria-expanded') === 'true') closeCountryPicker();
            else openCountryPicker();
        });

        trigger.addEventListener('keydown', event => {
            if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
                event.preventDefault();
                openCountryPicker();
                if (event.key === 'ArrowUp') focusOption(options.length - 1);
            }
        });

        options.forEach((option, index) => {
            option.addEventListener('click', () => selectCountry(option));
            option.addEventListener('keydown', event => {
                if (event.key === 'ArrowDown') { event.preventDefault(); focusOption(index + 1); }
                if (event.key === 'ArrowUp') { event.preventDefault(); focusOption(index - 1); }
                if (event.key === 'Home') { event.preventDefault(); focusOption(0); }
                if (event.key === 'End') { event.preventDefault(); focusOption(options.length - 1); }
                if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectCountry(option); }
                if (event.key === 'Escape') { event.preventDefault(); closeCountryPicker(true); }
                if (event.key === 'Tab') closeCountryPicker();
            });
        });

        document.addEventListener('click', event => {
            if (!countryPicker.contains(event.target)) closeCountryPicker();
        });
    }

    // Input focus effects
    const formInputs = document.querySelectorAll('.form-group input, .form-group select');
    
    formInputs.forEach(input => {
        if (isWarmCheckout) return;
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });

    // Checkout button hover effects
    if (checkoutButton && !isWarmCheckout) {
        checkoutButton.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 10px 25px rgba(16, 185, 129, 0.3)';
        });
        
        checkoutButton.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
        
        checkoutButton.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    }

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
            }
        });
    }, observerOptions);
    
    // Observe sections for animation
    const sections = document.querySelectorAll('.pfas-section, .benefits-section, .callout-box, .toxins-section');
    
    sections.forEach((section, index) => {
        observer.observe(section);
    });

    // Add subtle animations to checkmarks
    const checkmarks = document.querySelectorAll('.checkmark');
    
    checkmarks.forEach((checkmark, index) => {
        setTimeout(() => {
            checkmark.style.transform = 'scale(1.2)';
            setTimeout(() => {
                checkmark.style.transform = 'scale(1)';
            }, 200);
        }, index * 100);
    });

    // Timer warning when getting low
    function checkTimerWarning() {
        if (timeLeft <= 60 && timeLeft > 0) { // Last minute
            const mainTimer = document.getElementById('timer');
            if (mainTimer) {
                mainTimer.style.animation = 'pulse 1s infinite';
            }
            
            const badgeTimers = document.querySelectorAll('#badge-timer');
            badgeTimers.forEach(timer => {
                timer.style.animation = 'pulse 1s infinite';
            });
        }
    }
    
    // Check timer warning every 10 seconds
    setInterval(checkTimerWarning, 10000);
});

// Add CSS animation for timer pulse
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }
`;
document.head.appendChild(style);
