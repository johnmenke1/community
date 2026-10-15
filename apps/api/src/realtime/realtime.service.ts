import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";

export interface IssueMeetingTokenOpts {
  userId: string;
  roomName: string;
}

export interface IssueMeetingTokenResult {
  token: string;
  url: string;
}

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);

  isConfigured(): boolean {
    return Boolean(process.env.CF_REALTIMEKIT_TOKEN);
  }

  async issueMeetingToken(_opts: IssueMeetingTokenOpts): Promise<IssueMeetingTokenResult> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        "RealtimeKit not yet configured — wire in commit 2"
      );
    }
    this.logger.warn(
      "CF_REALTIMEKIT_TOKEN is set but no real wiring exists yet; this is a stub (commit 2)."
    );
    // Stub return — never reached in commit 1, but keeps the contract.
    void _opts;
    return { token: "stub", url: "stub" };
  }
}
