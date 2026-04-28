import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeConfig } from "@/lib/config-normalizer";

export default async function AppIndexPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const appConfig = await prisma.appConfig.findFirst({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  if (!appConfig) redirect("/config-editor");

  const { config } = normalizeConfig(appConfig.config);
  const firstPage = config.pages[0];

  if (!firstPage) redirect("/config-editor");

  const slug = firstPage.route.replace(/^\//, "");
  redirect(`/app/${slug}`);
}
