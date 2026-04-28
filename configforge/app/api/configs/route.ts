import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeConfig } from "@/lib/config-normalizer";
import { z } from "zod";

const configSchema = z.object({
  name: z.string().min(1, "Config name is required"),
  config: z.record(z.string(), z.unknown()),
});

// GET /api/configs — list user's configs
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configs = await prisma.appConfig.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ configs });
}

// POST /api/configs — create or update user's active config
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = configSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, config: rawConfig } = parsed.data;
    const { config, warnings } = normalizeConfig(rawConfig);

    // Upsert — one config per user (you can extend to multiple)
    const existing = await prisma.appConfig.findFirst({
      where: { userId: session.user.id, name },
    });

    let appConfig;
    if (existing) {
      appConfig = await prisma.appConfig.update({
        where: { id: existing.id },
        data: { config: config as object },
      });
    } else {
      appConfig = await prisma.appConfig.create({
        data: { userId: session.user.id, name, config: config as object },
      });
    }

    return NextResponse.json({ config: appConfig, warnings });
  } catch (err) {
    console.error("[Configs POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
