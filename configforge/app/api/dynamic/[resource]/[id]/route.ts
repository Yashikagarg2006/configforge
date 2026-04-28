import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeConfig, resourceExists, getAllowedActions, getNotificationConfig } from "@/lib/config-normalizer";
import { createNotification } from "@/lib/notifications";

async function getUserConfig(userId: string) {
  const appConfig = await prisma.appConfig.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } });
  if (!appConfig) return null;
  const { config } = normalizeConfig(appConfig.config);
  return { appConfig, config };
}

// PUT /api/dynamic/[resource]/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ resource: string; id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { resource, id } = await params;
  const result = await getUserConfig(session.user.id);
  if (!result) return NextResponse.json({ error: "No config found." }, { status: 404 });
  const { appConfig, config } = result;

  if (!resourceExists(config, resource)) {
    return NextResponse.json({ error: `Resource "${resource}" not found in config`, availableResources: Object.keys(config.database.tables) }, { status: 404 });
  }

  const allowed = getAllowedActions(config, resource);
  if (!allowed.includes("update")) {
    return NextResponse.json({ error: `Action "update" is not allowed for resource "${resource}"` }, { status: 405 });
  }

  const record = await prisma.dynamicRecord.findFirst({
    where: { id, userId: session.user.id, appConfigId: appConfig.id, tableName: resource },
  });
  if (!record) return NextResponse.json({ error: "Record not found" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const existing = (record.data as Record<string, unknown>) ?? {};
  const updated = { ...existing, ...(body as object) };

  const updatedRecord = await prisma.dynamicRecord.update({
    where: { id },
    data: { data: updated as any },
  });

  const notifConfig = getNotificationConfig(config, `${resource}.update`);
  if (notifConfig) await createNotification(session.user.id, notifConfig.type ?? "both", notifConfig.message);

  return NextResponse.json({ record: { id: updatedRecord.id, ...updated, updatedAt: updatedRecord.updatedAt } });
}

// DELETE /api/dynamic/[resource]/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ resource: string; id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { resource, id } = await params;
  const result = await getUserConfig(session.user.id);
  if (!result) return NextResponse.json({ error: "No config found." }, { status: 404 });
  const { appConfig, config } = result;

  if (!resourceExists(config, resource)) {
    return NextResponse.json({ error: `Resource "${resource}" not found`, availableResources: Object.keys(config.database.tables) }, { status: 404 });
  }

  const allowed = getAllowedActions(config, resource);
  if (!allowed.includes("delete")) {
    return NextResponse.json({ error: `Action "delete" is not allowed for resource "${resource}"` }, { status: 405 });
  }

  const record = await prisma.dynamicRecord.findFirst({
    where: { id, userId: session.user.id, appConfigId: appConfig.id, tableName: resource },
  });
  if (!record) return NextResponse.json({ error: "Record not found" }, { status: 404 });

  await prisma.dynamicRecord.delete({ where: { id } });

  const notifConfig = getNotificationConfig(config, `${resource}.delete`);
  if (notifConfig) await createNotification(session.user.id, notifConfig.type ?? "both", notifConfig.message);

  return NextResponse.json({ success: true });
}
