// Checkout page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Countdown Timer
    let timeLeft = 4 * 60 + 57; // 4 minutes and 57 seconds in seconds
    
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
    const activeForm = document.querySelector('.order-form-mobile')?.offsetParent !== null
        ? document.querySelector('.order-form-mobile')
        : document.querySelector('.order-form');
    const checkoutButton = activeForm?.querySelector('.checkout-button');
    
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
            if (!firstName || !email || !terms) {
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
                const body = {
                    amount: '0.10',
                    description: 'Clean Reset Cursus',
                    name: (firstName + ' ' + (lastName || '')).trim(),
                    email,
                    method: (function(){
                        const m = document.querySelector('.payment-method.selected span')?.textContent?.toLowerCase();
                        if (!m) return undefined;
                        if (m.includes('ideal')) return 'ideal';
                        if (m.includes('bancontact')) return 'bancontact';
                        if (m.includes('credit')) return 'creditcard';
                        if (m.includes('klarna')) return 'klarna';
                        return undefined;
                    })()
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
                this.textContent = 'Afrekenen →';
                this.disabled = false;
            }
        });
    }

    // Email validation function
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Input focus effects
    const formInputs = document.querySelectorAll('.form-group input, .form-group select');
    
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });

    // Checkout button hover effects
    if (checkoutButton) {
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

    // Auto-fill country based on user's location (demo)
    const countrySelect = document.querySelector('select');
    if (countrySelect) {
        // For demo purposes, set to Netherlands
        countrySelect.value = 'Nederland';
    }

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
