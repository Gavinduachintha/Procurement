import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import RequestSubmission from './pages/RequestSubmission'
import SpecificationReview from './pages/SpecificationReview'
import ApprovalDashboard from './pages/ApprovalDashboard'
import SupplyBranchDashboard from './pages/SupplyBranchDashboard'
import RequestDetails from './pages/RequestDetails'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      setUser(JSON.parse(userData))
    }
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        
        {user ? (
          <Route element={<Layout user={user} setUser={setUser} />}>
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/request/new" element={<RequestSubmission user={user} />} />
            <Route path="/request/:id" element={<RequestDetails user={user} />} />
            <Route path="/specification-review" element={<SpecificationReview user={user} />} />
            <Route path="/approvals" element={<ApprovalDashboard user={user} />} />
            <Route path="/supply-branch" element={<SupplyBranchDashboard user={user} />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Router>
  )
}

export default App
