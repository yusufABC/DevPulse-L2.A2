export const role = ["contributor", "maintainer"] as const;

export type Role = (typeof role)[number];

export function isRole(value: any): value is Role {
  return role.includes(value);
}

export type User = {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  created_at: Date;
  updated_at: Date;
};

export type RUser = Omit<
  User,
  "id" | "password_hash" | "created_at" | "updated_at"
>;

export type Order = {
  id: number;
  title: string;
  description: string;
  type: string;
  status: string;
  reporter_id: number;
  created_at: Date;
  updated_at: Date;
};

export const issueType = ["bug", "feature_request"];

export type IssueType = (typeof issueType)[number];

export type ReporterInfo = Pick<User, "id" | "name" | "role">;

export interface IssueWithReporter extends Omit<
  Order,
  "reporter_id" | "created_at" | "updated_at"
> {
  reporter: ReporterInfo;
  created_at: string;
  updated_at: string;
}

export interface UpdateIssueRequest {
  title?: string;
  description?: string;
  type?: IssueType;
  status?: "open" | "in_progress" | "resolved";
}
