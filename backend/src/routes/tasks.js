const express = require('express')
const router = express.Router()
const db = require('../db')
const auth = require('../middleware/auth')
const Joi = require('joi')

const createSchema = Joi.object({ title: Joi.string().required(), description: Joi.string().allow('', null), priority: Joi.string().valid('low','medium','high').default('medium'), assignee_id: Joi.string().uuid().allow(null), due_date: Joi.date().iso().allow(null) })

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

async function projectOwnerId(projectId) {
  const { rows } = await db.query('SELECT owner_id FROM projects WHERE id=$1', [projectId])
  return rows.length ? rows[0].owner_id : null
}

router.get('/projects/:projectId/tasks', auth, async (req, res) => {
  const { projectId } = req.params
  const { status, assignee } = req.query
  try {
    const canAccess = await userCanAccessProject(req.user.id, projectId)
    if (!canAccess) return res.status(403).json({ error: 'forbidden' })

    let q = 'SELECT * FROM tasks WHERE project_id=$1'
    const params = [projectId]
    if (status) { params.push(status); q += ` AND status=$${params.length}` }
    if (assignee) { params.push(assignee); q += ` AND assignee_id=$${params.length}` }
    q += ' ORDER BY created_at'
    const { rows } = await db.query(q, params)
    res.json({ tasks: rows })
  } catch (err) {
    res.status(500).json({ error: 'internal server error' })
  }
})

router.post('/projects/:projectId/tasks', auth, async (req, res) => {
  const { projectId } = req.params
  const { error, value } = createSchema.validate(req.body)
  if (error) return res.status(400).json({ error: 'validation failed', fields: error.details.reduce((acc, d) => (acc[d.path[0]] = d.message, acc), {}) })
  const id = require('uuid').v4()
  try {
    const ownerId = await projectOwnerId(projectId)
    if (!ownerId) return res.status(404).json({ error: 'not found' })
    if (ownerId !== req.user.id) return res.status(403).json({ error: 'forbidden' })
    await db.query(`INSERT INTO tasks(id, title, description, status, priority, project_id, assignee_id, due_date, creator_id, created_at, updated_at) VALUES($1,$2,$3,'todo',$4,$5,$6,$7,$8,NOW(),NOW())`, [id, value.title, value.description, value.priority, projectId, value.assignee_id, value.due_date, req.user.id])
    const t = (await db.query('SELECT * FROM tasks WHERE id=$1', [id])).rows[0]
    res.status(201).json(t)
  } catch (err) {
    res.status(500).json({ error: 'internal server error' })
  }
})

router.patch('/tasks/:id', auth, async (req, res) => {
  const { id } = req.params
  const fields = ['title','description','status','priority','assignee_id','due_date']
  const sets = []
  const params = []
  let idx = 1
  for (const f of fields) {
    if (req.body[f] !== undefined) { sets.push(`${f}=$${idx++}`); params.push(req.body[f]) }
  }
  if (!sets.length) return res.status(400).json({ error: 'validation failed', fields: {} })
  params.push(id)
  try {
    const q = `UPDATE tasks SET ${sets.join(',')}, updated_at=NOW() WHERE id=$${params.length} RETURNING *`
    const { rows } = await db.query(q, params)
    if (!rows.length) return res.status(404).json({ error: 'not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: 'internal server error' })
  }
})

router.delete('/tasks/:id', auth, async (req, res) => {
  const { id } = req.params
  try {
    const { rows } = await db.query('SELECT creator_id, project_id FROM tasks WHERE id=$1', [id])
    if (!rows.length) return res.status(404).json({ error: 'not found' })
    const t = rows[0]
    const proj = (await db.query('SELECT owner_id FROM projects WHERE id=$1', [t.project_id])).rows[0]
    if (proj.owner_id !== req.user.id && t.creator_id !== req.user.id) return res.status(403).json({ error: 'forbidden' })
    await db.query('DELETE FROM tasks WHERE id=$1', [id])
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: 'internal server error' })
  }
})

module.exports = router
