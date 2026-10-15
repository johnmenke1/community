import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { auth } from "../auth/auth.instance";

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    const headers = new Headers();
    Object.entries(req.headers).forEach(([k, v]) => {
      if (typeof v === "string") headers.set(k, v);
      else if (Array.isArray(v)) headers.set(k, v.join(", "));
    });
    const request = new Request(url, { method: req.method, headers });
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) throw new UnauthorizedException("Not authenticated");
    // Stash on request for the controller
    (req as Request & { user?: unknown; session?: unknown }).user = session.user;
    (req as Request & { user?: unknown; session?: unknown }).session = session.session;
    return true;
  }
}
