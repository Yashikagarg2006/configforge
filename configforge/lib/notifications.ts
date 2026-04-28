import { prisma } from "@/lib/db";

export async function createNotification(
  userId: string,
  type: string,
  message: string
) {
  try {
    await prisma.notification.create({
      data: { userId, type, message },
    });
  } catch (err) {
    // Non-fatal — notification failure should never break the main action
    console.error("[Notification] Failed to create:", err);
  }
}

export async function getUserNotifications(userId: string, limit = 50) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, read: false } });
}
