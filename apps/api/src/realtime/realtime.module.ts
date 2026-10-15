import { Module } from "@nestjs/common";
import { RealtimeController } from "./realtime.controller";
import { RealtimeService } from "./realtime.service";
import { CommunitiesModule } from "../communities/communities.module";

@Module({
  imports: [CommunitiesModule],
  controllers: [RealtimeController],
  providers: [RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
