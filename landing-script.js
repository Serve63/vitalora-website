// Landing page interactions
document.addEventListener('DOMContentLoaded', function() {
    // Lead capture modal
    const modal = document.getElementById('ebook-modal');
    const openers = [document.getElementById('ebook-claim'), document.getElementById('ebook-claim-bottom'), document.getElementById('mobile-ebook-claim')].filter(Boolean);
    const closeBtn = modal ? modal.querySelector('.modal-close') : null;
    const form = modal ? modal.querySelector('#ebook-form') : null;
    const feedback = modal ? modal.querySelector('#ebook-feedback') : null;

    function openModal() { if (!modal) return; modal.classList.remove('hidden'); modal.setAttribute('aria-hidden','false'); (modal.querySelector('input')||{}).focus?.(); }
    function closeModal() { if (!modal) return; modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true'); }

    openers.forEach(btn => btn && btn.addEventListener('click', (e) => { e.preventDefault(); openModal(); }));
    closeBtn && closeBtn.addEventListener('click', closeModal);
    modal && modal.addEventListener('click', (e) => { if (e.target.classList.contains('modal-backdrop')) closeModal(); });

    // Store lead data before form submission to MailBlue
    // and ensure the user immediately sees the loading screen regardless of provider redirect timing
    if (form) {
        form.addEventListener('submit', function(e) {
            const name = document.getElementById('lead-name').value;
            const email = document.getElementById('lead-email').value;

            if (name && email) {
                // Store lead data in localStorage for checkout page
                localStorage.setItem('lead_data', JSON.stringify({
                    name: name,
                    email: email,
                    source: 'ebook_download'
                }));
            }

            // Submit the MailBlue form in the background (hidden iframe)
            // so we can immediately show our loading screen to the user
            try {
                let iframe = document.getElementById('mb-submit-frame');
                if (!iframe) {
                    iframe = document.createElement('iframe');
                    iframe.name = 'mb-submit-frame';
                    iframe.id = 'mb-submit-frame';
                    iframe.style.display = 'none';
                    document.body.appendChild(iframe);
                }
                form.setAttribute('target', 'mb-submit-frame');
            } catch (_) {}

            // Show inline loading in modal instead of separate page
            try {
                var loadingBox = document.getElementById('modal-loading');
                var progress = document.getElementById('modal-progress');
                var phrase = document.getElementById('modal-loading-phrase');
                if (loadingBox) {
                    form.classList.add('hidden');
                    loadingBox.classList.add('active');
                    var wordSets = [
                        'Gegevens verwerken…',
                        'Succesvol verstuurd',
                        'Exclusief aanbod creëren 🎁'
                    ];
                    var step = 0;
                    function showWords(text){
                        phrase.textContent = text;
                    }
                    function advance(){
                        if (progress) {
                            var segs = progress.querySelectorAll('.seg');
                            segs.forEach((s,idx)=>{ s.classList.toggle('filled', idx < step+1); });
                        }
                        showWords(wordSets[step]||'');
                        step++;
                        if (step < wordSets.length) setTimeout(advance, 1000);
                        else setTimeout(function(){
                            var qs = window.location.search || '';
                            window.location.href = '/wacht-even' + (qs ? qs : '');
                        }, 1200);
                    }
                    setTimeout(advance, 200);
                }
            } catch(_) {}
            // Do NOT preventDefault; allow the form to submit to MailBlue
        });
    }

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

    // Testimonial cards are now visible by default - no fade-in animation
    // (Animation code removed to show reviews immediately)

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

    // Form validation with green borders and background - remove blue focus
    const nameInput = document.getElementById('lead-name');
    const emailInput = document.getElementById('lead-email');

    // Remove blue focus ring from both inputs
    if (nameInput) {
        nameInput.style.outline = 'none';
        nameInput.addEventListener('input', function() {
            if (this.value.length >= 3) {
                this.style.borderColor = '#10b981';
                this.style.borderWidth = '2px';
                this.style.backgroundColor = '#E0EEDF';
            } else {
                this.style.borderColor = '#dbe3ec';
                this.style.borderWidth = '1px';
                this.style.backgroundColor = '';
            }
        });
    }

    if (emailInput) {
        emailInput.style.outline = 'none';
        emailInput.addEventListener('input', function() {
            const emailPattern = /^.{2,}@.{2,}\..{2,}$/;
            if (emailPattern.test(this.value)) {
                this.style.borderColor = '#10b981';
                this.style.borderWidth = '2px';
                this.style.backgroundColor = '#E0EEDF';
            } else {
                this.style.borderColor = '#dbe3ec';
                this.style.borderWidth = '1px';
                this.style.backgroundColor = '';
            }
        });
    }
});
