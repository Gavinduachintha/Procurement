import { apiRequest } from "./client";
import type { PurchaseRequest } from "../types/models";

export const requestApi = {
  create(
    token: string,
    payload: {
      itemName: string;
      itemDescription?: string;
      technicalSpecifications: string;
      itemType: "IT" | "NON_IT";
      quantity: number;
      estimatedCost: number;
      fundingSource: "MPP" | "SELF_FUND" | "SPECIAL_FUND";
      justification: string;
      department: string;
      requiredDate: string;
      attachments: string[];
    },
  ) {
    return apiRequest<PurchaseRequest>("/requests", {
      method: "POST",
      token,
      body: payload,
    });
  },

  mine(token: string) {
    return apiRequest<PurchaseRequest[]>("/requests/mine", { token });
  },

  assignedForSpecification(token: string) {
    return apiRequest<PurchaseRequest[]>("/requests/assigned/specification", {
      token,
    });
  },

  approvedWithoutJobs(token: string) {
    return apiRequest<PurchaseRequest[]>("/requests/approved/without-jobs", {
      token,
    });
  },
};
