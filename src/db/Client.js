import pkg from "pg";
import {drizzle} from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {config} from "../config/env.js";
// const {Pool} = pkg ;
export const pool = new Pool ({connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
export const db = drizzle(pool);