(function () {
  const numberFormatter = new Intl.NumberFormat('nl-NL');
  const euroFormatter = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

  function metric(value) {
    return Number.isFinite(value) ? numberFormatter.format(value) : '—';
  }

  function percentage(value) {
    return Number.isFinite(value) ? `${value.toFixed(2).replace('.', ',')}%` : '—';
  }

  function decisionLabel(decision) {
    return {
      winner: 'Winnaar',
      loser: 'Verloren',
      insufficient_data: 'Nog geen besluit',
    }[decision] || 'Nog geen besluit';
  }

  function statusLabel(status) {
    return { active: 'Actieve test', control: 'Controle', completed: 'Afgerond' }[status] || status || 'Onbekend';
  }

  function td(text, className) {
    const cell = document.createElement('td');
    cell.textContent = text;
    if (className) cell.className = className;
    return cell;
  }

  function resultBadge(decision) {
    const badge = document.createElement('span');
    badge.className = `machine-badge machine-badge--${decision || 'insufficient_data'}`;
    badge.textContent = decisionLabel(decision);
    return badge;
  }

  function renderPage(page) {
    const card = document.querySelector(`[data-page-key="${page.key}"]`);
    if (!card) return;
    card.querySelector('[data-objective]').textContent = page.objective;
    const winner = page.variants.find((variant) => variant.id === page.winnerVariantId);
    const winnerNode = card.querySelector('[data-winner]');
    winnerNode.textContent = winner ? `${winner.name} wint` : 'Nog geen winnaar';
    winnerNode.className = `machine-badge ${winner ? 'machine-badge--winner' : 'machine-badge--insufficient_data'}`;

    const body = card.querySelector('tbody');
    body.replaceChildren();
    page.variants.forEach((variant) => {
      const row = document.createElement('tr');
      const nameCell = document.createElement('td');
      const strong = document.createElement('strong');
      const description = document.createElement('small');
      strong.textContent = variant.name;
      description.textContent = variant.description;
      nameCell.append(strong, description);
      row.append(
        nameCell,
        td(statusLabel(variant.status)),
        td(metric(variant.visitors)),
        td(metric(variant.conversions)),
        td(percentage(variant.conversionRate))
      );
      const decisionCell = document.createElement('td');
      decisionCell.append(resultBadge(variant.decision));
      row.append(decisionCell);
      body.append(row);
    });
  }

  function renderMailing(mailing) {
    document.getElementById('mailing-source-note').textContent = mailing.message;
    document.getElementById('mailing-provider').textContent = mailing.provider;
    const tree = document.getElementById('mailing-tree');
    tree.replaceChildren();

    const root = document.createElement('div');
    root.className = 'mail-tree-node mail-tree-node--root';
    root.innerHTML = '<span>Start</span><strong></strong><small>Nieuwe lead komt in de mailingflow</small>';
    root.querySelector('strong').textContent = mailing.entryPoint;
    tree.append(root);

    if (!mailing.steps.length) {
      const connector = document.createElement('div');
      connector.className = 'mail-tree-connector';
      const unavailable = document.createElement('div');
      unavailable.className = 'mail-tree-node mail-tree-node--empty';
      unavailable.innerHTML = '<span>Databron</span><strong>Mailinghistorie niet gekoppeld</strong><small>Geen open rates, takken of winnaar beschikbaar</small>';
      tree.append(connector, unavailable);
    }

    const body = document.getElementById('mailing-variants-body');
    body.replaceChildren();
    const variants = mailing.steps.flatMap((step) => (step.variants || []).map((variant) => ({ step, variant })));
    if (!variants.length) {
      const row = document.createElement('tr');
      const cell = td('Nog geen MailBlue-eventhistorie beschikbaar. Er wordt niets geschat of ingevuld.', 'machine-empty-cell');
      cell.colSpan = 8;
      row.append(cell);
      body.append(row);
      return;
    }

    variants.forEach(({ step, variant }) => {
      const row = document.createElement('tr');
      row.append(
        td(step.name),
        td(variant.name),
        td(metric(variant.sent)),
        td(percentage(variant.openRate)),
        td(percentage(variant.clickRate)),
        td(metric(variant.purchases)),
        td(Number.isFinite(variant.revenue) ? euroFormatter.format(variant.revenue) : '—')
      );
      const result = document.createElement('td');
      result.append(resultBadge(variant.decision));
      row.append(result);
      body.append(row);
    });
  }

  async function load() {
    const button = document.getElementById('refresh-machine');
    button.disabled = true;
    try {
      const guard = await fetch('/api/staff/guard', { credentials: 'same-origin' });
      if (!guard.ok) {
        window.location.href = '/personeel';
        return;
      }
      const response = await fetch('/api/marketing-experiments', { credentials: 'same-origin' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Marketingmachine kon niet worden geladen.');

      document.getElementById('measurement-note').textContent = payload.measurement.message;
      document.getElementById('summary-active').textContent = metric(payload.summary.activePageTests);
      document.getElementById('summary-completed').textContent = metric(payload.summary.completedPageTests);
      document.getElementById('summary-winners').textContent = metric(payload.summary.pageWinners);
      document.getElementById('summary-mailing').textContent = metric(payload.summary.mailingSteps);
      payload.pages.forEach(renderPage);
      renderMailing(payload.mailing);
    } catch (error) {
      document.getElementById('measurement-note').textContent = error.message;
    } finally {
      button.disabled = false;
    }
  }

  document.getElementById('refresh-machine').addEventListener('click', load);
  load();
})();
