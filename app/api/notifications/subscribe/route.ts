import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveSubscription } from "@/lib/pushNotification";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await request.json();
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    await saveSubscription(subscription);
    console.log("[Push] Subscription saved:", subscription.endpoint);

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Push] Subscribe error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
