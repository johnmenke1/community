import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { CommunitiesModule } from "./communities/communities.module";
import { PostsModule } from "./posts/posts.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { CoursesModule } from "./courses/courses.module";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    CommunitiesModule,
    PostsModule,
    RealtimeModule,
    CoursesModule,
    HealthModule,
  ],
})
export class AppModule {}
