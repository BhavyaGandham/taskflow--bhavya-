require('dotenv').config()
const express = require('express')
const cors = require('cors')
const logger = require('./logger')
const authRoutes = require('./routes/auth')
const projectsRoutes = require('./routes/projects')
const tasksRoutes = require('./routes/tasks')
const usersRoutes = require('./routes/users')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/auth', authRoutes)
app.use('/projects', projectsRoutes)
app.use('/', tasksRoutes)
app.use('/users', usersRoutes)

app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err })
  res.status(500).json({ error: 'internal server error' })
})

const port = process.env.BACKEND_PORT || 8080
const server = app.listen(port, () => logger.info('server started', { port }))

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down')
  server.close(() => process.exit(0))
})

module.exports = app
