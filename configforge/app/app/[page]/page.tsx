import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeConfig } from "@/lib/config-normalizer";
import ComponentRenderer from "@/components/renderer/ComponentRenderer";
import ConfigWarnings from "@/components/ConfigWarnings";
import { I18nProvider } from "@/contexts/I18nContext";

interface Props {
  params: Promise<{ page: string }>;
}

export default async function AppDynamicPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { page: pageSlug } = await params;
  const route = `/${pageSlug}`;

  const appConfig = await prisma.appConfig.findFirst({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  if (!appConfig) redirect("/config-editor");

  const { config, warnings } = normalizeConfig(appConfig.config);
  const pageDef = config.pages.find((p) => p.route === route || p.route === `/${pageSlug}`);

  if (!pageDef) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-5xl mb-4">🗺️</div>
        <h2 className="text-xl font-semibold text-white/80 mb-2">Page not found</h2>
        <p className="text-white/40 text-sm">No page with route <code className="bg-white/10 px-2 py-0.5 rounded">{route}</code> in your config.</p>
        <p className="text-white/30 text-xs mt-2">Available: {config.pages.map((p) => p.route).join(", ") || "none"}</p>
      </div>
    );
  }

  const pageWarnings = warnings.filter(
    (w) => w.field.includes(`pages[${config.pages.indexOf(pageDef)}]`)
  );

  return (
    <div className="max-w-4xl mx-auto page-enter">
      {pageWarnings.length > 0 && (
        <ConfigWarnings warnings={pageWarnings} title="Page Warnings" />
      )}
      {pageDef.components.map((component, idx) => (
        <ComponentRenderer
          key={idx}
          component={component}
          config={config}
          warnings={warnings}
        />
      ))}
    </div>
  );
}
