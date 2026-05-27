import {
  BarChart3,
  Building2,
  Code2,
  Database,
  FileText,
  ScrollText,
  Server,
  Settings,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type ModuleStatus = "live" | "soon";

export type DashboardModule = {
  id: string;
  title: string;
  description: string;
  href?: string;
  status: ModuleStatus;
  icon: LucideIcon;
  adminOnly?: boolean;
  features: string[];
};

export const APP_ABOUT = {
  name: "HelpOrbit",
  tagline: "Multi-company customer support management platform",
  goalTitle: "Goal of HelpOrbit",
  goal:
    "HelpOrbit helps organizations deliver consistent, policy-driven customer support efficiently across multiple companies using a centralized management system.",
  summary:
    "HelpOrbit is a multi-company customer support management platform designed to streamline support operations across organizations.",
  overview:
    "The platform allows administrators to manage companies, users, support assignments, and policies from a centralized system.",
  howItWorksTitle: "How HelpOrbit works",
  howItWorks: [
    "Administrators create and manage companies.",
    "Support users are added into the platform.",
    "Users are mapped to one or multiple companies they support.",
    "Admins create customer support policies and guidelines.",
    "Newly added policies are automatically assigned to users responsible for customer support.",
    "Support agents use these policies while handling customer queries and issues.",
  ],
  keyCapabilitiesTitle: "Key capabilities",
  keyCapabilities: [
    "Multi-company support management",
    "Role-based user access",
    "Policy-driven customer support",
    "Centralized administration",
    "Audit logs and activity tracking",
    "Scalable support assignment system",
  ],
};

export const DASHBOARD_MODULES: DashboardModule[] = [
  {
    id: "companies",
    title: "Company Management",
    description: "Onboard organizations, contacts, addresses, and activation status.",
    href: "/dashboard/companies",
    status: "live",
    icon: Building2,
    adminOnly: true,
    features: ["CRUD", "Filters & pagination", "Per-company activity drawer"],
  },
  {
    id: "users",
    title: "User Management",
    description: "Create users, assign roles, map companies, and manage access.",
    href: "/dashboard/users",
    status: "live",
    icon: Users,
    adminOnly: true,
    features: ["CRUD", "Company mapping", "Soft delete"],
  },
  {
    id: "policies",
    title: "Policy Management",
    description: "Publish policies, assign audiences, and monitor acknowledgements.",
    href: "/dashboard/policies",
    status: "live",
    icon: FileText,
    adminOnly: true,
    features: ["CRUD", "Assignments", "Acknowledgement workflow"],
  },
  {
    id: "activity",
    title: "Activity Logs",
    description: "Audit trail for company and user changes with ES-backed search.",
    href: "/dashboard/activity",
    status: "live",
    icon: ScrollText,
    adminOnly: true,
    features: ["Unified timeline", "Filters & export", "JSON payload viewer"],
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "Acknowledgement rates, trends, and operational insights.",
    status: "soon",
    icon: BarChart3,
    adminOnly: true,
    features: ["Dashboards", "Trends", "Exports"],
  },
  {
    id: "settings",
    title: "Settings",
    description: "Workspace preferences, integrations, and notification defaults.",
    status: "soon",
    icon: Settings,
    features: ["Branding", "Integrations", "Notifications"],
  },
];

export type TechLayer = {
  name: string;
  icon: LucideIcon;
  items: { label: string; detail?: string }[];
};

export const TECH_STACK: TechLayer[] = [
  {
    name: "Backend",
    icon: Code2,
    items: [
      { label: "Node.js" },
      { label: "Express 5", detail: "REST API" },
      { label: "Joi", detail: "Request validation" },
      { label: "JWT + bcrypt", detail: "Auth" },
    ],
  },
  {
    name: "Frontend",
    icon: Zap,
    items: [
      { label: "Next.js 16", detail: "App Router, React 19" },
      { label: "TypeScript" },
      { label: "Tailwind CSS v4" },
      { label: "Framer Motion", detail: "UI motion" },
    ],
  },
  {
    name: "Database",
    icon: Database,
    items: [
      { label: "PostgreSQL", detail: "Primary datastore" },
      { label: "Redis", detail: "Cache (optional)" },
      { label: "Elasticsearch 8", detail: "Audit logs" },
    ],
  },
  {
    name: "Tools",
    icon: Server,
    items: [{ label: "Winston", detail: "Structured logging" }],
  },
];

export const ARCHITECTURE_FLOW = [
  "Browser → Next.js UI",
  "REST API → Express",
  "PostgreSQL · Redis · Elasticsearch",
];
