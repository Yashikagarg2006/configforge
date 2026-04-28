// GET /api/configs/[id] — fetch a single config by id
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const config = await prisma.appConfig.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!config) return NextResponse.json({ error: "Config not found" }, { status: 404 });
  return NextResponse.json({ config });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const config = await prisma.appConfig.findFirst({ where: { id, userId: session.user.id } });
  if (!config) return NextResponse.json({ error: "Config not found" }, { status: 404 });

  await prisma.appConfig.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
