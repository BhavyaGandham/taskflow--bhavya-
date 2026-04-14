require('dotenv').config()
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const pw = await bcrypt.hash('password123', 12)
    const userId = uuidv4()
    await client.query('DELETE FROM tasks; DELETE FROM projects; DELETE FROM users;')
    await client.query('INSERT INTO users(id,name,email,password,created_at) VALUES($1,$2,$3,$4,NOW())', [userId, 'Test User', 'test@example.com', pw])
    const projectId = uuidv4()
    await client.query('INSERT INTO projects(id,name,description,owner_id,created_at) VALUES($1,$2,$3,$4,NOW())', [projectId, 'Seed Project', 'Auto-created seed project', userId])
    const t1 = uuidv4(); const t2 = uuidv4(); const t3 = uuidv4();
    await client.query(`INSERT INTO tasks(id,title,description,status,priority,project_id,assignee_id,creator_id,due_date,created_at,updated_at) VALUES
      ($1,'Task One','First task','todo','high',$4,$3,$2,'2026-05-01',NOW(),NOW()),
      ($5,'Task Two','Second task','in_progress','medium',$4,$3,$2,'2026-05-05',NOW(),NOW()),
      ($6,'Task Three','Third task','done','low',$4,null,$2,null,NOW(),NOW())
    `, [t1, userId, userId, projectId, t2, t3])
    await client.query('COMMIT')
    console.log('seed complete')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('seed failed', err)
  } finally {
    client.release()
    await pool.end()
  }
}

if (require.main === module) run()
