const { Pool } = require('pg')
const logger = require('./logger')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

pool.on('error', (err) => {
  logger.error('Unexpected PG client error', { error: err })
})

module.exports = { query: (text, params) => pool.query(text, params), pool }
