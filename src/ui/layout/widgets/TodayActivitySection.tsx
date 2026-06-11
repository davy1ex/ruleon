import { useEffect } from "react";
import type {
  TodayCompletedTask,
  TodayProject,
} from "../../../domain/outliner/todayActivity";
import { navigateToPageAndOpen } from "../../../store/openPageNavigation";
import { useGamificationStore } from "../../../store/gamificationStore";
import { useOutlinerStore } from "../../../store/outlinerStore";

const MAX_VISIBLE_ITEMS = 5;

function truncate(text: string, maxLength = 40): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}…`;
}

export function TodayActivitySection() {
  const todayTasks = useGamificationStore((s) => s.todayTasks);
  const todayProjects = useGamificationStore((s) => s.todayProjects);
  const loadTodayActivity = useGamificationStore((s) => s.loadTodayActivity);
  const refreshGeneration = useOutlinerStore((s) => s.refreshGeneration);

  useEffect(() => {
    void loadTodayActivity();
  }, [loadTodayActivity, refreshGeneration]);

  if (todayTasks.length === 0 && todayProjects.length === 0) {
    return null;
  }

  const visibleTasks = todayTasks.slice(0, MAX_VISIBLE_ITEMS);
  const hiddenTaskCount = todayTasks.length - visibleTasks.length;
  const visibleProjects = todayProjects.slice(0, MAX_VISIBLE_ITEMS);
  const hiddenProjectCount = todayProjects.length - visibleProjects.length;

  return (
    <div className="relative z-10 mb-6 rounded-md border border-border bg-surface-muted/50 p-3">
      {todayTasks.length > 0 ? (
        <div className="mb-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Tasks
          </p>
          <ul className="space-y-1 text-sm">
            {visibleTasks.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() =>
                    void navigateToPageAndOpen(task.pageName, {
                      rootId: task.pageRootId,
                      blockId: task.id,
                    })
                  }
                  className="relative z-10 w-full truncate rounded px-1 py-0.5 text-left text-text-normal hover:bg-surface-primary hover:text-accent"
                  title={`${task.title} · ${task.pageTitle}`}
                >
                  {truncate(task.title)}
                </button>
              </li>
            ))}
            {hiddenTaskCount > 0 ? (
              <li className="px-1 text-xs text-text-muted">+{hiddenTaskCount} more</li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {todayProjects.length > 0 ? (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Projects
          </p>
          <ul className="space-y-1 text-sm">
            {visibleProjects.map((project) => (
              <li key={project.rootId}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() =>
                    void navigateToPageAndOpen(project.pageName, {
                      rootId: project.rootId,
                    })
                  }
                  className="relative z-10 w-full truncate rounded px-1 py-0.5 text-left text-text-normal hover:bg-surface-primary hover:text-accent"
                  title={project.title}
                >
                  {truncate(project.title)}
                </button>
              </li>
            ))}
            {hiddenProjectCount > 0 ? (
              <li className="px-1 text-xs text-text-muted">
                +{hiddenProjectCount} more
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
