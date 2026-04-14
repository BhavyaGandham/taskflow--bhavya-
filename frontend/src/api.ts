const BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:8080')

async function request(path: string, opts: any = {}) {
  const token = localStorage.getItem('token')
  const headers: any = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(BASE + path, { ...opts, headers })
  const text = await res.text()
  let body = null
  try { body = text ? JSON.parse(text) : null } catch (e) { body = text }
  if (!res.ok) throw body || { error: 'request failed' }
  return body
}

export const api = {
  post: (p: string, b: any) => request(p, { method: 'POST', body: JSON.stringify(b) }),
  get: (p: string) => request(p),
  patch: (p: string, b: any) => request(p, { method: 'PATCH', body: JSON.stringify(b) }),
  del: (p: string) => request(p, { method: 'DELETE' })
}
