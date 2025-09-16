import { requireStaff } from './login';

export default async function handler(req, res){
  const user = requireStaff(req);
  if(!user){
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.status(200).json({ ok: true, email: user.email });
}

