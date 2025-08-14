// Course lessons functionality
document.addEventListener('DOMContentLoaded', function() {
    // Course data - will be populated with actual content later
    const courseData = {
        'clean-reset': {
            title: 'Clean Reset',
            subtitle: 'Detox en gifstoffen',
            level: 'Intensief',
            duration: '21 dagen',
            lessons: generateLessons('Clean Reset', 20)
        },
        'powerfoods': {
            title: 'PowerFoods',
            subtitle: 'Superfood & Specerij',
            level: 'Fundamenteel',
            duration: 'Basis',
            lessons: generateLessons('PowerFoods', 20)
        },
        'de-juiste-balans': {
            title: 'De Juiste Balans',
            subtitle: 'Energie & Hormonen',
            level: 'Geavanceerd',
            duration: 'Masterclass',
            lessons: generateLessons('De Juiste Balans', 20)
        },
        '30-daagse-reset-journey': {
            title: '30-Daagse Reset Journey',
            subtitle: 'Challenge',
            level: 'Toegankelijk',
            duration: 'Challenge',
            lessons: generateLessons('30-Daagse Reset Journey', 20)
        },
        'everyday-nutrition': {
            title: 'Everyday Nutrition',
            subtitle: 'Praktisch en Gezond',
            level: 'Holistisch',
            duration: 'Praktisch',
            lessons: generateLessons('Everyday Nutrition', 20)
        },
        'mindful-energy': {
            title: 'Mindful Energy',
            subtitle: 'Innerlijke Rust',
            level: 'Intensief',
            duration: 'Mindfulness',
            lessons: generateLessons('Mindful Energy', 20)
        }
    };

    // Get course from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course') || 'clean-reset';
    const currentCourse = courseData[courseId];

    // Update page title and content
    document.title = `${currentCourse.title} - Lessen`;
    document.getElementById('course-title').textContent = currentCourse.title;
    document.getElementById('course-subtitle').textContent = currentCourse.subtitle;
    document.querySelector('.course-level').textContent = currentCourse.level;
    document.querySelector('.course-duration').textContent = currentCourse.duration;

    // Add course class to body for styling
    document.body.classList.add(`course-${courseId.replace('-', '-')}`);

    // Generate lessons list
    const lessonsList = document.getElementById('lessons-list');
    currentCourse.lessons.forEach((lesson, index) => {
        const lessonElement = createLessonElement(lesson, index + 1);
        lessonsList.appendChild(lessonElement);
    });

    // Initialize progress tracking
    let completedLessons = 0;
    updateProgress(completedLessons, currentCourse.lessons.length);

    // Lesson click handlers
    const lessonItems = document.querySelectorAll('.lesson-item');
    lessonItems.forEach((item, index) => {
        item.addEventListener('click', function() {
            const lesson = currentCourse.lessons[index];
            console.log('Opening lesson:', lesson.title);
            
            // Add click animation
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);

            // Navigate to lesson view page
            window.location.href = `lesson-view.html?course=${courseId}&lesson=${index + 1}`;
        });
    });

    // Load saved progress
    loadProgress(courseId);
});

// Generate lesson data (placeholder content)
function generateLessons(courseName, count) {
    const lessons = [];
    const lessonTypes = [
        'Introductie',
        'Theorie',
        'Praktijk',
        'Oefening',
        'Evaluatie',
        'Reflectie',
        'Implementatie',
        'Verdieping',
        'Toepassing',
        'Integratie'
    ];

    for (let i = 1; i <= count; i++) {
        const lessonType = lessonTypes[(i - 1) % lessonTypes.length];
        const duration = Math.floor(Math.random() * 15) + 10; // 10-25 minutes
        
        lessons.push({
            title: `Les ${i}: ${lessonType}`,
            duration: `${duration} minuten`,
            description: `Inhoud voor ${courseName} - Les ${i} komt hier...`
        });
    }

    return lessons;
}

// Create lesson element
function createLessonElement(lesson, number) {
    const lessonDiv = document.createElement('div');
    lessonDiv.className = 'lesson-item';
    lessonDiv.innerHTML = `
        <div class="lesson-number">${number}</div>
        <div class="lesson-content">
            <div class="lesson-title">${lesson.title}</div>
            <div class="lesson-duration">${lesson.duration}</div>
        </div>
        <div class="lesson-icon">
            <span class="icon-play"></span>
        </div>
    `;
    return lessonDiv;
}

// Update progress bar
function updateProgress(completed, total) {
    const progressFill = document.getElementById('progress-fill');
    const completedElement = document.getElementById('completed-lessons');
    const totalElement = document.getElementById('total-lessons');
    
    const percentage = (completed / total) * 100;
    progressFill.style.width = `${percentage}%`;
    completedElement.textContent = completed;
    totalElement.textContent = total;
}

// Save progress to localStorage
function saveProgress(courseId, completedLessons) {
    const progress = JSON.parse(localStorage.getItem('courseProgress') || '{}');
    progress[courseId] = completedLessons;
    localStorage.setItem('courseProgress', JSON.stringify(progress));
}

// Load progress from localStorage
function loadProgress(courseId) {
    const progress = JSON.parse(localStorage.getItem('courseProgress') || '{}');
    const completedLessons = progress[courseId] || 0;
    
    // Mark completed lessons
    const lessonItems = document.querySelectorAll('.lesson-item');
    lessonItems.forEach((item, index) => {
        if (index < completedLessons) {
            item.classList.add('completed');
        }
    });
    
    updateProgress(completedLessons, 20);
}

// Add play icon to icons.css
const playIcon = document.createElement('style');
playIcon.textContent = `
    .icon-play {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M8 5v14l11-7z'/%3E%3C/svg%3E");
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        width: 16px;
        height: 16px;
        display: inline-block;
    }
`;
document.head.appendChild(playIcon);
