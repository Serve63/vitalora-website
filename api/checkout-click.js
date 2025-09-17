module.exports = async function handler(req, res){
  try{
    const chunks=[]; for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks).toString('utf8');
    const payload = (()=>{ try{ return JSON.parse(body||'{}'); }catch(_){ return {}; } })();
    const line = JSON.stringify({ t:Date.now(), ip:req.headers['x-forwarded-for']||req.socket.remoteAddress||'', ua:req.headers['user-agent']||'', variant: payload.variant||'' })+'\n';
    console.log('[checkout-click]', line.trim());
    res.setHeader('Cache-Control','no-store');
    res.status(204).end();
  }catch(e){ res.status(204).end(); }
}


