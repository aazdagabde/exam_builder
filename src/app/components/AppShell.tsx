import { FileText, LayoutTemplate, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, Outlet, useMatch } from "react-router-dom";

import { LanguageSwitcher } from "@/app/components/LanguageSwitcher";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navigationItems = [
  { to: "/", labelKey: "nav.exams", icon: FileText, end: true },
  { to: "/templates", labelKey: "nav.templates", icon: LayoutTemplate },
  { to: "/settings", labelKey: "nav.settings", icon: Settings },
] as const;

export function AppShell() {
  const { t } = useTranslation();
  const isBuilder = useMatch({ path: "/exams/:id/edit", end: true }) !== null;

  return (
    <div
      className={cn(
        "min-h-screen bg-background text-foreground",
        isBuilder && "flex h-dvh min-h-0 flex-col overflow-hidden",
      )}
      data-builder-shell={isBuilder ? "true" : undefined}
      data-app-shell
    >
      <header
        className={cn("border-b bg-card", isBuilder && "shrink-0")}
        data-print-hidden
      >
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="rounded-sm text-lg font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("app.name")}
          </Link>

          <nav
            aria-label={t("app.name")}
            className="order-3 flex w-full items-center gap-1 sm:order-none sm:ms-4 sm:w-auto"
          >
            {navigationItems.map(({ to, labelKey, icon: Icon, ...item }) => (
              <NavLink
                key={to}
                to={to}
                end={"end" in item ? item.end : undefined}
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                    isActive && "bg-accent text-foreground",
                  )
                }
              >
                <Icon aria-hidden="true" className="size-4" />
                <span>{t(labelKey)}</span>
              </NavLink>
            ))}
          </nav>

          <div className="ms-auto">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main
        className={cn(
          "mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8",
          isBuilder &&
            "min-h-0 max-w-none flex-1 overflow-hidden px-3 py-3 sm:px-4 lg:px-5",
        )}
      >
        <Outlet />
      </main>

      <footer
        className={cn(
          "mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8",
          isBuilder && "hidden",
        )}
        data-print-hidden
      >
        <Separator className="mb-4" />
        <p className="text-xs text-muted-foreground">
          {t("common.foundationNotice")}
        </p>
      </footer>
    </div>
  );
}
