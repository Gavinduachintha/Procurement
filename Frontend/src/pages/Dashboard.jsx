import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Eye } from 'lucide-react'
import { requestApi } from '../api/endpoints'
import Card from '../components/Card'
import Button from '../components/Button'
import Alert from '../components/Alert'
import './Dashboard.css'

export default function Dashboard({ user }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      const response = await requestApi.list()
      setRequests(response.data)
    } catch (err) {
      setError('Failed to load requests')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statuses = {
      'SUBMITTED': 'badge-info',
      'SPEC_CHECKING': 'badge-warning',
      'SPEC_CHECKED': 'badge-info',
      'SPEC_REWORK_REQUESTED': 'badge-warning',
      'APPROVAL_PENDING': 'badge-warning',
      'APPROVED': 'badge-success',
      'REJECTED': 'badge-danger',
      'CLARIFICATION_REQUESTED': 'badge-warning',
      'IN_PROCUREMENT': 'badge-info',
      'COMPLETED': 'badge-success'
    }
    return statuses[status] || 'badge-info'
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome, {user?.name}</p>
        </div>
        {user?.role === 'REQUESTING_OFFICER' && (
          <Link to="/request/new" className="btn btn-primary">
            <Plus size={18} />
            New Request
          </Link>
        )}
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <div className="loading-state">Loading requests...</div>
      ) : requests.length === 0 ? (
        <Card className="empty-state">
          <p>No requests found</p>
          {user?.role === 'REQUESTING_OFFICER' && (
            <Link to="/request/new" className="btn btn-primary mt-2">
              Create Your First Request
            </Link>
          )}
        </Card>
      ) : (
        <Card>
          <table className="table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Item Name</th>
                <th>Department</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td><strong>{req.id}</strong></td>
                  <td>{req.item_name}</td>
                  <td>{req.department}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(req.status)}`}>
                      {req.status}
                    </span>
                  </td>
                  <td>${req.estimated_cost}</td>
                  <td>
                    <Link to={`/request/${req.id}`} className="btn btn-sm btn-secondary">
                      <Eye size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
