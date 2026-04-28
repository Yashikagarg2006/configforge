import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SAMPLE_CONFIG } from "../lib/sample-config";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo user
  const passwordHash = await bcrypt.hash("password123", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@configforge.dev" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@configforge.dev",
      passwordHash,
    },
  });
  console.log("✅ User created:", user.email);

  // Create sample config
  const config = await prisma.appConfig.upsert({
    where: { id: "sample-config-001" },
    update: { config: SAMPLE_CONFIG as object },
    create: {
      id: "sample-config-001",
      userId: user.id,
      name: "Student Manager",
      config: SAMPLE_CONFIG as object,
    },
  });
  console.log("✅ Config created:", config.name);

  // Seed some student records
  const students = [
    { name: "Alice Johnson", email: "alice@example.com", marks: 92 },
    { name: "Bob Smith",     email: "bob@example.com",   marks: 78 },
    { name: "Clara Lee",     email: "clara@example.com", marks: 85 },
  ];

  for (const student of students) {
    await prisma.dynamicRecord.create({
      data: {
        userId: user.id,
        appConfigId: config.id,
        tableName: "students",
        data: student,
      },
    });
  }
  console.log("✅ Seeded", students.length, "student records");

  // Seed a notification
  await prisma.notification.create({
    data: { userId: user.id, type: "both", message: "Welcome to ConfigForge! Your demo app is ready." },
  });
  console.log("✅ Welcome notification created");

  console.log("\n🎉 Seed complete!");
  console.log("   Email:    demo@configforge.dev");
  console.log("   Password: password123");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
