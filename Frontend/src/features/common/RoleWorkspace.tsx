import { useAuth } from "../../hooks/useAuth";
import { USER_ROLES } from "../../config/constants";
import type { Role } from "../../types/models";
import { RequesterDashboard } from "../requester/RequesterDashboard";
import { CheckerDashboard } from "../checker/CheckerDashboard";
import { ApproverDashboard } from "../approver/ApproverDashboard";
import { SupplyBranchDashboard } from "../supply/SupplyBranchDashboard";
import { SubjectClerkDashboard } from "../clerk/SubjectClerkDashboard";
import { NotificationsPanel } from "./NotificationsPanel";

export function RoleWorkspace() {
  const { user } = useAuth();

  if (!user) return null;

  const approverRoles: Role[] = [
    USER_ROLES.DEAN,
    USER_ROLES.REGISTRAR,
    USER_ROLES.BURSAR,
    USER_ROLES.VICE_CHANCELLOR,
  ];

  const checkerRoles: Role[] = [
    USER_ROLES.DIRECTOR_ICT,
    USER_ROLES.MAINTENANCE_ENGINEER,
  ];

  return (
    <div className="stack">
      {user.role === USER_ROLES.REQUESTING_OFFICER && <RequesterDashboard />}
      {checkerRoles.includes(user.role) && <CheckerDashboard />}
      {approverRoles.includes(user.role) && <ApproverDashboard />}
      {user.role === USER_ROLES.SUPPLY_BRANCH && <SupplyBranchDashboard />}
      {user.role === USER_ROLES.SUBJECT_CLERK && <SubjectClerkDashboard />}
      <NotificationsPanel />
    </div>
  );
}
