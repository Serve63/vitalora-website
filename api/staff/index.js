import { requireStaff } from './login';

export default async function handler(req, res){
  const user = requireStaff(req);
  if(!user){
    // Not logged in → send login page
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.status(200).end(`<!DOCTYPE html><html lang="nl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Personeel Login</title></head><body><script>location.replace('/personeel');</script></body></html>`);
    return;
  }
  // Logged in → serve the dashboard HTML
  try {
    const html = await fetch(new URL('/personeel-dashboard.html', `https://${req.headers.host}`)).then(r=>r.text());
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.status(200).end(html);
  } catch(_){
    res.status(500).send('Kon dashboard niet laden');
  }
}

