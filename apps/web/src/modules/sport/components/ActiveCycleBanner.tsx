import { ProgressBar, StatusBadge } from '@/components/common';
import { useActiveCycleSummary } from '@/features/sport/cycleHooks';
import { CYCLE_WEEK_TYPE_LABEL, cycleGoalLabel } from './cycleConstants';

interface ActiveCycleBannerProps {
  onOpenManager: () => void;
  onOpenDetail: (cycleId: string) => void;
}

export function ActiveCycleBanner({ onOpenManager, onOpenDetail }: ActiveCycleBannerProps) {
  const { activeCycle, weeks, currentWeek, progress, next, last, isLoading } = useActiveCycleSummary();

  if (!activeCycle) {
    return (
      <div className="sport-cycle-banner sport-cycle-banner-empty">
        <div>
          <div className="sport-cycle-banner-title">Brak aktywnego cyklu treningowego</div>
          <div className="sport-history-row-meta">Utwórz prosty plan na kilka tygodni i dodaj treningi do konkretnych dni.</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onOpenManager}>+ Zaplanuj cykl treningowy</button>
      </div>
    );
  }

  return (
    <div className="sport-cycle-banner">
      <div className="sport-cycle-banner-main">
        <div className="sport-cycle-banner-head">
          <span className="sport-cycle-banner-title">{activeCycle.name}</span>
          <span className="sport-history-row-meta">{cycleGoalLabel(activeCycle.goal)}</span>
        </div>
        {currentWeek && (
          <div className="sport-cycle-banner-week">
            Tydzień {currentWeek.week_number} z {activeCycle.duration_weeks}
            {currentWeek.week_type !== 'standard' && <StatusBadge status="active" label={CYCLE_WEEK_TYPE_LABEL[currentWeek.week_type]} />}
            {currentWeek.goal && <span className="sport-history-row-meta"> · {currentWeek.goal}</span>}
          </div>
        )}
        {!isLoading && !currentWeek && weeks && weeks.length > 0 && (
          <div className="sport-cycle-banner-week sport-history-row-meta">Cykl jeszcze się nie zaczął albo już się zakończył.</div>
        )}
        {progress && <ProgressBar value={progress.completionPercent} />}
      </div>
      <div className="sport-cycle-banner-side">
        {next && <div className="sport-history-row-meta">Najbliższy: {next.title} · {next.scheduled_date}</div>}
        {last && <div className="sport-history-row-meta">Ostatni: {last.title} · {last.scheduled_date}</div>}
        <button className="btn btn-secondary btn-sm" onClick={() => onOpenDetail(activeCycle.id)}>Zobacz cykl</button>
      </div>
    </div>
  );
}
