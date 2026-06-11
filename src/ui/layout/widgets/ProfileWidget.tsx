import { calculateLevelInfo } from "../../../features/gamification/levelMath";
import { useGamificationStore } from "../../../store/gamificationStore";
import { RewardsSection } from "./RewardsSection";
import { TodayActivitySection } from "./TodayActivitySection";

interface ProfileWidgetProps {
  compact?: boolean;
}

export function ProfileWidget({ compact = false }: ProfileWidgetProps) {
  const totalXp = useGamificationStore((s) => s.totalXp);
  const todayCompleted = useGamificationStore((s) => s.todayCompleted);
  const todayXpEarned = useGamificationStore((s) => s.todayXpEarned);
  const { currentLevel, currentLevelXp, xpPerLevel, progressPercent } =
    calculateLevelInfo(totalXp);

  return (
    <div className={`flex h-full flex-col ${compact ? "px-2 py-2" : "px-3 py-2"}`}>
      <h3 className="mb-6 text-xs font-bold uppercase text-text-muted">Profile</h3>

      <div className="mb-2 flex items-end justify-between">
        <div className="text-2xl font-bold text-text-normal">
          Level {currentLevel}
        </div>
        <div className="mb-1 font-mono text-xs text-text-muted">
          {totalXp.toLocaleString()} Total XP
        </div>
      </div>

      <div className="mb-2 h-3 w-full overflow-hidden rounded-full border border-border bg-surface-muted">
        <div
          className="h-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="mb-6 text-right text-xs text-text-muted">
        {currentLevelXp} / {xpPerLevel} XP
      </div>

      <div className="rounded-md border border-border bg-surface-muted/50 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Today
        </p>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-text-muted">Completed</dt>
            <dd className="font-medium text-text-normal">{todayCompleted}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">XP earned</dt>
            <dd className="font-medium text-text-normal">{todayXpEarned}</dd>
          </div>
        </dl>
      </div>

      <TodayActivitySection />

      <div className="border-t border-border pt-4">
        <RewardsSection />
      </div>
    </div>
  );
}
