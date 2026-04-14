const express = require('express')
const router = express.Router()
const db = require('../db')
const auth = require('../middleware/auth')
const Joi = require('joi')

const createSchema = Joi.object({ name: Joi.string().required(), description: Joi.string().allow('', null) })

async function userCanAccessProject(userId, projectId) {
  const q = `
    SELECT 1 FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id
    WHERE p.id = $1 AND (p.owner_id = $2 OR t.assignee_id = $2)
    LIMIT 1
  `
  const { rows } = await db.query(q, [projectId, userId])
  return rows.length > 0
}

router.get('/', auth, async (req, res) => {
  const userId = req.user.id
  try {
    const q = `
      SELECT DISTINCT p.* FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE p.owner_id = $1 OR t.assignee_id = $1
      ORDER BY p.created_at DESC
    `
    const { rows } = await db.query(q, [userId])
    res.json({ projects: rows })
  } catch (err) {
    res.status(500).json({ error: 'internal server error' })
  }
})

router.post('/', auth, async (req, res) => {
  const { error, value } = createSchema.validate(req.body)
  if (error) return res.status(400).json({ error: 'validation failed', fields: error.details.reduce((acc, d) => (acc[d.path[0]] = d.message, acc), {}) })
  const id = require('uuid').v4()
  const { name, description } = value
  try {
    await db.query('INSERT INTO projects(id, name, description, owner_id, created_at) VALUES($1,$2,$3,$4,NOW())', [id, name, description, req.user.id])
    const { rows } = await db.query('SELECT * FROM projects WHERE id=$1', [id])
    res.status(201).json(rows[0])
  } catch (err) {
    res.status(500).json({ error: 'internal server error' })
  }
})

router.get('/:id', auth, async (req, res) => {
  const { id } = req.params
  try {
    const canAccess = await userCanAccessProject(req.user.id, id)
    if (!canAccess) return res.status(403).json({ error: 'forbidden' })

    const { rows } = await db.query('SELECT * FROM projects WHERE id=$1', [id])
    if (!rows.length) return res.status(404).json({ error: 'not found' })
    const project = rows[0]
    const tasks = (await db.query('SELECT * FROM tasks WHERE project_id=$1 ORDER BY created_at', [id])).rows
    project.tasks = tasks
    res.json(project)
  } catch (err) {
    res.status(500).json({ error: 'internal server error' })
  }
})

router.patch('/:id', auth, async (req, res) => {
  const { id } = req.params
  try {
    const { rows } = await db.query('SELECT owner_id FROM projects WHERE id=$1', [id])
    if (!rows.length) return res.status(404).json({ error: 'not found' })
    if (rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'forbidden' })
    const { name, description } = req.body
    await db.query('UPDATE projects SET name=COALESCE($1,name), description=COALESCE($2,description) WHERE id=$3', [name, description, id])
    const updated = (await db.query('SELECT * FROM projects WHERE id=$1', [id])).rows[0]
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'internal server error' })
  }
})

router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params
  try {
    const { rows } = await db.query('SELECT owner_id FROM projects WHERE id=$1', [id])
    if (!rows.length) return res.status(404).json({ error: 'not found' })
    if (rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'forbidden' })
    await db.query('DELETE FROM tasks WHERE project_id=$1', [id])
    await db.query('DELETE FROM projects WHERE id=$1', [id])
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: 'internal server error' })
  }
})

module.exports = router
