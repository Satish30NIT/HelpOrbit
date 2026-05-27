export type Company = {
  id: string;
  title: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
};

export type PolicyListItem = {
  id: string;
  policy_name: string;
  title: string;
  description: string;
  company_id: string;
  company_name: string;
  is_active: boolean;
  total_users: number;
  acknowledged_users: number;
  pending_users: number;
  created_at: string;
  updated_at: string;
};

export type PolicyUserStatus = {
  id: string;
  user_id: number;
  user_name: string;
  email: string;
  company_name: string;
  status: "acknowledged" | "pending" | "restricted";
  is_assigned: boolean;
  is_acknowledged: boolean;
  acknowledged_at: string | null;
  created_at: string | null;
};

export type PolicyDetail = {
  policy: PolicyListItem & {
    is_deleted: boolean;
    company_email?: string;
    company_phone?: string;
    company_description?: string;
  };
  company: {
    id: string;
    title: string;
    email: string;
    phone: string | null;
    description: string | null;
  };
  statistics: {
    total_assigned: number;
    acknowledged: number;
    pending: number;
  };
  assigned_users: PolicyUserStatus[];
};

export type PolicyStatusData = {
  policy_id: string;
  policy_name: string;
  title: string;
  company_id?: string;
  company_name: string;
  total_assigned: number;
  acknowledged: number;
  pending: number;
  restricted: number;
  users: PolicyUserStatus[];
  acknowledged_users: PolicyUserStatus[];
  pending_users: PolicyUserStatus[];
  restricted_users: PolicyUserStatus[];
};

export type PaginatedPolicies = {
  items: PolicyListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type PolicyFormValues = {
  company_id: string;
  policy_name: string;
  title: string;
  description: string;
  is_active?: boolean;
};
