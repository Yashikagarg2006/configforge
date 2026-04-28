import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeConfig, resourceExists, getAllowedActions, getNotificationConfig } from "@/lib/config-normalizer";
import { createNotification } from "@/lib/notifications";
import { z, ZodTypeAny } from "zod";
import { FieldDef } from "@/types/config";

// Helper: build Zod schema from config fields
function buildZodSchema(fields: Record<string, FieldDef>, strict = false) {
  const shape: Record<string, ZodTypeAny> = {};
  for (const [key, def] of Object.entries(fields)) {
    let field: ZodTypeAny;
    switch (def.type) {
      case "email":   field = z.string().email(); break;
      case "number":  field = z.coerce.number(); break;
      case "boolean": field = z.coerce.boolean(); break;
      case "date":    field = z.string().datetime({ offset: true }).or(z.string().date()); break;
      default:        field = z.string();
    }
    if (!def.required) field = field.optional();
    shape[key] = field;
  }
  return strict ? z.object(shape).strict() : z.object(shape).passthrough();
}

// Get active config for user
async function getUserConfig(userId: string) {
  const appConfig = await prisma.appConfig.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  if (!appConfig) return null;
  const { config } = normalizeConfig(appConfig.config);
  return { appConfig, config };
}

// GET /api/dynamic/[resource]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { resource } = await params;
  const result = await getUserConfig(session.user.id);

  if (!result) return NextResponse.json({ error: "No config found. Please create a config first." }, { status: 404 });
  const { appConfig, config } = result;

  if (!resourceExists(config, resource)) {
    return NextResponse.json({
      error: `Resource "${resource}" not found in config`,
      availableResources: Object.keys(config.database.tables),
    }, { status: 404 });
  }

  const allowed = getAllowedActions(config, resource);
  if (!allowed.includes("read")) {
    return NextResponse.json({ error: `Action "read" is not allowed for resource "${resource}"` }, { status: 405 });
  }

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 200);
  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    prisma.dynamicRecord.findMany({
      where: { userId: session.user.id, appConfigId: appConfig.id, tableName: resource },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.dynamicRecord.count({
      where: { userId: session.user.id, appConfigId: appConfig.id, tableName: resource },
    }),
  ]);

  return NextResponse.json({ records: records.map((r) => ({ id: r.id, ...((r.data as object) ?? {}), createdAt: r.createdAt, updatedAt: r.updatedAt })), total, page, limit });
}

// POST /api/dynamic/[resource]
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { resource } = await params;
  const result = await getUserConfig(session.user.id);

  if (!result) return NextResponse.json({ error: "No config found." }, { status: 404 });
  const { appConfig, config } = result;

  if (!resourceExists(config, resource)) {
    return NextResponse.json({
      error: `Resource "${resource}" not found in config`,
      availableResources: Object.keys(config.database.tables),
    }, { status: 404 });
  }

  const allowed = getAllowedActions(config, resource);
  if (!allowed.includes("create")) {
    return NextResponse.json({ error: `Action "create" is not allowed for resource "${resource}"` }, { status: 405 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const tableDef = config.database.tables[resource];
  const schema = buildZodSchema(tableDef.fields);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const record = await prisma.dynamicRecord.create({
    data: { userId: session.user.id, appConfigId: appConfig.id, tableName: resource, data: parsed.data as any },
  });

  // Fire notification
  const notifConfig = getNotificationConfig(config, `${resource}.create`);
  if (notifConfig) {
    await createNotification(session.user.id, notifConfig.type ?? "both", notifConfig.message);
  }

  return NextResponse.json({ record: { id: record.id, ...((record.data as object) ?? {}), createdAt: record.createdAt } }, { status: 201 });
}
