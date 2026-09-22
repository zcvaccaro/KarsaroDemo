import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  DEMO_ONBOARDING_STEPS,
  onboardingStepIndex,
  type OnboardingStep,
} from "../lib/onboarding";

export function OnboardingTour() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const steps = DEMO_ONBOARDING_STEPS;
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(true);
  const pendingHrefRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (pendingHrefRef.current) {
      const pending = pendingHrefRef.current;
      if (pathname === pending || pathname.startsWith(`${pending}/`)) {
        pendingHrefRef.current = null;
      }
      return;
    }
    const current = steps[index];
    if (
      current &&
      (pathname === current.href || pathname.startsWith(`${current.href}/`))
    ) {
      return;
    }
    const match = onboardingStepIndex(pathname, steps);
    if (match >= 0 && match !== index) setIndex(match);
  }, [pathname, open, steps, index]);

  const step: OnboardingStep | undefined = steps[index];

  useEffect(() => {
    if (!open || !step?.spotlight) {
      delete document.body.dataset.karsaroSpotlight;
      return;
    }
    document.body.dataset.karsaroSpotlight = step.spotlight;
    return () => {
      delete document.body.dataset.karsaroSpotlight;
    };
  }, [open, step?.spotlight]);

  if (!open || !step) return null;

  function finish() {
    setOpen(false);
  }

  function go(next: number) {
    const target = steps[next];
    if (!target) {
      finish();
      return;
    }
    setIndex(next);
    if (pathname !== target.href) {
      pendingHrefRef.current = target.href;
      navigate(target.href);
    }
  }

  const helpSpot = step.spotlight === "help";

  return (
    <div
      className={
        helpSpot
          ? "pointer-events-none fixed right-4 bottom-24 z-50 flex justify-end px-0 md:right-6 md:bottom-28"
          : "pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 md:bottom-8"
      }
    >
      <div className="pointer-events-auto w-full max-w-md rounded-lg border border-karsa-accent/40 bg-karsa-bg p-4 shadow-xl">
        <p className="text-[11px] tracking-[0.14em] text-karsa-faint uppercase">
          Setup {index + 1} / {steps.length}
        </p>
        <h2 className="mt-1 font-display text-xl text-karsa-text">{step.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-karsa-muted">{step.body}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={finish}
            className="mr-auto text-xs text-karsa-faint hover:text-karsa-muted"
          >
            Skip tour
          </button>
          {index > 0 ? (
            <button
              type="button"
              onClick={() => go(index - 1)}
              className="rounded-md border border-karsa-border px-3 py-1.5 text-sm text-karsa-text"
            >
              Back
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="rounded-md bg-karsa-accent px-3 py-1.5 text-sm font-medium text-karsa-bg"
          >
            {index + 1 >= steps.length ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
