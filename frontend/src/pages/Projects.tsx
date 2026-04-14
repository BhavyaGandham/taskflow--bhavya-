import React, { useEffect, useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { AuthContext } from '../AuthContext'

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const auth = useContext(AuthContext)

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects')
      setProjects(res.projects)
    } catch (e: any) { setError(e.fields ? Object.values(e.fields).join(', ') : e.error || 'Failed to load projects') }
  }

  const startEditProject = (project: any) => {
    setEditingProjectId(project.id)
    setEditName(project.name || '')
    setEditDescription(project.description || '')
  }

  const cancelEditProject = () => {
    setEditingProjectId(null)
    setEditName('')
    setEditDescription('')
  }

  const saveProject = async (e: any) => {
    e.preventDefault()
    if (!editingProjectId) return
    try {
      await api.patch(`/projects/${editingProjectId}`, { name: editName, description: editDescription })
      cancelEditProject()
      fetchProjects()
    } catch (e: any) { setError(e.fields ? Object.values(e.fields).join(', ') : e.error || 'Failed to update project') }
  }

  const deleteProject = async (projectId: string) => {
    if (!window.confirm('Delete this project?')) return
    try {
      await api.del(`/projects/${projectId}`)
      if (editingProjectId === projectId) cancelEditProject()
      fetchProjects()
    } catch (e: any) { setError(e.fields ? Object.values(e.fields).join(', ') : e.error || 'Failed to delete project') }
  }

  useEffect(() => {
    fetchProjects()
    setLoading(false)
  }, [])

  const createProject = async (e: any) => {
    e.preventDefault()
    try {
      await api.post('/projects', { name, description })
      setName('')
      setDescription('')
      setShowCreate(false)
      fetchProjects()
    } catch (e: any) { setError(e.fields ? Object.values(e.fields).join(', ') : e.error || 'Failed to create project') }
  }

  if (loading) return <div className="container">Loading...</div>
  if (error) return <div className="container">Error: {error}</div>

  return (
    <div className="container">
      <h2>Projects</h2>
      <button onClick={() => setShowCreate(!showCreate)}>{showCreate ? 'Cancel' : 'Create Project'}</button>
      {showCreate && (
        <div className="modal-overlay">
          <div className="modal-content">
            <form onSubmit={createProject} className="form">
              <label>Name <input value={name} onChange={e => setName(e.target.value)} required /></label>
              <label>Description <textarea value={description} onChange={e => setDescription(e.target.value)} /></label>
              <button type="submit">Create</button>
              <button type="button" onClick={() => setShowCreate(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}
      <div className="project-list">
        {projects.length === 0 && <div>No projects</div>}
        {projects.map(p => (
          <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="project">
              <div className="project-title">{p.name}</div>
              <div className="muted">{p.description}</div>
              {auth.user?.id === p.owner_id && (
                <div className="project-actions" style={{ marginTop: '10px' }}>
                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEditProject(p) }}>Edit</button>
                  <button type="button" className="danger" onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteProject(p.id) }}>Delete</button>
                </div>
              )}
              {editingProjectId === p.id && (
                <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); saveProject(e) }} className="form" style={{ marginTop: '15px' }}>
                  <label>Name <input value={editName} onChange={e => setEditName(e.target.value)} required /></label>
                  <label>Description <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} /></label>
                  <button type="submit">Save</button>
                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); cancelEditProject() }}>Cancel</button>
                </form>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
