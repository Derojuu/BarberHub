import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Lazy import Prisma only at runtime
    const { default: prisma } = await import("@/lib/prisma");

    // Generate a coupon code
    const code = String(body?.code ?? `C-${Date.now().toString(36)}`);
    const data: any = { code, isUsed: false };

    if (body?.expiresAt) data.expiresAt = new Date(body.expiresAt);

    const coupon = await prisma.coupon.create({ data });

    return NextResponse.json({ coupon });
  } catch (err) {
    console.error("generate-coupon error:", err);
    return NextResponse.json({ error: "Failed to generate coupon" }, { status: 500 });
  }
}
