import { useRef, type KeyboardEvent } from "react";
import { Eye, ListTree, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type BuilderPane = "structure" | "editor" | "preview";

const PANES = [
  { id: "structure", icon: ListTree },
  { id: "editor", icon: Pencil },
  { id: "preview", icon: Eye },
] as const;

export function BuilderViewSwitcher({
  activePane,
  onPaneChange,
}: {
  activePane: BuilderPane;
  onPaneChange(pane: BuilderPane): void;
}) {
  const { t } = useTranslation();
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }

    const tabs = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>("[role=tab]") ?? [],
    );
    const currentIndex = tabs.indexOf(event.target as HTMLButtonElement);
    if (currentIndex < 0) return;

    event.preventDefault();
    const isRtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const visualStep = event.key === "ArrowRight" ? 1 : -1;
    const step = isRtl ? -visualStep : visualStep;
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : (currentIndex + step + tabs.length) % tabs.length;

    const nextTab = tabs[nextIndex];
    nextTab?.focus();
    nextTab?.click();
  };

  return (
    <div
      ref={listRef}
      className="builder-view-switcher rounded-lg border bg-card p-1 shadow-sm"
      role="tablist"
      aria-label={t("examBuilder.layout.viewLabel")}
      onKeyDown={handleKeyDown}
    >
      {PANES.map(({ id, icon: Icon }) => (
        <Button
          key={id}
          id={`builder-tab-${id}`}
          type="button"
          role="tab"
          size="sm"
          variant="ghost"
          aria-selected={activePane === id}
          aria-controls={`builder-pane-${id}`}
          tabIndex={activePane === id ? 0 : -1}
          className={cn(
            "builder-view-tab flex-1",
            activePane === id && "bg-accent text-accent-foreground",
          )}
          data-pane={id}
          onClick={() => onPaneChange(id)}
        >
          <Icon className="size-4" aria-hidden="true" />
          {t(`examBuilder.layout.${id}`)}
        </Button>
      ))}
    </div>
  );
}
