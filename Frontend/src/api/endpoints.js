import api from "./client";

export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login: (email, password) => api.post("/auth/login", { email, password }),
  listUsersByRole: (role) => api.get("/auth/users", { params: { role } }),
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
};

export const postProcurementApi = {
  sendToTec: (jobId) => api.post(`/post-procurement/jobs/${jobId}/send-to-tec`),
  enterTecDecisions: (jobId, data) =>
    api.post(`/post-procurement/jobs/${jobId}/tec-decisions`, data),
  getCommitteeReport: (jobId) =>
    api.get(`/post-procurement/jobs/${jobId}/committee-report`),
  routeCommittee: (jobId) =>
    api.post(`/post-procurement/jobs/${jobId}/route-committee`),
  committeeDecision: (jobId, data) =>
    api.post(`/post-procurement/jobs/${jobId}/committee-decision`, data),
  generatePurchaseOrders: (jobId, data) =>
    api.post(`/post-procurement/jobs/${jobId}/purchase-orders`, data),
  listPurchaseOrders: (jobId) =>
    api.get(`/post-procurement/jobs/${jobId}/purchase-orders`),
  getDeliveryByToken: (token) =>
    api.get(`/post-procurement/delivery/confirm/${token}`),
  confirmDeliveryByToken: (token, data) =>
    api.post(`/post-procurement/delivery/confirm/${token}`, data),
  generateDeliveryNote: (purchaseOrderId, data) =>
    api.post(
      `/post-procurement/purchase-orders/${purchaseOrderId}/delivery-note`,
      data,
    ),
  generatePaymentVoucher: (purchaseOrderId, data) =>
    api.post(
      `/post-procurement/purchase-orders/${purchaseOrderId}/payment-voucher`,
      data,
    ),
  quarterlyReport: (params) =>
    api.get("/post-procurement/reports/quarterly", { params }),
  annualReport: (params) =>
    api.get("/post-procurement/reports/annual", { params }),
};

export const supplierApi = {
  list: (params) => api.get("/suppliers", { params }),
  create: (data) => api.post("/suppliers", data),
  getByCategory: (category) => api.get(`/suppliers/category/${category}`),
};
