import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfISOWeek,
  endOfMonth,
  format,
  getISOWeek,
  getISOWeekYear,
  isSameMonth,
  isToday,
  startOfISOWeek,
  startOfMonth,
  subMonths,
} from "date-fns";
import { getOrCreatePage, isDatePage } from "../../domain/pages/PageRegistry";
import { getDbContext } from "../../store/dbContext";
import { useOutlinerStore } from "../../store/outlinerStore";
import { useWorkspaceStore } from "../../store/workspaceStore";

interface CalendarWidgetProps {
  compact?: boolean;
}

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function weekPageTitle(day: Date): string {
  const year = getISOWeekYear(day);
  const week = getISOWeek(day);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function CalendarWidget({ compact = false }: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const pagesList = useOutlinerStore((s) => s.pagesList);
  const navigateToPage = useOutlinerStore((s) => s.navigateToPage);
  const openPage = useWorkspaceStore((s) => s.openPage);

  const dailyPageTitles = useMemo(() => {
    const titles = new Set<string>();
    for (const page of pagesList) {
      if (isDatePage(page.content)) {
        titles.add(page.content);
      }
    }
    return titles;
  }, [pagesList]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfISOWeek(monthStart);
  const gridEnd = endOfISOWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const weeks = useMemo(() => {
    const grouped: Date[][] = [];
    for (let index = 0; index < days.length; index += 7) {
      grouped.push(days.slice(index, index + 7));
    }
    return grouped;
  }, [days]);

  const openPageByTitle = async (title: string) => {
    const db = getDbContext()?.db;
    if (!db) {
      return;
    }
    const page = await getOrCreatePage(db, title);
    await navigateToPage(title);
    openPage(page.id, page.title);
  };

  return (
    <div
      className={`flex h-full flex-col bg-surface-sidebar text-text-normal ${
        compact ? "px-2 py-2" : "px-3 py-3"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded px-1.5 py-0.5 text-sm text-text-muted hover:bg-surface-muted hover:text-text-normal"
            onClick={() => setCurrentDate((date) => subMonths(date, 1))}
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            className="text-sm font-semibold text-text-emphasis hover:text-accent"
            onClick={() => void openPageByTitle(format(currentDate, "yyyy"))}
          >
            {format(currentDate, "MMM yyyy")}
          </button>
          <button
            type="button"
            className="rounded px-1.5 py-0.5 text-sm text-text-muted hover:bg-surface-muted hover:text-text-normal"
            onClick={() => setCurrentDate((date) => addMonths(date, 1))}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
        <button
          type="button"
          className="rounded border border-border px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-text-muted hover:bg-surface-muted hover:text-text-normal"
          onClick={() => {
            const today = new Date();
            setCurrentDate(today);
            void openPageByTitle(format(today, "yyyy-MM-dd"));
          }}
        >
          Today
        </button>
      </div>

      <div className="mb-1 grid grid-cols-8 gap-0.5 text-center text-[10px] font-medium uppercase tracking-wide text-text-muted">
        <span />
        {WEEKDAY_LABELS.map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {weeks.map((week) => {
          const weekStart = week[0];
          if (!weekStart) {
            return null;
          }
          return (
            <div key={weekStart.toISOString()} className="grid grid-cols-8 gap-0.5">
              <button
                type="button"
                className="flex h-8 items-center justify-center text-xs text-text-muted hover:text-accent"
                onClick={() => void openPageByTitle(weekPageTitle(weekStart))}
              >
                {getISOWeek(weekStart)}
              </button>
              {week.map((day) => {
                const dayKey = format(day, "yyyy-MM-dd");
                const inMonth = isSameMonth(day, currentDate);
                const today = isToday(day);
                const hasPage = dailyPageTitles.has(dayKey);

                return (
                  <button
                    key={dayKey}
                    type="button"
                    onClick={() => void openPageByTitle(dayKey)}
                    className={`relative flex h-8 flex-col items-center justify-center rounded text-xs transition-colors ${
                      inMonth ? "text-text-normal" : "text-text-muted/60"
                    } ${today ? "bg-accent/15 font-semibold text-accent" : "hover:bg-surface-muted"}`}
                  >
                    <span>{format(day, "d")}</span>
                    {hasPage ? (
                      <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-accent" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
