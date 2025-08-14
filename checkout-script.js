// Checkout page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Countdown Timer
    let timeLeft = 4 * 60 + 57; // 4 minutes and 57 seconds in seconds
    
    function updateTimer() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const timerDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timer').textContent = timerDisplay;
        
        if (timeLeft <= 0) {
            // Timer expired - you could redirect or show a message
            document.getElementById('timer').textContent = '00:00';
            document.getElementById('timer').style.color = '#ef4444';
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
    const checkoutForm = document.querySelector('.order-form');
    const checkoutButton = document.querySelector('.checkout-button');
    
    if (checkoutButton) {
        checkoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get form inputs
            const firstName = document.querySelector('input[placeholder="Voornaam"]').value;
            const lastName = document.querySelector('input[placeholder="Achternaam"]').value;
            const email = document.querySelector('input[placeholder="E-mailadres"]').value;
            const terms = document.getElementById('terms').checked;
            
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
            
            // Simulate payment processing
            setTimeout(() => {
                alert('Bedankt voor je bestelling! Je ontvangt binnenkort een bevestiging per e-mail.');
                this.textContent = 'Afrekenen €1,00 →';
                this.disabled = false;
            }, 2000);
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
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe sections for animation
    const sections = document.querySelectorAll('.pfas-section, .benefits-section, .callout-box, .toxins-section');
    
    sections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
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
            document.getElementById('timer').style.animation = 'pulse 1s infinite';
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
