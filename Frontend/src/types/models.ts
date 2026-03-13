export type Role =
  | "REQUESTING_OFFICER"
  | "DIRECTOR_ICT"
  | "MAINTENANCE_ENGINEER"
  | "DEAN"
  | "REGISTRAR"
  | "BURSAR"
  | "VICE_CHANCELLOR"
  | "SUPPLY_BRANCH"
  | "SUBJECT_CLERK";

export type User = {
  id: number;
  full_name: string;
  email: string;
  role: Role;
  department?: string | null;
};

export type AuthResponse = {
  user: User;
  token: string;
};

export type PurchaseRequest = {
  id: number;
  request_id: string;
  requester_id: number;
  item_name: string;
  item_description: string | null;
  technical_specifications: string;
  checked_specifications: string | null;
  item_type: "IT" | "NON_IT";
  quantity: number;
  estimated_cost: string;
  funding_source: "MPP" | "SELF_FUND" | "SPECIAL_FUND";
  justification: string;
  department: string;
  required_date: string;
  status: string;
  specification_checker_id: number | null;
};

export type Job = {
  id: number;
  purchase_request_id: number;
  procurement_method: string;
  year: number;
  serial_number: number;
  job_number: string;
  supplier_category: string | null;
  assigned_clerk_id: number | null;
  status: string;
  request_id?: string;
  item_name?: string;
  department?: string;
  request_status?: string;
};

export type Supplier = {
  id: number;
  name: string;
  email: string;
  category: string;
};

export type NotificationItem = {
  id: number;
  event_type: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
};
