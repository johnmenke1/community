import { Controller, Req, Res, All, HttpException, HttpStatus } from "@nestjs/common";
import { Request, Response } from "express";
import { auth } from "./auth.instance";

@Controller("auth")
export class AuthController {
  // Catch-all for every better-auth route. The `*path` form (rather than `*`)
  // silences path-to-regexp v8's "LegacyRouteConverter" deprecation warning;
  // both forms match identically.
  @All("*path")
  async handle(@Req() req: Request, @Res() res: Response) {
    try {
      const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;

      const headers = new Headers();
      Object.entries(req.headers).forEach(([k, v]) => {
        if (typeof v === "string") headers.set(k, v);
        else if (Array.isArray(v)) headers.set(k, v.join(", "));
      });

      let body: BodyInit | undefined;
      const method = req.method.toUpperCase();
      if (method !== "GET" && method !== "HEAD") {
        if (req.body !== undefined && req.body !== null) {
          if (typeof req.body === "string") {
            body = req.body;
          } else {
            body = JSON.stringify(req.body);
          }
        }
      }

      const fetchReq = new Request(url, { method, headers, body });
      const response = await auth.handler(fetchReq);

      res.status(response.status);
      response.headers.forEach((value, key) => {
        // Strip hop-by-hop / encoding headers that the express layer handles.
        const lower = key.toLowerCase();
        if (lower === "content-encoding" || lower === "transfer-encoding") return;
        res.setHeader(key, value);
      });
      const text = await response.text();
      res.send(text);
    } catch (err) {
      const message = err instanceof Error ? err.message : "auth error";
      // eslint-disable-next-line no-console
      console.error("[auth] error:", err);
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
