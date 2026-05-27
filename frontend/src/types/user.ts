export type UserCompanyRef = {
  id: string;
  title: string;
  email?: string;
};

export type UserListItem = {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  user_name: string;
  email: string;
  phone: string | null;
  role_id: number;
  role_name: string;
  is_active: boolean;
  is_deleted?: boolean;
  companies: UserCompanyRef[];
  created_at: string;
  updated_at: string;
};

export type RoleOption = {
  id: number;
  role_name: string;
};

export type UserFormValues = {
  first_name: string;
  middle_name: string;
  last_name: string;
  user_name: string;
  email: string;
  phone: string;
  password: string;
  role_id: number;
  is_active: boolean;
  company_ids: string[];
};

export type PaginatedUsers = {
  items: UserListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type UserStatusFilter = "all" | "active" | "inactive";
