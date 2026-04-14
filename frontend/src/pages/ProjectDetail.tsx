import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { AuthContext } from '../AuthContext'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const auth = useContext(AuthContext)
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [assigneeId, setAssigneeId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [editProjectMode, setEditProjectMode] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [taskEditTitle, setTaskEditTitle] = useState('')
  const [taskEditDescription, setTaskEditDescription] = useState('')

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${id}`)
      setProject(res)
      setProjectName(res.name || '')
      setProjectDescription(res.description || '')
    } catch (e: any) {
      setError(e.fields ? Object.values(e.fields).join(', ') : e.error || 'Failed to load project')
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users')
      setUsers(res.users)
    } catch (e: any) {
      // ignore user load failures
    }
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchProject(), fetchUsers()]).finally(() => setLoading(false))
  }, [id])

  const createTask = async (e: any) => {
    e.preventDefault()
    try {
      await api.post(`/projects/${id}/tasks`, {
        title,
        description,
        priority,
        assignee_id: assigneeId || null,
        due_date: dueDate || null,
      })
      setTitle('')
      setDescription('')
      setPriority('medium')
      setAssigneeId('')
      setDueDate('')
      setShowCreate(false)
      fetchProject()
    } catch (e: any) {
      setError(e.fields ? Object.values(e.fields).join(', ') : e.error || 'Failed to create task')
    }
  }

  const updateProject = async (e: any) => {
    e.preventDefault()
    try {
      await api.patch(`/projects/${id}`, { name: projectName, description: projectDescription })
      setEditProjectMode(false)
      fetchProject()
    } catch (e: any) {
      setError(e.fields ? Object.values(e.fields).join(', ') : e.error || 'Failed to update project')
    }
  }

  const deleteProject = async () => {
    if (!window.confirm('Delete this project?')) return
    try {
      await api.del(`/projects/${id}`)
      navigate('/projects')
    } catch (e: any) {
      setError(e.fields ? Object.values(e.fields).join(', ') : e.error || 'Failed to delete project')
    }
  }

  const startEditTask = (task: any) => {
    setEditingTaskId(task.id)
    setTaskEditTitle(task.title || '')
    setTaskEditDescription(task.description || '')
  }

  const cancelEditTask = () => {
    setEditingTaskId(null)
    setTaskEditTitle('')
    setTaskEditDescription('')
  }

  const saveTaskEdits = async (taskId: string) => {
    try {
      await api.patch(`/tasks/${taskId}`, { title: taskEditTitle, description: taskEditDescription })
      cancelEditTask()
      fetchProject()
    } catch (e: any) {
      setError(e.fields ? Object.values(e.fields).join(', ') : e.error || 'Failed to update task')
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!window.confirm('Delete this task?')) return
    try {
      await api.del(`/tasks/${taskId}`)
      fetchProject()
    } catch (e: any) {
      setError(e.fields ? Object.values(e.fields).join(', ') : e.error || 'Failed to delete task')
    }
  }

  const updateTask = async (taskId: string, payload: any) => {
    if (!project) return
    setProject({ ...project, tasks: project.tasks.map((task: any) => task.id === taskId ? { ...task, ...payload } : task) })
    try {
      await api.patch(`/tasks/${taskId}`, payload)
    } catch (e: any) {
      setError(e.fields ? Object.values(e.fields).join(', ') : e.error || 'Failed to update task')
      fetchProject()
    }
  }

  if (loading) return <div className="container">Loading...</div>
  if (error) return <div className="container">Error: {error}</div>
  if (!project) return <div className="container">Not found</div>

  const filteredTasks = project.tasks.filter((task: any) => {
    return (!statusFilter || task.status === statusFilter) && (!assigneeFilter || task.assignee_id === assigneeFilter)
  })

  return (
    <div className="container">
      <h2>{project.name}</h2>
      <p>{project.description || 'No description yet.'}</p>

      {auth.user?.id === project.owner_id && (
        <div style={{ marginBottom: '20px' }}>
          <button type="button" onClick={() => setEditProjectMode(!editProjectMode)}>{editProjectMode ? 'Cancel Edit' : 'Edit Project'}</button>
          <button type="button" className="danger" onClick={deleteProject} style={{ marginLeft: '12px' }}>Delete Project</button>
        </div>
      )}

      {editProjectMode && (
        <form onSubmit={updateProject} className="form" style={{ marginBottom: '20px' }}>
          <label>Name<input value={projectName} onChange={e => setProjectName(e.target.value)} required /></label>
          <label>Description<textarea value={projectDescription} onChange={e => setProjectDescription(e.target.value)} /></label>
          <button type="submit">Save Project</button>
          <button type="button" onClick={() => setEditProjectMode(false)}>Cancel</button>
        </form>
      )}

      <div className="form" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <label style={{ flex: '1 1 220px' }}>
            Filter status
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </label>
          <label style={{ flex: '1 1 220px' }}>
            Filter assignee
            <select value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)}>
              <option value="">All</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
            </select>
          </label>
        </div>
      </div>

      <button onClick={() => setShowCreate(!showCreate)}>{showCreate ? 'Cancel' : 'Create Task'}</button>

      {showCreate && (
        <div className="modal-overlay">
          <div className="modal-content">
            <form onSubmit={createTask} className="form">
              <label>Title<input value={title} onChange={e => setTitle(e.target.value)} required /></label>
              <label>Description<textarea value={description} onChange={e => setDescription(e.target.value)} /></label>
              <label>Priority<select value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select></label>
              <label>Assignee<select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
              </select></label>
              <label>Due Date<input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></label>
              <button type="submit">Create</button>
              <button type="button" onClick={() => setShowCreate(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {filteredTasks.length === 0 ? <div>No tasks</div> : (
        <ul className="task-list">
          {filteredTasks.map((t: any) => (
            <li key={t.id} className="task">
              {editingTaskId === t.id ? (
                <form onSubmit={e => { e.preventDefault(); saveTaskEdits(t.id) }} className="form">
                  <label>Title<input value={taskEditTitle} onChange={e => setTaskEditTitle(e.target.value)} required /></label>
                  <label>Description<textarea value={taskEditDescription} onChange={e => setTaskEditDescription(e.target.value)} /></label>
                  <button type="submit">Save</button>
                  <button type="button" onClick={cancelEditTask}>Cancel</button>
                </form>
              ) : (
                <>
                  <strong>{t.title}</strong>
                  <div>{t.description || 'No description provided.'}</div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '10px' }}>
                    <label>Status<select value={t.status} onChange={e => updateTask(t.id, { status: e.target.value })}>
                      <option value="todo">Todo</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select></label>
                    <label>Priority<select value={t.priority} onChange={e => updateTask(t.id, { priority: e.target.value })}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select></label>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <span>{t.assignee_id ? `Assigned to: ${users.find(u => u.id === t.assignee_id)?.name || 'Unknown'}` : 'Unassigned'}</span>
                    {t.due_date && <span> Due: {new Date(t.due_date).toLocaleDateString()}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                    <button type="button" onClick={() => startEditTask(t)}>Edit</button>
                    <button type="button" className="danger" onClick={() => deleteTask(t.id)}>Delete</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
