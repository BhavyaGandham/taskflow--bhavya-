const jwt = require('jsonwebtoken')

function authMiddleware(req, res, next) {
  const h = req.headers.authorization
  if (!h) return res.status(401).json({ error: 'unauthorized' })
  const parts = h.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'unauthorized' })
  try {
    const payload = jwt.verify(parts[1], process.env.JWT_SECRET)
    req.user = { id: payload.user_id, email: payload.email }
    return next()
  } catch (err) {
    return res.status(401).json({ error: 'unauthorized' })
  }
}

module.exports = authMiddleware
