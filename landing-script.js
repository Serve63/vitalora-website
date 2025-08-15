// Landing page interactions
document.addEventListener('DOMContentLoaded', function() {
    // Lead capture modal
    const modal = document.getElementById('ebook-modal');
    const openers = [document.getElementById('ebook-claim'), document.getElementById('ebook-claim-bottom')].filter(Boolean);
    const closeBtn = modal ? modal.querySelector('.modal-close') : null;
    const form = modal ? modal.querySelector('#ebook-form') : null;
    const feedback = modal ? modal.querySelector('#ebook-feedback') : null;

    function openModal() { if (!modal) return; modal.classList.remove('hidden'); modal.setAttribute('aria-hidden','false'); (modal.querySelector('input')||{}).focus?.(); }
    function closeModal() { if (!modal) return; modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true'); }

    openers.forEach(btn => btn && btn.addEventListener('click', (e) => { e.preventDefault(); openModal(); }));
    closeBtn && closeBtn.addEventListener('click', closeModal);
    modal && modal.addEventListener('click', (e) => { if (e.target.classList.contains('modal-backdrop')) closeModal(); });

    form && form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = form.querySelector('#lead-name');
        const email = form.querySelector('#lead-email');
        if (!name.value.trim() || !email.checkValidity()) { form.reportValidity(); return; }
        // Direct door naar checkout
        window.location.href = 'wacht-even';
    });

    // Add click handler for direct access button
    const directAccessButton = document.querySelector('.direct-access');
    if (directAccessButton) {
        directAccessButton.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            console.log('Direct access button clicked!');
        });
    }

    // Add hover effects for testimonial cards
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    
    testimonialCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.06)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        });
    });

    // Add subtle animation to book stack
    const bookStack = document.querySelector('.book-stack');
    if (bookStack) {
        bookStack.addEventListener('mouseenter', function() {
            this.style.transform = 'rotate(-3deg) scale(1.02)';
        });
        
        bookStack.addEventListener('mouseleave', function() {
            this.style.transform = 'rotate(-5deg) scale(1)';
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
    
    // Observe testimonial cards for animation
    testimonialCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });

    // Add smooth scrolling for any anchor links
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
