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
    
    // Observe course cards for animation
    courseCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
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

    // Header features animation
    const headerFeatures = document.querySelectorAll('.header-features .feature');
    
    headerFeatures.forEach((feature, index) => {
        feature.style.opacity = '0';
        feature.style.transform = 'translateY(20px)';
        feature.style.transition = `opacity 0.6s ease ${index * 0.2}s, transform 0.6s ease ${index * 0.2}s`;
        
        setTimeout(() => {
            feature.style.opacity = '1';
            feature.style.transform = 'translateY(0)';
        }, 500 + index * 200);
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
