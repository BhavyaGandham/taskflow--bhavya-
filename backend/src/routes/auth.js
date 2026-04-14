const express = require('express')
const router = express.Router()
const db = require('../db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const Joi = require('joi')
const logger = require('../logger')

const registerSchema = Joi.object({ name: Joi.string().required(), email: Joi.string().email().required(), password: Joi.string().min(6).required() })
const loginSchema = Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() })

router.post('/register', async (req, res) => {
  const { error, value } = registerSchema.validate(req.body)
  if (error) return res.status(400).json({ error: 'validation failed', fields: error.details.reduce((acc, d) => (acc[d.path[0]] = d.message, acc), {}) })
  const { name, email, password } = value
  try {
    const hashed = await bcrypt.hash(password, 12)
    const id = uuidv4()
    await db.query('INSERT INTO users(id, name, email, password, created_at) VALUES($1,$2,$3,$4,NOW())', [id, name, email, hashed])
    const token = jwt.sign({ user_id: id, email }, process.env.JWT_SECRET, { expiresIn: '24h' })
    res.status(201).json({ token, user: { id, name, email } })
  } catch (err) {
    logger.error('register error', { err })
    if (err.code === '23505') return res.status(400).json({ error: 'validation failed', fields: { email: 'already exists' } })
    res.status(500).json({ error: 'internal server error' })
  }
})

router.post('/login', async (req, res) => {
  const { error, value } = loginSchema.validate(req.body)
  if (error) return res.status(400).json({ error: 'validation failed', fields: error.details.reduce((acc, d) => (acc[d.path[0]] = d.message, acc), {}) })
  const { email, password } = value
  try {
    const { rows } = await db.query('SELECT id, name, email, password FROM users WHERE email=$1', [email])
    if (!rows.length) return res.status(401).json({ error: 'unauthorized' })
    const u = rows[0]
    const ok = await bcrypt.compare(password, u.password)
    if (!ok) return res.status(401).json({ error: 'unauthorized' })
    const token = jwt.sign({ user_id: u.id, email: u.email }, process.env.JWT_SECRET, { expiresIn: '24h' })
    res.json({ token, user: { id: u.id, name: u.name, email: u.email } })
  } catch (err) {
    logger.error('login error', { err })
    res.status(500).json({ error: 'internal server error' })
  }
})

module.exports = router
