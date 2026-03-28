import api from './client'

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

export const requestApi = {
  submit: (data) => api.post('/requests', data),
  list: (params) => api.get('/requests', { params }),
  get: (id) => api.get(`/requests/${id}`),
  confirmSpecification: (id, data) => api.post(`/requests/${id}/confirm-specification`, data)
}

export const specificationApi = {
  listReviews: (params) => api.get('/specifications', { params }),
  review: (id, data) => api.post(`/specifications/${id}/review`, data)
}

export const approvalApi = {
  listPending: (params) => api.get('/approvals', { params }),
  approve: (id, data) => api.post(`/approvals/${id}/approve`, data),
  reject: (id, data) => api.post(`/approvals/${id}/reject`, data),
  requestClarification: (id, data) => api.post(`/approvals/${id}/clarification`, data)
}

export const procurementApi = {
  getJobs: (params) => api.get('/procurement/jobs', { params }),
  startJob: (id, data) => api.post(`/procurement/${id}/start-job`, data),
  selectMethod: (id, data) => api.post(`/procurement/${id}/method`, data),
  selectSuppliers: (id, data) => api.post(`/procurement/${id}/suppliers`, data),
  selectCategory: (id, data) => api.post(`/procurement/${id}/category`, data),
  generateLetters: (id) => api.get(`/procurement/${id}/letters`),
  getSchedule: (id) => api.get(`/procurement/${id}/schedule`)
}

export const supplierApi = {
  list: (params) => api.get('/suppliers', { params }),
  create: (data) => api.post('/suppliers', data),
  getByCategory: (category) => api.get(`/suppliers/category/${category}`)
}
