const config = require('../data/marketing-machine.json');
const { requireStaff } = require('./staff/login.js');

function numberOrNull(value) {
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function rate(numerator, denominator) {
  const safeNumerator = numberOrNull(numerator);
  const safeDenominator = numberOrNull(denominator);
  if (safeNumerator === null || !safeDenominator) return null;
  return Number(((safeNumerator / safeDenominator) * 100).toFixed(2));
}

function normalizeVariant(variant) {
  const visitors = numberOrNull(variant.visitors);
  const conversions = numberOrNull(variant.conversions);
  return {
    ...variant,
    visitors,
    conversions,
    conversionRate: rate(conversions, visitors),
  };
}

function normalizeMailVariant(variant) {
  const sent = numberOrNull(variant.sent);
  const opens = numberOrNull(variant.opens);
  const clicks = numberOrNull(variant.clicks);
  const purchases = numberOrNull(variant.purchases);
  return {
    ...variant,
    sent,
    opens,
    clicks,
    purchases,
    revenue: numberOrNull(variant.revenue),
    openRate: rate(opens, sent),
    clickRate: rate(clicks, sent),
  };
}

function buildPayload() {
  const pages = config.pages.map((page) => {
    const variants = page.variants.map(normalizeVariant);
    const winner = variants.find((variant) => variant.decision === 'winner') || null;
    return { ...page, variants, winnerVariantId: winner?.id || null };
  });
  const mailingSteps = config.mailing.steps.map((step) => ({
    ...step,
    variants: (step.variants || []).map(normalizeMailVariant),
  }));

  return {
    generatedAt: new Date().toISOString(),
    measurement: config.measurement,
    summary: {
      activePageTests: pages.filter((page) => page.variants.some((variant) => variant.status === 'active')).length,
      completedPageTests: pages.filter((page) => page.variants.some((variant) => ['winner', 'loser'].includes(variant.decision))).length,
      pageWinners: pages.filter((page) => page.winnerVariantId).length,
      mailingSteps: mailingSteps.length,
    },
    pages,
    mailing: { ...config.mailing, steps: mailingSteps },
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!requireStaff(req)) {
    res.status(401).json({ error: 'Niet ingelogd' });
    return;
  }

  res.status(200).json(buildPayload());
};

module.exports.buildPayload = buildPayload;
