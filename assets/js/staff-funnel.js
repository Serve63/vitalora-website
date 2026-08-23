(function () {
  const state = {
    mailing: [],
    cleanReset: [],
  };

  function formatDate(value) {
    if (!value) return '–';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '–';
    return new Intl.DateTimeFormat('nl-NL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  function formatMoney(value) {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(Number(value || 0));
  }

  function setCellText(row, value) {
    const cell = document.createElement('td');
    cell.textContent = value || '–';
    row.appendChild(cell);
    return cell;
  }

  function renderState(body, message, isError) {
    body.replaceChildren();
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 4;
    cell.className = `state-cell${isError ? ' error' : ''}`;
    cell.textContent = message;
    row.appendChild(cell);
    body.appendChild(row);
  }

  function renderMailing(query) {
    const body = document.getElementById('mailing-body');
    const term = String(query || '').trim().toLowerCase();
    const contacts = state.mailing.filter((item) =>
      `${item.name || ''} ${item.email || ''}`.toLowerCase().includes(term)
    );

    if (!contacts.length) {
      renderState(body, term ? 'Geen resultaten voor deze zoekopdracht.' : 'Nog geen e-bookdownloaders gevonden.', false);
      return;
    }

    body.replaceChildren();
    contacts.forEach((contact) => {
      const row = document.createElement('tr');
      setCellText(row, contact.name);
      setCellText(row, contact.email);
      setCellText(row, formatDate(contact.addedAt));
      const statusCell = setCellText(row, '');
      const pill = document.createElement('span');
      pill.className = 'status-pill';
      pill.textContent = contact.status || 'Ingeschreven';
      statusCell.replaceChildren(pill);
      body.appendChild(row);
    });
  }

  function renderCleanReset(query) {
    const body = document.getElementById('clean-reset-body');
    const term = String(query || '').trim().toLowerCase();
    const customers = state.cleanReset.filter((item) =>
      `${item.name || ''} ${item.email || ''}`.toLowerCase().includes(term)
    );

    if (!customers.length) {
      renderState(body, term ? 'Geen resultaten voor deze zoekopdracht.' : 'Nog geen Clean Reset-klanten gevonden.', false);
      return;
    }

    body.replaceChildren();
    customers.forEach((customer) => {
      const row = document.createElement('tr');
      setCellText(row, customer.name);
      setCellText(row, customer.email);
      setCellText(row, formatDate(customer.lastPaymentAt));
      setCellText(row, formatMoney(customer.total));
      body.appendChild(row);
    });
  }

  function selectTab(name) {
    document.querySelectorAll('.funnel-tab').forEach((tab) => {
      const active = tab.dataset.tab === name;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.funnel-panel').forEach((panel) => {
      const active = panel.dataset.panel === name;
      panel.classList.toggle('active', active);
      panel.hidden = !active;
    });
  }

  async function loadFunnel() {
    const refresh = document.getElementById('refresh-funnel');
    refresh.disabled = true;
    renderState(document.getElementById('mailing-body'), 'Laden…', false);
    renderState(document.getElementById('clean-reset-body'), 'Laden…', false);
    document.getElementById('academy-state').textContent = 'Laden…';

    try {
      const response = await fetch('/api/funnel', { credentials: 'same-origin' });
      if (response.status === 401) {
        window.location.href = '/personeel';
        return;
      }
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Funnel kon niet worden geladen.');

      state.mailing = Array.isArray(payload.mailingList?.contacts) ? payload.mailingList.contacts : [];
      state.cleanReset = Array.isArray(payload.cleanReset?.customers) ? payload.cleanReset.customers : [];

      document.getElementById('count-mailing').textContent = String(state.mailing.length);
      document.getElementById('count-clean-reset').textContent = String(state.cleanReset.length);
      document.getElementById('count-academy').textContent = String(payload.academy?.customers?.length || 0);

      if (payload.mailingList?.available === false) {
        renderState(document.getElementById('mailing-body'), payload.mailingList.message || 'Mailinglijst niet beschikbaar.', true);
      } else {
        renderMailing(document.querySelector('[data-search="mailing"]').value);
      }

      if (payload.cleanReset?.available === false) {
        renderState(document.getElementById('clean-reset-body'), payload.cleanReset.message || 'Klantgegevens niet beschikbaar.', true);
      } else {
        renderCleanReset(document.querySelector('[data-search="clean-reset"]').value);
      }

      document.getElementById('academy-state').textContent = payload.academy?.message || 'Nog geen individuele Academy-accounts gevonden.';
    } catch (error) {
      const message = error?.message || 'Funnel kon niet worden geladen.';
      renderState(document.getElementById('mailing-body'), message, true);
      renderState(document.getElementById('clean-reset-body'), message, true);
      document.getElementById('academy-state').textContent = message;
    } finally {
      refresh.disabled = false;
    }
  }

  document.querySelectorAll('.funnel-tab').forEach((tab) => {
    tab.addEventListener('click', () => selectTab(tab.dataset.tab));
  });
  document.querySelector('[data-search="mailing"]').addEventListener('input', (event) => renderMailing(event.target.value));
  document.querySelector('[data-search="clean-reset"]').addEventListener('input', (event) => renderCleanReset(event.target.value));
  document.getElementById('refresh-funnel').addEventListener('click', loadFunnel);

  fetch('/api/staff/guard', { credentials: 'same-origin' })
    .then((response) => response.ok ? loadFunnel() : Promise.reject())
    .catch(() => { window.location.href = '/personeel'; });
})();
