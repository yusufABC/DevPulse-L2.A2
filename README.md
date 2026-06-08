# 🚼 DevPulse – Internal Tech Issue & Feature Tracker

A collaborative platform for software teams to report bugs, suggest features, and coordinate resolutions.

**Live URL:** `https://your-deployed-url.vercel.app` (Update after deployment)

---

## ✨ Features

- ✅ **User Authentication** - JWT-based login/signup with role-based access
- ✅ **Issue Management** - Create, read, update, delete issues (bugs & feature requests)
- ✅ **Role-Based Permissions** - Contributor and Maintainer roles with specific permissions
- ✅ **Advanced Filtering** - Filter issues by type, status, and sort by date
- ✅ **Secure API** - Password hashing with bcrypt, JWT token validation
- ✅ **PostgreSQL Database** - Relational database with automatic schema

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js (LTS 24.x+) |
| **Language** | TypeScript (latest) |
| **Framework** | Express.js |
| **Database** | PostgreSQL (Neon) |
| **Authentication** | JWT (jsonwebtoken) |
| **Security** | bcrypt |
| **Database Driver** | Neonserverless |

---

## 📦 Setup Steps

### Prerequisites
- Node.js v24 or higher
- PostgreSQL database (NeonDB, Supabase, or ElephantSQL)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/devpulse.git
cd devpulse
```

2. **Install dependencies**
```bash
npm install
```

3. **Create `.env` file**
```env
DATABASE_STRING=postgresql://user:password@host:port/dbname
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
PORT=3000
```

4. **Run development server**
```bash
npm run dev
```

5. **Build for production**
```bash
npm run build
npm start
```

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/signup` | Public | Register new user |
| POST | `/api/auth/login` | Public | User login & get JWT token |
| POST | `/api/auth/refresh` | Public | Refresh access token |

### Issues
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/issues` | Auth (Contributor, Maintainer) | Create new issue |
| GET | `/api/issues` | Public | Get all issues (with filters) |
| GET | `/api/issues/:id` | Public | Get single issue details |
| PATCH | `/api/issues/:id` | Auth (Own issue or Maintainer) | Update issue |
| DELETE | `/api/issues/:id` | Auth (Maintainer only) | Delete issue |

---

## 🗄️ Database Schema

### `users` Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(25) NOT NULL,
  email VARCHAR(75) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'contributor',
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### `issues` Table
```sql
CREATE TABLE issues (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL CHECK (LENGTH(description) >= 20),
  type VARCHAR(30) NOT NULL CHECK (type IN ('bug', 'feature_request')),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  reporter_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 🔐 User Roles & Permissions

### Contributor
- Register and log in
- Create new issues
- View all issues
- Update own issue (only if status is `open`)

### Maintainer
- All contributor permissions
- Update any issue
- Delete any issue
- Change issue workflow status independently

---

## 📋 Query Parameters

### Get All Issues Filters
```
GET /api/issues?sort=newest&type=bug&status=open
```

| Parameter | Values | Default |
|-----------|--------|---------|
| `sort` | `newest`, `oldest` | `newest` |
| `type` | `bug`, `feature_request` | (none) |
| `status` | `open`, `in_progress`, `resolved` | (none) |

---

## 🚀 Deployment

### Deploy to Vercel
1. Push to GitHub
2. Connect repo to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Deploy to Render
1. Create account on Render
2. Connect GitHub repository
3. Set environment variables
4. Deploy

---

## 📝 License

This project is part of an academic assignment. All rights reserved.

---

## 👤 Author

Created by: **[Your Name]**  
GitHub: [your-github-profile]
