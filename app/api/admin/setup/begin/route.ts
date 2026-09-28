import { beginAdminSetup } from "@/lib/admin-auth";
import { adminErrorResponse, adminJson, readAdminJson } from "@/lib/admin-http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readAdminJson(request);
    return adminJson(await beginAdminSetup({ token: body.token, password: body.password }));
  } catch (error) { return adminErrorResponse(error); }
}
