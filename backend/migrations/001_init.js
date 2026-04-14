exports.up = (pgm) => {
  pgm.sql("CREATE TYPE task_status AS ENUM ('todo','in_progress','done')")
  pgm.sql("CREATE TYPE task_priority AS ENUM ('low','medium','high')")

  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true },
    name: { type: 'text', notNull: true },
    email: { type: 'text', notNull: true, unique: true },
    password: { type: 'text', notNull: true },
    created_at: { type: 'timestamp', notNull: true }
  })

  pgm.createTable('projects', {
    id: { type: 'uuid', primaryKey: true },
    name: { type: 'text', notNull: true },
    description: { type: 'text' },
    owner_id: { type: 'uuid', notNull: true },
    created_at: { type: 'timestamp', notNull: true }
  })
  pgm.addConstraint('projects', 'projects_owner_fk', 'FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE')

  pgm.createTable('tasks', {
    id: { type: 'uuid', primaryKey: true },
    title: { type: 'text', notNull: true },
    description: { type: 'text' },
    status: { type: 'task_status', notNull: true, default: 'todo' },
    priority: { type: 'task_priority', notNull: true, default: 'medium' },
    project_id: { type: 'uuid', notNull: true },
    assignee_id: { type: 'uuid' },
    creator_id: { type: 'uuid', notNull: true },
    due_date: { type: 'date' },
    created_at: { type: 'timestamp', notNull: true },
    updated_at: { type: 'timestamp', notNull: true }
  })
  pgm.addConstraint('tasks', 'tasks_project_fk', 'FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE')
  pgm.addConstraint('tasks', 'tasks_assignee_fk', 'FOREIGN KEY(assignee_id) REFERENCES users(id)')
  pgm.addConstraint('tasks', 'tasks_creator_fk', 'FOREIGN KEY(creator_id) REFERENCES users(id)')
}

exports.down = (pgm) => {
  pgm.dropTable('tasks')
  pgm.dropTable('projects')
  pgm.dropTable('users')
  pgm.dropType('task_status')
  pgm.dropType('task_priority')
}
