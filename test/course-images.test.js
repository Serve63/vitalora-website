const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const coursePath = path.join(root, 'data/courses/clean-reset.json');
const course = JSON.parse(fs.readFileSync(coursePath, 'utf8'));

test('elke Clean Reset-les heeft twee unieke warme cursusbeelden', () => {
  assert.equal(course.lessons.length, 24);

  const imageSources = [];

  course.lessons.forEach((lesson) => {
    assert.ok(lesson.arrival?.trim().length >= 80, `Les ${lesson.index} mist een warme binnenkomer`);
    assert.equal(lesson.images?.length, 2, `Les ${lesson.index} moet twee beelden hebben`);
    assert.deepEqual(
      lesson.images.map((image) => image.after_section),
      [0, 2],
      `Les ${lesson.index} moet de beelden na de opening en na stap 2 tonen`,
    );

    lesson.images.forEach((image) => {
      assert.match(image.src, /^\/assets\/images\/courses\/clean-reset-v2\/lesson-\d{2}-[ab]\.jpg$/);
      assert.ok(image.alt.trim().length >= 24, `Les ${lesson.index} mist een bruikbare alttekst`);
      assert.ok(fs.existsSync(path.join(root, image.src)), `${image.src} ontbreekt`);
      imageSources.push(image.src);
    });
  });

  assert.equal(new Set(imageSources).size, 48, 'Alle 48 cursusbeelden moeten uniek zijn');
});

test('de cursusrenderer ondersteunt meerdere beelden en behoudt het oude formaat', () => {
  const script = fs.readFileSync(path.join(root, 'assets/js/course-view.js'), 'utf8');

  assert.match(script, /Array\.isArray\(lesson\.images\)/);
  assert.match(script, /return lesson\.image \? \[lesson\.image\] : \[\]/);
  assert.match(script, /renderLessonImagesAfter\(lesson, index \+ 1\)/);
  assert.match(script, /renderLessonImagesAfter\(lesson, 0\)/);
  assert.match(script, /lesson\.arrival/);
  assert.match(script, /lesson-arrival/);
});
