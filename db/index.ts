import 'dotenv/config';
import { Pool } from 'pg'; // Cambiado a 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'; // Cambiado a 'node-postgres'
import * as schema from "@shared/schema";

// Elimina la parte de neonConfig y ws ya que no las necesitas

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema }); // Cambiado para usar el Pool de pg
