const adminOnly = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Nedostaje autorizacija' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Neispravan auth header' });
  }

  let user;
  try {
    const json = Buffer.from(parts[1], 'base64').toString('utf8');
    user = JSON.parse(json);
  } catch {
    return res.status(401).json({ message: 'Neispravan token' });
  }

  const role = (user && user.role) ? String(user.role).toLowerCase() : '';
  if (role !== 'admin') {
    return res.status(403).json({ message: 'Pristup zabranjen. Samo admin.' });
  }

  req.user = user; 
  next();
};

module.exports = { adminOnly };






