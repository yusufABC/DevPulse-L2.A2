

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
import { env } from "process";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  port: env.PORT,
  database_string: env.DATABASE_STRING,
  node_env: env.NODE_ENV,
  secret: process.env.JWT_SECRET,
  refreshSecret: process.env.REFRESH_SECRET
};
var config_default = config;

// src/app.ts
import express from "express";

// src/middleware/logger.ts
var logger = (req, res, next) => {
  console.log(`[${(/* @__PURE__ */ new Date()).toLocaleDateString()}], ${req.method}, ${req.url}`);
  next();
};

// src/middleware/globalErrorHandler.ts
var globalErrorHanlder = (err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err instanceof Error ? err.message : "Internal server error",
    stack: config_default.node_env === "development" && err instanceof Error ? err.stack : void 0
  });
};

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/utils/sendResponse.ts
function sendResponse(res, { message, data, error }, status = 200) {
  res.status(status).json({
    success: error ? false : true,
    message,
    data: error ? void 0 : data
  });
}

// src/types/index.ts
var role = ["contributor", "maintainer"];
function isRole(value) {
  return role.includes(value);
}

// src/utils/jwt.ts
import jwt from "jsonwebtoken";
var signToken = (payload) => {
  const accessToken = jwt.sign(payload, config_default.secret, {
    expiresIn: "1d"
  });
  const refreshToken = jwt.sign(payload, config_default.refreshSecret, {
    expiresIn: "7d"
  });
  return { accessToken, refreshToken };
};
var verifyToken = (token, type) => {
  const secret = type === "access" ? config_default.secret : config_default.refreshSecret;
  const decoded = jwt.verify(token, secret);
  return decoded;
};

// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";

// src/db/index.ts
import { neon } from "@neondatabase/serverless";
var pool = neon(config_default.database_string);
var initDb = async () => {
  await pool`
    CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY,
    name VARCHAR(25) NOT NULL,
    email VARCHAR(75) UNIQUE NOT NULL ,
    password_hash TEXT NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'contributor',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()

    )
    `;
  await pool`
    CREATE TABLE IF NOT EXISTS issues(
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL CHECK (LENGTH(description) >=20),
    type VARCHAR(30) NOT NULL CHECK (type IN ('bug','feature_request')),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
    reporter_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()

    )
    `;
  console.log("Database Connected");
};
var db_default = initDb;

// src/modules/auth/auth.service.ts
var AuthService = class {
  async createUser(payload) {
    const { name, email, role: role2, password } = payload;
    const passwordHash = await bcrypt.hash(password, 10);
    const response = await pool`
    INSERT INTO users(name,email,password_hash,role)
    VALUES (${name},${email},${passwordHash},COALESCE(${role2},'contributor'))
    RETURNING  id,name,email,role,created_at,updated_at
    `;
    return response[0];
  }
  async validateUser(email, password) {
    const response = await pool`
  SELECT * FROM users WHERE email=${email}
  `;
    if (response.length === 0) {
      return null;
    }
    const { password_hash, ...user } = response[0];
    const isValid = await bcrypt.compare(password, password_hash);
    return isValid ? user : null;
  }
  async getUserById(id) {
    const res = await pool`
  SELECT  id, name, email, role FROM users WHERE id=${id}
  `;
    return res[0];
  }
};
var auth_service_default = new AuthService();

// src/modules/auth/auth.controller.ts
var createUser = async (req, res) => {
  const { role: role2 } = req.body;
  if (role2 && !isRole(role2)) {
    sendResponse(res, { message: "Invalid role" }, 400);
    return;
  }
  const user = await auth_service_default.createUser(req.body);
  if (!user) {
    sendResponse(res, { message: "Failed to create user" }, 400);
    return;
  }
  sendResponse(res, { message: "User created successfully", data: user }, 201);
};
var loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await auth_service_default.validateUser(email, password);
  if (!user) {
    sendResponse(res, { message: "Invalid email or password " }, 401);
    return;
  }
  const { accessToken, refreshToken } = signToken(user);
  const result = {
    token: accessToken,
    user
  };
  res.cookie("refreshToken", refreshToken, {
    sameSite: "lax",
    httpOnly: true,
    secure: false
  });
  return sendResponse(res, { message: "Login successful", data: result }, 200);
};
var refresh = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    sendResponse(res, { message: "refresh token is missing" }, 401);
  }
  const payload = verifyToken(refreshToken, "refresh");
  const user = await auth_service_default.getUserById(payload.id);
  if (!user) {
    sendResponse(res, { message: "User not found" }, 401);
  }
  const { accessToken, refreshToken: newRefreshToken } = signToken(user);
  res.cookie("refreshToken", newRefreshToken, {
    sameSite: "lax",
    httpOnly: true,
    secure: false
  });
  sendResponse(res, { message: "Token Refreshed", data: {
    accessToken,
    newRefreshToken
  } });
};
var authController = {
  createUser,
  loginUser,
  refresh
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.createUser);
router.post("/login", authController.loginUser);
router.post("/refresh", authController.refresh);
var authRouter = router;

// src/app.ts
import cookieParser from "cookie-parser";

// src/modules/issues/issue.route.ts
import { Router as Router2 } from "express";

