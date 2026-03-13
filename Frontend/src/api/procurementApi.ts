import { apiRequest } from "./client";
import type { Job, Supplier } from "../types/models";

export const procurementApi = {
  createSupplier(
    token: string,
    payload: { name: string; email: string; category: string },
  ) {
    return apiRequest<Supplier>("/procurement/suppliers", {
      method: "POST",
      token,
      body: payload,
    });
  },

  listSuppliers(token: string) {
    return apiRequest<Supplier[]>("/procurement/suppliers", { token });
  },

  startJob(token: string, requestId: number, procurementMethod: string) {
    return apiRequest<Job>(`/procurement/requests/${requestId}/start`, {
      method: "POST",
      token,
      body: { procurementMethod },
    });
  },

  assignClerk(token: string, jobId: number, clerkId: number) {
    return apiRequest<Job>(`/procurement/jobs/${jobId}/assign-clerk`, {
      method: "POST",
      token,
      body: { clerkId },
    });
  },

  selectCategory(token: string, jobId: number, category: string) {
    return apiRequest<Supplier[]>(
      `/procurement/jobs/${jobId}/select-category`,
      {
        method: "POST",
        token,
        body: { category },
      },
    );
  },

  selectSuppliers(token: string, jobId: number, supplierIds: number[]) {
    return apiRequest<Supplier[]>(
      `/procurement/jobs/${jobId}/select-suppliers`,
      {
        method: "POST",
        token,
        body: { supplierIds },
      },
    );
  },

  generateLetters(token: string, jobId: number, submissionDeadline: string) {
    return apiRequest<{
      jobNumber: string;
      letterContent: string;
      recipients: Supplier[];
    }>(`/procurement/jobs/${jobId}/generate-letters`, {
      method: "POST",
      token,
      body: { submissionDeadline },
    });
  },

  getSchedule(token: string, jobId: number) {
    return apiRequest<{
      jobNumber: string;
      itemName: string;
      description: string;
      rows: Array<{
        supplierId: number;
        supplierName: string;
        quotationReceived: boolean;
        quotedPrice: string | null;
        submissionDate: string | null;
        evaluationResult: string | null;
      }>;
    }>(`/procurement/jobs/${jobId}/schedule`, { token });
  },
};
