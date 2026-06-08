import { neon } from "@neondatabase/serverless";
import config from "../config/index.js";

export const pool = neon(config.database_string);

const initDb = async () => {
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

export default initDb;
