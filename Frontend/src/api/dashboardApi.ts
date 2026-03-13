import { apiRequest } from "./client";
import type { Job, NotificationItem } from "../types/models";

export const dashboardApi = {
  requester(token: string) {
    return apiRequest<Array<{ status: string; count: number }>>(
      "/dashboard/requester",
      { token },
    );
  },

  approver(token: string) {
    return apiRequest<Array<{ decision: string; count: number }>>(
      "/dashboard/approver",
      { token },
    );
  },

  supplyBranch(token: string) {
    return apiRequest<Job[]>("/dashboard/supply-branch", { token });
  },

  notifications(token: string) {
    return apiRequest<NotificationItem[]>("/dashboard/notifications", {
      token,
    });
  },
};
