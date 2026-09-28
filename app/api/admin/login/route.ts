import { loginAdmin } from "@/lib/admin-auth";
import { adminErrorResponse, adminJson, readAdminJson, setAdminSessionCookie } from "@/lib/admin-http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readAdminJson(request);
    const session = await loginAdmin({ email: body.email, password: body.password, code: body.code, recovery: body.recovery });
    const response = adminJson({ ok: true });
    setAdminSessionCookie(response, session);
    return response;
  } catch (error) { return adminErrorResponse(error); }
}
