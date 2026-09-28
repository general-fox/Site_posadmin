import { finishAdminSetup } from "@/lib/admin-auth";
import { adminErrorResponse, adminJson, readAdminJson, setAdminSessionCookie } from "@/lib/admin-http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readAdminJson(request);
    const result = finishAdminSetup({ token: body.token, setupId: body.setupId, code: body.code });
    const response = adminJson({ ok: true, recoveryCodes: result.recoveryCodes });
    setAdminSessionCookie(response, result.session);
    return response;
  } catch (error) { return adminErrorResponse(error); }
}
