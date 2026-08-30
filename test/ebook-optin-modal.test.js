const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const script = fs.readFileSync(path.join(__dirname, '../assets/js/ebook-optin-modal.js'), 'utf8');

function classList(initial) {
  const values = new Set(initial || []);
  return {
    add: name => values.add(name),
    remove: name => values.delete(name),
    toggle(name, force) {
      if (force === true) values.add(name);
      else if (force === false) values.delete(name);
      else if (values.has(name)) values.delete(name);
      else values.add(name);
    },
    contains: name => values.has(name)
  };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function fixture(request) {
  const listeners = {};
  const timers = new Map();
  let nextTimer = 1;
  const previousFocus = { focus() {} };
  const close = {
    hidden: false,
    addEventListener(type, handler) { listeners[`close:${type}`] = handler; },
    focus() { document.activeElement = this; }
  };
  const submit = { hidden: false, disabled: false, textContent: 'Claim jouw exemplaar' };
  const nameInput = {
    hidden: false,
    value: '',
    focus() { document.activeElement = this; }
  };
  const emailInput = {
    hidden: false,
    value: '',
    focus() { document.activeElement = this; }
  };
  const feedback = { hidden: true, textContent: '' };
  const form = {
    action: '/api/lead-optin',
    addEventListener(type, handler) { listeners[`form:${type}`] = handler; },
    querySelector(selector) { return selector.includes('button') ? submit : null; },
    reset() {
      nameInput.value = '';
      emailInput.value = '';
    }
  };
  const modal = {
    classList: classList(['hidden']),
    addEventListener(type, handler) { listeners[`modal:${type}`] = handler; },
    querySelector(selector) { return selector.includes('data-ebook-optin-close') ? close : null; },
    querySelectorAll() { return [close, nameInput, emailInput, submit]; },
    setAttribute() {}
  };
  const opener = {
    addEventListener(type, handler) { listeners[`opener:${type}`] = handler; },
    focus() { document.activeElement = this; }
  };
  const htmlClasses = classList();
  const bodyClasses = classList();
  const document = {
    activeElement: previousFocus,
    documentElement: { classList: htmlClasses },
    body: { classList: bodyClasses },
    getElementById(id) {
      return {
        'ebook-modal': modal,
        'ebook-form': form,
        'ebook-claim': opener,
        'ebook-feedback': feedback,
        'lead-name': nameInput,
        'lead-email': emailInput
      }[id] || null;
    },
    addEventListener(type, handler) {
      if (type === 'DOMContentLoaded') handler();
      else listeners[`document:${type}`] = handler;
    }
  };
  const location = { assigned: null, assign(value) { this.assigned = value; } };
  const window = {
    location,
    setTimeout(handler) {
      const id = nextTimer++;
      timers.set(id, handler);
      return id;
    },
    clearTimeout(id) { timers.delete(id); }
  };
  class FakeAbortController {
    constructor() {
      this.signal = {};
      this.aborted = false;
    }
    abort() { this.aborted = true; }
  }
  const localStorage = { setItem() {} };

  vm.runInNewContext(script, {
    AbortController: FakeAbortController,
    console,
    document,
    fetch: request,
    localStorage,
    window
  });

  return {
    listeners,
    modal,
    nameInput,
    emailInput,
    submit,
    feedback,
    document,
    htmlClasses,
    bodyClasses,
    location
  };
}

function event() {
  return { preventDefault() {} };
}

test('sluiten, heropenen en opnieuw versturen houdt de tweede aanvraag geïsoleerd', async () => {
  const firstRequest = deferred();
  const secondRequest = deferred();
  const requests = [firstRequest, secondRequest];
  const current = fixture(() => requests.shift().promise);

  current.listeners['opener:click'](event());
  current.nameInput.value = 'Servé';
  current.emailInput.value = 'serve@example.com';
  const firstSubmission = current.listeners['form:submit'](event());
  await Promise.resolve();
  assert.equal(current.submit.disabled, true);

  current.listeners['close:click'](event());
  current.listeners['opener:click'](event());
  current.nameInput.value = 'Servé';
  current.emailInput.value = 'serve@example.com';
  const secondSubmission = current.listeners['form:submit'](event());
  await Promise.resolve();
  assert.equal(current.submit.disabled, true);

  firstRequest.reject(new Error('oude aanvraag afgebroken'));
  await firstSubmission;
  assert.equal(current.submit.disabled, true);
  assert.equal(current.submit.textContent, 'Even geduld…');
  assert.equal(current.feedback.textContent, '');

  secondRequest.resolve({ ok: true, json: async () => ({ success: true }) });
  await secondSubmission;
  assert.equal(current.location.assigned, '/checkout');
  assert.equal(current.htmlClasses.contains('ebook-optin-modal-open'), true);
  assert.equal(current.bodyClasses.contains('ebook-optin-modal-open'), true);
});

test('ongeldige velden krijgen hetzelfde focusgedrag als de blogpopup', async () => {
  const current = fixture(async () => ({ ok: true, json: async () => ({ success: true }) }));
  current.listeners['opener:click'](event());

  current.nameInput.value = 'S';
  current.emailInput.value = 'geen-mail';
  await current.listeners['form:submit'](event());
  assert.equal(current.feedback.textContent, 'Vul je voornaam in (minimaal 2 tekens).');
  assert.equal(current.document.activeElement, current.nameInput);

  current.nameInput.value = 'Servé';
  await current.listeners['form:submit'](event());
  assert.equal(current.feedback.textContent, 'Vul een geldig e-mailadres in.');
  assert.equal(current.document.activeElement, current.emailInput);
});
