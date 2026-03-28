import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/endpoints'
import Input from '../components/Input'
import Button from '../components/Button'
import Alert from '../components/Alert'
import './Auth.css'

export default function Login({ setUser }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authApi.login(email, password)
      const { token, user } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🎓 Procurement System</h1>
          <p>University Purchase Management</p>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
          />

          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />

          <Button type="submit" disabled={loading} className="full-width">
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <div className="auth-footer">
          <p>Demo Credentials:</p>
          <ul>
            <li><strong>Officer:</strong> officer@uni.edu / password</li>
            <li><strong>Checker:</strong> checker@uni.edu / password</li>
            <li><strong>Approver:</strong> approver@uni.edu / password</li>
            <li><strong>Supply:</strong> supply@uni.edu / password</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
