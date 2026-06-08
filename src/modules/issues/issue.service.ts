import { pool } from "../../db/index.js";
import type {
  IssueType,
  IssueWithReporter,
  Order,
  Role,
  UpdateIssueRequest,
} from "../../types/index.js";

class IssueService {
  async createIssue(
    title: string,
    description: string,
    type: IssueType,
    reporterId: number,
  ) {
    const res = await pool`
        INSERT INTO issues(title,description,type,reporter_id)
        VALUES( ${title}, ${description}, ${type}, ${reporterId})
        RETURNING * 
        `;
    return res[0];
  }

  async getAllIssue(
    sort: "oldest" | "newest",
    type?: string,
    status?: string,
  ): Promise<IssueWithReporter[]> {
    const conditions: string[] = [];
    const values: (string | number)[] = [];
    let paramIndex = 1;

    if (type) {
      conditions.push(`type = $${paramIndex}`);
      values.push(type);
      paramIndex++;
    }

    if (status) {
      conditions.push(`status= $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const orderClause =
      sort === "oldest"
        ? "ORDER BY created_at ASC"
        : "ORDER BY created_at DESC";

    const issueQuery = `
         SELECT * FROM issues
         ${whereClause}
         ${orderClause}
     `;

    const issues = await pool.query(issueQuery, values);

    if (issues.length === 0) return [];

    const reporterIds = [
      ...new Set(issues.map((issue: any) => issue.reporter_id)),
    ];

    // Fetch reporter details

    const reportersRes = await pool`
     SELECT id, name, role FROM users WHERE id = ANY(${reporterIds})
 `;

    // Map reporters by ID
    const reporterMap = new Map(reportersRes.map((r: any) => [r.id, r]));

    // Combine data
    return issues.map((issue: any) => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: reporterMap.get(issue.reporter_id),
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    }));
  }

  async getSingleIssue(id: number) {
    const issues = await pool`
                SELECT * FROM issues WHERE id=${id}
                `;

    const issue = issues[0];
    if (!issue) return null;

    const reporter = await pool`
                SELECT id,name,role FROM users WHERE id=${issue.reporter_id}
                `;

    const { reporter_id, created_at, updated_at, ...rest } = issue;
    return {
      ...rest,
      reporter: reporter[0],
      created_at,
      updated_at,
    };
  }

  async updateIssue(
    id: number,
    payload: UpdateIssueRequest,
    user: { id: number; role: Role },
  ): Promise<IssueWithReporter> {
    const issue = await pool`
        SELECT * FROM issues WHERE id=${id}
        `;

    const existingIssue = issue[0];

    if (!existingIssue) {
      throw new Error("Issue not found");
    }

    //   Permission check
    if (user.role !== "maintainer" && user.id !== existingIssue.reporter_id) {
      throw new Error("You can only update your own issues");
    }

    if (user.role !== "maintainer" && existingIssue.status !== "open") {
      throw new Error("Contributors can only update open issues");
    }

    const { title, description, type } = payload;

    const res = await pool`
            UPDATE issues SET title=${title}, description=${description}, type=${type} ,"updated_at"=NOW() WHERE id=${id} RETURNING *
        `;
    console.log(res);
    return res[0] as IssueWithReporter;
  }

  // Delete issue

  async deleteIssue(id: number, user: { id: number; role: Role }) {
    // Check if maintainer only
    if (user.role !== "maintainer") {
      throw new Error("Only maintainers can delete issues");
    }

    const result = await pool`DELETE FROM issues WHERE id = ${id}`;
    console.log(result);
  }
}

export default new IssueService();
