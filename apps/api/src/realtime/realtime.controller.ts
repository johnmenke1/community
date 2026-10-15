import { Controller, Get } from "@nestjs/common";
import { RealtimeService } from "./realtime.service";

@Controller("realtime")
export class RealtimeController {
  constructor(private readonly realtime: RealtimeService) {}

  @Get("health")
  health() {
    return { configured: this.realtime.isConfigured() };
  }
}
