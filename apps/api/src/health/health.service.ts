import { Inject, Injectable, Logger } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DATABASE } from "../database/database.module";
import type { Database } from "@community/db";

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async check() {
    try {
      await this.db.execute(sql`SELECT 1`);
      return { status: "ok", db: "ok" as const };
    } catch (err) {
      this.logger.error("DB health check failed", err);
      return { status: "ok", db: "error" as const };
    }
  }
}
