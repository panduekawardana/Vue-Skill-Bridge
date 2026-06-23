import { db } from "../config/database.js";
import { users } from "../db/schema.js";

export async function getUsers(_req, res) {
  try {
    const result = await db.select().from(users);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
