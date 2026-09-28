import { getAdminConfiguration, getAdminSession } from "@/lib/admin-auth";
import { adminErrorResponse, adminJson } from "@/lib/admin-http";
import { getPricingHistory, getPricingSnapshot } from "@/lib/pricing-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const state = getAdminConfiguration();
    if (!state.configured) return adminJson({ authenticated: false, ...state });
    const session = getAdminSession(request);
    if (!session) return adminJson({ authenticated: false, ...state });
    return adminJson({ authenticated: true, ...state, email: session.email, snapshot: getPricingSnapshot(), history: getPricingHistory() });
  } catch (error) { return adminErrorResponse(error); }
}
