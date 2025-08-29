// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Course card interactions
    const courseCards = document.querySelectorAll('.course-card');
    
    courseCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
        });
        
        // Add click handler for course cards
        card.addEventListener('click', function() {
            const courseTitle = this.querySelector('h3').textContent;
            console.log('Course clicked:', courseTitle);
            
            // Add a subtle click animation
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            // Navigate to course lessons page
            const courseId = getCourseId(courseTitle);
            window.location.href = `course-lessons.html?course=${courseId}`;
        });
    });

    // Start course link interactions
    const startCourseLinks = document.querySelectorAll('.start-course');
    
    startCourseLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent card click event
            
            const courseTitle = this.closest('.course-card').querySelector('h3').textContent;
            console.log('Starting course:', courseTitle);
            
            // Add click animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            // Here you could redirect to the actual course page
            // window.location.href = `/course/${courseTitle.toLowerCase().replace(/\s+/g, '-')}`;
        });
    });

    // Member access button interaction
    const memberAccessButton = document.querySelector('.member-access');
    
    if (memberAccessButton) {
        memberAccessButton.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            console.log('Member access clicked');
        });
    }

    // Animate course cards on scroll
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
    
    // Course cards are now visible immediately (no fade-in animation)
    courseCards.forEach((card, index) => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
        card.style.transition = 'none';
    });

    // Progress dots animation
    const progressDots = document.querySelectorAll('.progress-dots');
    
    progressDots.forEach((dotsContainer, cardIndex) => {
        const dots = dotsContainer.querySelectorAll('.dot');
        
        // Simulate progress based on card index
        const progress = Math.min(cardIndex + 1, dots.length);
        
        dots.forEach((dot, dotIndex) => {
            if (dotIndex < progress) {
                setTimeout(() => {
                    dot.style.backgroundColor = '#3b82f6';
                    dot.style.transform = 'scale(1.2)';
                    setTimeout(() => {
                        dot.style.transform = 'scale(1)';
                    }, 200);
                }, cardIndex * 200 + dotIndex * 100);
            }
        });
    });

    // Header features are now visible immediately (no fade-in animation)
    const headerFeatures = document.querySelectorAll('.header-features .feature');
    
    headerFeatures.forEach((feature, index) => {
        feature.style.opacity = '1';
        feature.style.transform = 'translateY(0)';
        feature.style.transition = 'none';
    });

    // Course badge color animations
    const courseBadges = document.querySelectorAll('.course-badge');
    
    courseBadges.forEach(badge => {
        badge.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
        });
        
        badge.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });

    // Course duration badges
    const courseDurations = document.querySelectorAll('.course-duration');
    
    courseDurations.forEach(duration => {
        duration.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
        });
        
        duration.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
        });
    });

    // Smooth scrolling for any anchor links
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

    // Add loading state for course cards
    function simulateCourseLoading() {
        courseCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 100);
            }, index * 100);
        });
    }

    // Optional: Simulate course loading on page load
    // simulateCourseLoading();
});

// === SCOPE: academy-cards ===
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.course-card').forEach(card=>{
    const img=card.querySelector('.card-media img');
    const src=card.getAttribute('data-image');
    if(img){
      if(src) img.src=src;
      img.addEventListener('error',()=>{img.src='/assets/images/course-placeholder.svg'},{once:true});
    }
  });
});

// === SCOPE: academy-hero ===
function fitOneLine(el,minPx=18,maxPx=78){
  if(!el) return;
  el.style.fontSize=''; // reset to CSS clamp
  let fs=parseFloat(getComputedStyle(el).fontSize);
  while(el.scrollWidth<=el.clientWidth && fs<maxPx){
    const next=fs+1; el.style.fontSize=next+'px';
    if(el.scrollWidth>el.clientWidth){el.style.fontSize=fs+'px';break;}
    fs=next;
  }
  while(el.scrollWidth>el.clientWidth && fs>minPx){
    fs-=1; el.style.fontSize=fs+'px';
  }
}
const debounce=(fn,ms)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}}
document.addEventListener('DOMContentLoaded',()=>{
  const h=document.querySelector('.hero-title');
  if(h){fitOneLine(h); window.addEventListener('resize',debounce(()=>fitOneLine(h),250));}
});

// === SCOPE: academy-js ===
// Make whole card clickable to lessons overview (same href as "Start cursus")
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.course-card').forEach(card => {
    // Prefer explicit data-href; else reuse existing "Start cursus" link
    const dataHref = card.getAttribute('data-href');
    const startLink = card.querySelector('a.start-course, a[href*="academy"], a[href*="lesson"], a[href]');
    const href = dataHref || (startLink ? startLink.href : null);
    if (!href) return;

    card.setAttribute('role', 'link');
    card.setAttribute('tabindex', '0');
    card.style.cursor = 'pointer';

    // Click anywhere except native interactive elements
    card.addEventListener('click', (e) => {
      const interactive = e.target.closest('a, button, input, select, textarea, label');
      if (interactive) return;
      window.location.href = href;
    });

    // Keyboard accessibility
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.href = href;
      }
    });
  });

  // Ensure hero fits one line on resize (grow/shrink)
  const hero = document.querySelector('.hero-title');
  const debounce = (fn, ms) => { let t; return (...a)=>{clearTimeout(t); t=setTimeout(()=>fn(...a),ms);} };
  function fitOneLine(el, minPx=18, maxPx=78){
    if(!el) return;
    el.style.fontSize = ''; // reset to CSS clamp
    let fs = parseFloat(getComputedStyle(el).fontSize);
    while (el.scrollWidth <= el.clientWidth && fs < maxPx) {
      const next = fs + 1; el.style.fontSize = next + 'px';
      if (el.scrollWidth > el.clientWidth) { el.style.fontSize = fs + 'px'; break; }
      fs = next;
    }
    while (el.scrollWidth > el.clientWidth && fs > minPx) {
      fs -= 1; el.style.fontSize = fs + 'px';
    }
  }
  if (hero){ fitOneLine(hero); window.addEventListener('resize', debounce(()=>fitOneLine(hero),250)); }
});

// Helper function to get course ID from title
function getCourseId(courseTitle) {
    const courseMap = {
        'Clean Reset': 'clean-reset',
        'PowerFoods': 'powerfoods',
        'De Juiste Balans': 'de-juiste-balans',
        '30-Daagse Reset Journey': '30-daagse-reset-journey',
        'Everyday Nutrition': 'everyday-nutrition',
        'Mindful Energy': 'mindful-energy'
    };
    
    return courseMap[courseTitle] || 'clean-reset';
}
