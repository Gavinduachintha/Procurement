import { apiRequest } from "./client";
import type { PurchaseRequest } from "../types/models";

export const approvalApi = {
  pending(token: string) {
    return apiRequest<PurchaseRequest[]>("/approvals/mine/pending", { token });
  },

  decide(
    token: string,
    requestId: number,
    payload: {
      decision: "APPROVED" | "REJECTED" | "CLARIFICATION_REQUESTED";
      comments?: string;
    },
  ) {
    return apiRequest<{ request: PurchaseRequest }>(
      `/approvals/${requestId}/decision`,
      {
        method: "POST",
        token,
        body: payload,
      },
    );
  },
};
