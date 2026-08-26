(function () {
  'use strict';

  const COURSE_SLUG = 'clean-reset';
  const COURSE_DATA_URL = '/data/courses/clean-reset.json?v=3';

  function isLessonComplete(lesson, contentVersion) {
    try {
      const versionedKey = `progress:${COURSE_SLUG}:v${contentVersion}:${lesson.id}:done`;
      const legacyKey = `progress:${COURSE_SLUG}:${lesson.id}:done`;
      return localStorage.getItem(versionedKey) === 'true'
        || localStorage.getItem(legacyKey) === 'true';
    } catch (error) {
      return false;
    }
  }

  function lessonHref(lessonIndex) {
    return `/detox-cursus?lesson=${encodeURIComponent(lessonIndex)}`;
  }

  function setCourseLinks(href, label) {
    const heroLink = document.getElementById('hero-course-link');
    const courseLink = document.getElementById('clean-reset-course-link');
    const featuredCard = document.querySelector('.academy-featured-course[data-course="clean-reset"]');

    [heroLink, courseLink].forEach((link) => {
      if (!link) return;
      link.href = href;
      const text = link.querySelector('span');
      if (text) text.textContent = label;
    });

    if (featuredCard) {
      featuredCard.dataset.href = href;
    }
  }

  async function hydrateCleanResetProgress() {
    try {
      const response = await fetch(COURSE_DATA_URL);
      if (!response.ok) return;

      const course = await response.json();
      const lessons = Array.isArray(course.lessons)
        ? course.lessons.filter((lesson) => !lesson.draft)
        : [];
      if (!lessons.length) return;

      const contentVersion = Number(course.content_version || 1);
      const completed = lessons.filter((lesson) => isLessonComplete(lesson, contentVersion));
      const nextLesson = lessons.find((lesson) => !isLessonComplete(lesson, contentVersion));
      const completedCount = completed.length;
      const total = lessons.length;
      const percentage = Math.round((completedCount / total) * 100);

      const progressText = document.getElementById('clean-reset-progress-text');
      const progressBar = document.getElementById('clean-reset-progress-bar');
      const progressTrack = document.querySelector('.academy-progress-track');

      if (progressText) {
        if (completedCount === 0) {
          progressText.textContent = 'Klaar voor je eerste les';
        } else if (completedCount === total) {
          progressText.textContent = `Alle ${total} lessen afgerond`;
        } else {
          progressText.textContent = `${completedCount} van ${total} lessen afgerond`;
        }
      }

      if (progressBar) {
        progressBar.style.width = `${percentage}%`;
      }

      if (progressTrack) {
        progressTrack.setAttribute('aria-valuemax', String(total));
        progressTrack.setAttribute('aria-valuenow', String(completedCount));
      }

      if (completedCount === total) {
        setCourseLinks(lessonHref(1), 'Bekijk de cursus opnieuw');
      } else if (completedCount > 0 && nextLesson) {
        setCourseLinks(lessonHref(nextLesson.index), `Ga verder met les ${nextLesson.index}`);
      } else {
        setCourseLinks(lessonHref(1), 'Begin met Clean Reset');
      }
    } catch (error) {
      // De Academy blijft bruikbaar als opslag of cursusdata tijdelijk niet beschikbaar is.
    }
  }

  function makeFeaturedCourseClickable() {
    const card = document.querySelector('.academy-featured-course[data-href]');
    if (!card) return;

    card.setAttribute('role', 'link');
    card.setAttribute('tabindex', '0');

    const openCard = () => {
      const href = card.dataset.href;
      if (href) window.location.href = href;
    };

    card.addEventListener('click', (event) => {
      if (event.target.closest('a, button, input, select, textarea')) return;
      openCard();
    });

    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openCard();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    makeFeaturedCourseClickable();
    hydrateCleanResetProgress();
  });
}());
