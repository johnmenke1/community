import { eq } from "drizzle-orm";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { DATABASE } from "../database/database.module";
import { users, type Database } from "@community/db";

@Injectable()
export class UsersService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findById(id: string) {
    const rows = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    if (rows.length === 0) throw new NotFoundException("User not found");
    return rows[0];
  }

  async findByEmail(email: string) {
    const rows = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return rows[0] ?? null;
  }
}