// src/modules/issues/issue.service.ts
var IssueService = class {
  async createIssue(title, description, type, reporterId) {
    const res = await pool`
        INSERT INTO issues(title,description,type,reporter_id)
        VALUES( ${title}, ${description}, ${type}, ${reporterId})
        RETURNING * 
        `;
    return res[0];
  }
  async getAllIssue(sort, type, status) {
    const conditions = [];
    const values = [];
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
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderClause = sort === "oldest" ? "ORDER BY created_at ASC" : "ORDER BY created_at DESC";
    const issueQuery = `
         SELECT * FROM issues
         ${whereClause}
         ${orderClause}
     `;
    const issues = await pool.query(issueQuery, values);
    if (issues.length === 0) return [];
    const reporterIds = [
      ...new Set(issues.map((issue) => issue.reporter_id))
    ];
    const reportersRes = await pool`
     SELECT id, name, role FROM users WHERE id = ANY(${reporterIds})
 `;
    const reporterMap = new Map(reportersRes.map((r) => [r.id, r]));
    return issues.map((issue) => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: reporterMap.get(issue.reporter_id),
      created_at: issue.created_at,
      updated_at: issue.updated_at
    }));
  }
  async getSingleIssue(id) {
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
      updated_at
    };
  }
  async updateIssue(id, payload, user) {
    const issue = await pool`
        SELECT * FROM issues WHERE id=${id}
        `;
    const existingIssue = issue[0];
    if (!existingIssue) {
      throw new Error("Issue not found");
    }
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
    return res[0];
  }
  // Delete issue
  async deleteIssue(id, user) {
    if (user.role !== "maintainer") {
      throw new Error("Only maintainers can delete issues");
    }
    const result = await pool`DELETE FROM issues WHERE id = ${id}`;
    console.log(result);
  }
};
var issue_service_default = new IssueService();

// src/modules/issues/issue.controller.ts
var createIssues = async (req, res) => {
  const reporterId = req.user.id;
  const { title, description, type } = req.body;
  const issue = await issue_service_default.createIssue(
    title,
    description,
    type,
    reporterId
  );
  return sendResponse(res, {
    message: "Issue created successfully",
    ...issue ? { data: issue } : {}
  }, 201);
};
var getIssueBySort = async (req, res) => {
  const { sort = "newest", type, status } = req.query;
  if (sort && sort !== "newest" && sort !== "oldest") {
    return sendResponse(res, { message: "Invalid sort value" }, 400);
  }
  if (type && type !== "bug" && type !== "feature_request") {
    return sendResponse(res, { message: "Invalid type value" }, 400);
  }
  if (status && status !== "open" && status !== "in_progress" && status !== "resolved") {
    return sendResponse(res, { message: "Invalid status value" }, 400);
  }
  const issues = await issue_service_default.getAllIssue(
    sort,
    type,
    status
  );
  return sendResponse(res, {
    message: "Issues retrived successfully",
    data: issues
  }, 200);
};
var getSingleIssue = async (req, res) => {
  const id = req.params.id;
  const issue = await issue_service_default.getSingleIssue(parseInt(id));
  sendResponse(
    res,
    { message: "Issue retrieved successfully", data: issue },
    200
  );
};
var updateIssue = async (req, res) => {
  const issueId = req.params.id;
  const issue = await issue_service_default.updateIssue(
    parseInt(issueId),
    req.body,
    req.user
  );
  sendResponse(
    res,
    { message: "Issue updated successfully", data: issue },
    200
  );
};
var deleteIssue = async (req, res) => {
  const issueId = req.params.id;
  await issue_service_default.deleteIssue(parseInt(issueId), req.user);
  sendResponse(res, { message: "Issue deleted successfully" }, 200);
};
var issueController = {
  createIssues,
  getIssueBySort,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/middleware/auth.ts
var auth = async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return sendResponse(res, { message: "refresh token is missing", error: true }, 401);
  }
  const payload = verifyToken(token, "access");
  const user = await auth_service_default.getUserById(payload.id);
  if (!user) {
    sendResponse(res, { message: "User not found" }, 401);
  }
  req.user = user;
  next();
};
var authorizeRoles = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return sendResponse(_res, { message: "Unauthorized", error: true }, 401);
    }
    if (!roles.includes(req.user.role)) {
      return sendResponse(
        _res,
        { message: "Forbidden - you don't have permission", error: true },
        403
      );
    }
    return next();
  };
};

// src/modules/issues/issue.route.ts
var router2 = Router2();
router2.post("/", auth, issueController.createIssues);
router2.get("/", issueController.getIssueBySort);
router2.get("/:id", issueController.getSingleIssue);
router2.patch("/:id", auth, issueController.updateIssue);
router2.delete("/:id", auth, authorizeRoles("maintainer"), issueController.deleteIssue);
var issueRouter = router2;

// src/app.ts
var app = express();
app.use(logger);
app.use(express.json());
app.use(cookieParser());
app.get("/", (req, res) => {
  res.send("Hello World");
});
app.use("/api/user", authRouter);
app.use("/api/issues", issueRouter);
app.use(globalErrorHanlder);
var app_default = app;

// src/server.ts
var main = async () => {
  db_default();
  app_default.listen(config_default.port, () => {
    console.log(`Example app listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map