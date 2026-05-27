export type CompanyAddressFields = {
  address_line_1?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pin_code?: string | null;
  address?: string | null;
};

export type CompanyListItem = CompanyAddressFields & {
  id: string;
  title: string;
  description: string | null;
  email: string;
  phone: string | null;
  is_active: boolean;
  is_deleted?: boolean;
  total_users: number;
  total_policies: number;
  created_at: string;
  updated_at: string;
};

export type CompanyDropdownItem = {
  id: string;
  title: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
};

export type CompanyFormValues = {
  title: string;
  email: string;
  phone: string;
  address_line_1: string;
  city: string;
  state: string;
  country: string;
  pin_code: string;
  description: string;
  is_active: boolean;
};

export type PaginatedCompanies = {
  items: CompanyListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
