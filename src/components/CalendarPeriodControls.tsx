import { KarsaSelect } from "./inputs/KarsaSelect";

export type PeriodView = "day" | "week" | "month";

const VIEW_OPTIONS = [
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
  { value: "month", label: "Month" },
];

const btn =
  "rounded-md border border-karsa-border px-3 py-1.5 text-sm text-karsa-muted hover:bg-karsa-surface";

export function CalendarPeriodControls({
  view,
  onViewChange,
  title,
  onPrev,
  onNext,
  onToday,
}: {
  view?: PeriodView;
  onViewChange?: (view: PeriodView) => void;
  title: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const showView = view != null && onViewChange != null;

  return (
    <div className="mt-6">
      {showView ? (
        <>
          <div className="md:hidden">
            <KarsaSelect
              aria-label="Calendar view"
              value={view}
              options={VIEW_OPTIONS}
              onChange={(value) => onViewChange(value as PeriodView)}
            />
          </div>
          <div className="hidden flex-wrap items-center gap-2 md:flex">
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onViewChange(opt.value as PeriodView)}
                className={`rounded-md px-3 py-1.5 text-sm capitalize ${
                  view === opt.value
                    ? "bg-karsa-accent text-karsa-bg"
                    : "border border-karsa-border text-karsa-muted hover:bg-karsa-surface"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="my-3 border-t border-karsa-border-subtle" />
        </>
      ) : (
        <div className="mb-3 border-t border-karsa-border-subtle md:hidden" />
      )}

      <div className="flex flex-wrap items-center gap-2 md:justify-start">
        <button type="button" onClick={onToday} className={btn}>
          Today
        </button>
        <button
          type="button"
          onClick={onPrev}
          className={btn}
          aria-label="Previous"
        >
          ‹
        </button>
        <p className="min-w-0 flex-1 text-center text-sm font-medium text-karsa-text md:flex-none md:text-left">
          {title}
        </p>
        <button type="button" onClick={onNext} className={btn} aria-label="Next">
          ›
        </button>
      </div>
    </div>
  );
}
