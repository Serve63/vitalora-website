// Lesson view functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get lesson info from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course') || 'clean-reset';
    const lessonNumber = urlParams.get('lesson') || '1';

    // Update page title and breadcrumb
    updateLessonInfo(courseId, lessonNumber);

    // Render content conditionally: only Clean Reset - Lesson 1 has full content
    renderLessonContent(courseId, Number(lessonNumber));

    // Add scroll animations
    addScrollAnimations();

    // Add interactive elements
    addInteractiveElements();

    // Track reading progress
    trackReadingProgress();
});

// Update lesson information
function updateLessonInfo(courseId, lessonNumber) {
    const courseNames = {
        'clean-reset': 'Clean Reset',
        'powerfoods': 'PowerFoods',
        'de-juiste-balans': 'De Juiste Balans',
        '30-daagse-reset-journey': '30-Daagse Reset Journey',
        'everyday-nutrition': 'Everyday Nutrition',
        'mindful-energy': 'Mindful Energy'
    };

    const courseName = courseNames[courseId] || 'Clean Reset';
    document.querySelector('.lesson-breadcrumb').textContent = `${courseName} > Les ${lessonNumber}`;
    document.querySelector('.lesson-progress span').textContent = `Les ${lessonNumber} van 20`;
}

// Add scroll animations
function addScrollAnimations() {
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
    
    // Observe all sections for animation
    const sections = document.querySelectorAll('.lesson-section');
    sections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(section);
    });
}

// Add interactive elements
function addInteractiveElements() {
    // Info cards hover effects
    const infoCards = document.querySelectorAll('.info-card');
    infoCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(-2px)';
        });
    });

    // Source items hover effects
    const sourceItems = document.querySelectorAll('.source-item');
    sourceItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.02)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });

    // Problem cards hover effects
    const problemCards = document.querySelectorAll('.problem-card');
    problemCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });

    // Glossary items hover effects
    const glossaryItems = document.querySelectorAll('.glossary-item');
    glossaryItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f8fafc';
            this.style.transform = 'scale(1.02)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#ffffff';
            this.style.transform = 'scale(1)';
        });
    });
}

// Track reading progress
function trackReadingProgress() {
    let progress = 0;
    const totalSections = document.querySelectorAll('.lesson-section').length;
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                progress++;
                updateReadingProgress(progress, totalSections);
            }
        });
    }, { threshold: 0.5 });
    
    // Observe each section
    document.querySelectorAll('.lesson-section').forEach(section => {
        observer.observe(section);
    });
}

// Update reading progress
function updateReadingProgress(current, total) {
    const percentage = Math.min((current / total) * 100, 100);
    console.log(`Reading progress: ${percentage.toFixed(1)}%`);
    
    // You could add a progress indicator here
    // For now, we'll just log it
}

// Render dynamic lesson content (only full for Clean Reset - Les 1)
function renderLessonContent(courseId, lessonNumber) {
    const wrapper = document.getElementById('lesson-dynamic');
    if (!wrapper) return;

    const isFirstCleanReset = courseId === 'clean-reset' && lessonNumber === 1;
    if (isFirstCleanReset) {
        // leave the existing rich content on the page
        return;
    }

    // Replace with placeholder/empty state for other lessons/courses
    wrapper.innerHTML = `
        <section class="lesson-section">
            <div class="section-intro">
                <p class="intro-text">De inhoud van deze les wordt binnenkort toegevoegd.</p>
            </div>
        </section>
        <section class="lesson-section">
            <h2>Vooruitblik</h2>
            <p>Deze les is nog in voorbereiding. Binnenkort vind je hier de volledige uitleg, opdrachten en materialen.</p>
        </section>
    `;
}

// Complete lesson function
function completeLesson() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course') || 'clean-reset';
    const lessonNumber = parseInt(urlParams.get('lesson') || '1');
    
    // Save lesson completion
    saveLessonCompletion(courseId, lessonNumber);
    
    // Show completion message
    showCompletionMessage();
    
    // Navigate to next lesson or back to course
    setTimeout(() => {
        if (lessonNumber < 20) {
            // Go to next lesson
            window.location.href = `lesson-view.html?course=${courseId}&lesson=${lessonNumber + 1}`;
        } else {
            // Course completed, go back to lessons list
            window.location.href = `course-lessons.html?course=${courseId}`;
        }
    }, 2000);
}

// Save lesson completion
function saveLessonCompletion(courseId, lessonNumber) {
    const progress = JSON.parse(localStorage.getItem('lessonProgress') || '{}');
    if (!progress[courseId]) {
        progress[courseId] = [];
    }
    
    if (!progress[courseId].includes(lessonNumber)) {
        progress[courseId].push(lessonNumber);
        localStorage.setItem('lessonProgress', JSON.stringify(progress));
    }
    
    // Also update course progress
    const courseProgress = JSON.parse(localStorage.getItem('courseProgress') || '{}');
    courseProgress[courseId] = Math.max(courseProgress[courseId] || 0, lessonNumber);
    localStorage.setItem('courseProgress', JSON.stringify(courseProgress));
}

// Show completion message
function showCompletionMessage() {
    // Create completion overlay
    const overlay = document.createElement('div');
    overlay.className = 'completion-overlay';
    overlay.innerHTML = `
        <div class="completion-content">
            <div class="completion-icon">🎉</div>
            <h2>Les Voltooid!</h2>
            <p>Geweldig werk! Je hebt deze les succesvol afgerond.</p>
            <div class="completion-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 5%"></div>
                </div>
                <span>5% van de cursus voltooid</span>
            </div>
        </div>
    `;
    
    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
        .completion-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
        }
        
        .completion-content {
            background-color: white;
            padding: 40px;
            border-radius: 16px;
            text-align: center;
            max-width: 400px;
            animation: slideUp 0.3s ease;
        }
        
        .completion-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }
        
        .completion-content h2 {
            color: #1e3a8a;
            margin-bottom: 12px;
        }
        
        .completion-content p {
            color: #6b7280;
            margin-bottom: 24px;
        }
        
        .completion-progress {
            text-align: center;
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background-color: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 8px;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981 0%, #3b82f6 100%);
            border-radius: 4px;
            transition: width 0.3s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    
    document.head.appendChild(styles);
    document.body.appendChild(overlay);
    
    // Remove overlay after animation
    setTimeout(() => {
        document.body.removeChild(overlay);
    }, 2000);
}

// Add smooth scrolling for internal links
document.addEventListener('click', function(e) {
    if (e.target.tagName === 'A' && e.target.getAttribute('href').startsWith('#')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// Add keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        completeLesson();
    }
    
    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('course') || 'clean-reset';
        const lessonNumber = parseInt(urlParams.get('lesson') || '1');
        
        if (lessonNumber > 1) {
            window.location.href = `lesson-view.html?course=${courseId}&lesson=${lessonNumber - 1}`;
        }
    }
});
