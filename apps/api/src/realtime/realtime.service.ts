import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { eq } from "drizzle-orm";
import {
  rooms,
  type Database,
} from "@community/db";
import { DATABASE } from "../database/database.module";
import { Inject } from "@nestjs/common";

export interface IssueMeetingTokenOpts {
  userId: string;
  userName: string;
  // Exactly one of `roomId` (create session on demand) or `sessionId`
  // (session already exists) must be supplied.
  sessionId?: string;
  roomId?: string;
}

export interface IssueMeetingTokenResult {
  token: string;
  url: string;
  sessionId: string;
}

const TOKEN_TTL_SECONDS = 60 * 60; // 1 hour

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);

  constructor(@Inject(DATABASE) private readonly db: Database) {}

  isConfigured(): boolean {
    return Boolean(
      process.env.CF_REALTIMEKIT_TOKEN && process.env.CF_ACCOUNT_ID
    );
  }

  /**
   * Creates a RealtimeKit session via Cloudflare's API.
   * If `roomId` is supplied and the room already has a sessionId, returns it.
   * Otherwise creates a new session and stores the sessionId back on the room.
   */
  async createSession(opts: { roomId: string; title: string }): Promise<string> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        "RealtimeKit is not configured. Set CF_ACCOUNT_ID and CF_REALTIMEKIT_TOKEN in apps/api/.env.local"
      );
    }
    const accountId = process.env.CF_ACCOUNT_ID!;
    const token = process.env.CF_REALTIMEKIT_TOKEN!;
    // Check if room already has a session.
    const existing = await this.db
      .select()
      .from(rooms)
      .where(eq(rooms.id, opts.roomId))
      .limit(1);
    if (existing.length > 0 && existing[0].realtimeKitSessionId) {
      return existing[0].realtimeKitSessionId;
    }
    // Create new session.
    const res = await fetch(
      `https://api.realtime.cloudflare.com/v1/accounts/${accountId}/sessions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: opts.title,
          // Sessions are short-lived; the token is what grants access.
          // Sessions default to 1h max; the API rejects longer.
          max_duration_seconds: TOKEN_TTL_SECONDS,
        }),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`RealtimeKit session create failed: ${res.status} ${text}`);
      throw new ServiceUnavailableException(
        `RealtimeKit session create failed (${res.status})`
      );
    }
    const json = (await res.json()) as { id?: string; sessionId?: string };
    const sessionId = json.id ?? json.sessionId;
    if (!sessionId) {
      this.logger.error(`RealtimeKit returned no session id: ${JSON.stringify(json)}`);
      throw new ServiceUnavailableException(
        "RealtimeKit returned no session id"
      );
    }
    // Persist back to the room.
    await this.db
      .update(rooms)
      .set({ realtimeKitSessionId: sessionId, updatedAt: new Date() })
      .where(eq(rooms.id, opts.roomId));
    return sessionId;
  }

  /**
   * Issues a per-user meeting token for joining a RealtimeKit session.
   * The token grants audio/video access for the user to that session.
   */
  async issueMeetingToken(
    opts: IssueMeetingTokenOpts
  ): Promise<IssueMeetingTokenResult> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        "RealtimeKit is not configured. Set CF_ACCOUNT_ID and CF_REALTIMEKIT_TOKEN in apps/api/.env.local"
      );
    }
    const accountId = process.env.CF_ACCOUNT_ID!;
    const token = process.env.CF_REALTIMEKIT_TOKEN!;
    // Ensure a session exists.
    const sessionId = opts.roomId
      ? await this.createSession({ roomId: opts.roomId, title: opts.userName })
      : opts.sessionId;
    if (!sessionId) {
      throw new ServiceUnavailableException(
        "Cannot issue token without a session"
      );
    }
    const res = await fetch(
      `https://api.realtime.cloudflare.com/v1/accounts/${accountId}/sessions/${sessionId}/participants`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: opts.userId,
          user_name: opts.userName,
          // Time-to-live for this participant token.
          ttl_seconds: TOKEN_TTL_SECONDS,
        }),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`RealtimeKit token issue failed: ${res.status} ${text}`);
      throw new ServiceUnavailableException(
        `RealtimeKit token issue failed (${res.status})`
      );
    }
    const json = (await res.json()) as { token?: string; id?: string };
    if (!json.token) {
      throw new ServiceUnavailableException(
        "RealtimeKit returned no participant token"
      );
    }
    return {
      token: json.token,
      url: `https://app.realtime.cloudflare.com/${sessionId}?token=${json.token}`,
      sessionId,
    };
  }
}
