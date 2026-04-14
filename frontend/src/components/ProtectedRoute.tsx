import React, { useContext } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { AuthContext } from '../AuthContext'

export default function ProtectedRoute(){
  const auth = useContext(AuthContext)
  if(!auth.user) return <Navigate to="/login" replace />
  return <Outlet />
}
