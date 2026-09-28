import "server-only";
import { NextResponse } from "next/server";
import { AdminError, adminCookieName, getAdminSettings, type NewAdminSession } from "./admin-auth";
import { PricingConflictError } from "./pricing-store";

const ADMIN_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Pragma": "no-cache",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};

export function adminJson(value: unknown, status = 200): NextResponse {
  return NextResponse.json(value, { status, headers: ADMIN_HEADERS });
}

export function adminErrorResponse(error: unknown): NextResponse {
  if (error instanceof AdminError) {
    const response = adminJson({ error: error.message }, error.status);
    if (error.retryAfter) response.headers.set("Retry-After", String(error.retryAfter));
    return response;
  }
  if (error instanceof PricingConflictError) return adminJson({ error: error.message }, 409);
  // Never include database paths, SQL, tokens or stack traces in client errors.
  return adminJson({ error: "Не удалось выполнить действие. Проверьте настройки сервера и попробуйте ещё раз." }, 503);
}

/** Strict origin check applies to login/setup as well as authenticated mutations. */
export function requireAdminOrigin(request: Request): void {
  const settings = getAdminSettings();
  if (request.headers.get("origin") !== settings.origin || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new AdminError(403, "Запрос с этого адреса не разрешён.");
  }
}

export async function readAdminJson(request: Request): Promise<Record<string, unknown>> {
  requireAdminOrigin(request);
  if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
    throw new AdminError(415, "Отправьте данные в формате JSON.");
  }
  const limit = 16 * 1024;
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > limit)) throw new AdminError(413, "Слишком большой запрос.");
  if (!request.body) throw new AdminError(400, "Не переданы данные.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new AdminError(413, "Слишком большой запрос.");
      }
      chunks.push(value);
    }
    const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new Error("object expected");
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof AdminError) throw error;
    throw new AdminError(400, "Не удалось прочитать данные запроса.");
  } finally {
    reader.releaseLock();
  }
}

export function setAdminSessionCookie(response: NextResponse, session: NewAdminSession): void {
  const settings = getAdminSettings();
  response.cookies.set(adminCookieName(settings), session.token, {
    httpOnly: true, secure: settings.secure, sameSite: "strict", path: "/", expires: new Date(session.expiresAt),
  });
}

export function clearAdminSessionCookie(response: NextResponse): void {
  const settings = getAdminSettings();
  response.cookies.set(adminCookieName(settings), "", {
    httpOnly: true, secure: settings.secure, sameSite: "strict", path: "/", maxAge: 0,
  });
}
