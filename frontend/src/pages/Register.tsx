import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { AuthContext } from '../AuthContext'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const auth = useContext(AuthContext)
  const nav = useNavigate()

  const submit = async (e: any) => {
    e.preventDefault()
    setErr(null)
    try {
      const res = await api.post('/auth/register', { name, email, password })
      auth.login(res.token, res.user)
      nav('/')
    } catch (er: any) {
      setErr(er.fields ? Object.values(er.fields).join(', ') : er.error || 'Registration failed')
    }
  }

  return (
    <div className="container">
      <h2>Register</h2>
      <form onSubmit={submit}>
        <label>Name<input value={name} onChange={e=>setName(e.target.value)} /></label>
        <label>Email<input value={email} onChange={e=>setEmail(e.target.value)} /></label>
        <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} /></label>
        <button type="submit">Register</button>
      </form>
      {err && <div className="error">{err}</div>}
    </div>
  )
}
