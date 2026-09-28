import { requireAdminSession, revokeAdminSession } from "@/lib/admin-auth";
import { adminErrorResponse, adminJson, clearAdminSessionCookie, readAdminJson } from "@/lib/admin-http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await readAdminJson(request);
    revokeAdminSession(requireAdminSession(request));
    const response = adminJson({ ok: true });
    clearAdminSessionCookie(response);
    return response;
  } catch (error) { return adminErrorResponse(error); }
}
