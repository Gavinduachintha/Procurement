import { apiRequest } from "./client";
import type { PurchaseRequest } from "../types/models";

export const specificationApi = {
  review(
    token: string,
    requestId: number,
    payload: { reviewedSpecifications: string; reviewNotes?: string },
  ) {
    return apiRequest<PurchaseRequest>(`/specifications/${requestId}/review`, {
      method: "POST",
      token,
      body: payload,
    });
  },

  requesterConfirm(
    token: string,
    requestId: number,
    action: "ACCEPT" | "REQUEST_MODIFICATION",
  ) {
    return apiRequest<PurchaseRequest>(
      `/specifications/${requestId}/requester-confirmation`,
      {
        method: "POST",
        token,
        body: { action },
      },
    );
  },
};
