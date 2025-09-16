const fs = require('fs');
const path = require('path');
const { getSessionFromRequest } = require('./_utils/auth.js');

const DASHBOARD_PATH = path.join(process.cwd(), 'protected', 'personeel-dashboard.html');

async function readDashboardTemplate() {
  return fs.promises.readFile(DASHBOARD_PATH, 'utf8');
}

async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const session = getSessionFromRequest(req);
  if (!session) {
    res.statusCode = 302;
    res.setHeader('Location', '/personeel');
    res.end('Found');
    return;
  }

  try {
    const html = await readDashboardTemplate();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (req.method === 'HEAD') {
      res.status(200).end();
      return;
    }
    res.status(200).end(html);
  } catch (err) {
    res.status(500).setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Kon dashboard niet laden.');
  }
}

module.exports = handler;
