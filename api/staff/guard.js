const { requireStaff } = require('./login');

module.exports = async function handler(req, res){
  const user = requireStaff(req);
  if(!user){
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.status(200).json({
    ok: true,
    code: user.code || null,
    email: user.email || null
  });
}
