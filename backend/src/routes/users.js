const express = require('express')
const router = express.Router()
const db = require('../db')
const auth = require('../middleware/auth')

router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, name, email FROM users ORDER BY name')
    res.json({ users: rows })
  } catch (err) {
    res.status(500).json({ error: 'internal server error' })
  }
})

module.exports = router