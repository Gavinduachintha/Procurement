import api from "./client";

export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login: (email, password) => api.post("/auth/login", { email, password }),
  listUsersByRole: (role) => api.get("/auth/users", { params: { role } }),
  changePassword: (data) => api.post("/auth/change-password", data),
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
};

export const requestApi = {
  submit: (data) => api.post("/requests", data),
  list: (params) => api.get("/requests", { params }),
  get: (id) => api.get(`/requests/${id}`),
  confirmSpecification: (id, data) =>
    api.post(`/specifications/${id}/requester-confirmation`, data),
};

export const specificationApi = {
  listReviews: (params) => api.get("/specifications", { params }),
  review: (id, data) => api.post(`/specifications/${id}/review`, data),
};

export const approvalApi = {
  listPending: () => api.get("/approvals/mine/pending"),
  listAll: () => api.get("/approvals/mine/all"),
  decide: (id, data) => api.post(`/approvals/${id}/decision`, data),
};

export const procurementApi = {
  getJobs: () => api.get("/dashboard/supply-branch"),
  getApprovedWithoutJobs: () => api.get("/requests/approved/without-jobs"),
  startJob: (id, data) => api.post(`/procurement/${id}/method`, data),
  selectMethod: (id, data) => api.post(`/procurement/${id}/method`, data),
  assignClerk: (jobId, clerkId) =>
    api.post(`/procurement/jobs/${jobId}/assign-clerk`, { clerkId }),
  selectSuppliers: (id, data) => api.post(`/procurement/${id}/suppliers`, data),
  selectCategory: (id, data) =>
    api.post(`/procurement/jobs/${id}/select-category`, data),
  generateLetters: (id, data) =>
    api.post(`/procurement/jobs/${id}/generate-letters`, data),
  getSchedule: (id) => api.get(`/procurement/jobs/${id}/schedule`),
  updateScheduleLine: (jobId, supplierId, data) =>
    api.patch(`/procurement/jobs/${jobId}/schedule/lines/${supplierId}`, data),
  freezeSchedule: (jobId) => api.post(`/procurement/jobs/${jobId}/schedule/freeze`),
};

export const supplierApi = {
  list: (params) => api.get("/suppliers", { params }),
  create: (data) => api.post("/suppliers", data),
  getByCategory: (category) => api.get(`/suppliers/category/${category}`),
};
