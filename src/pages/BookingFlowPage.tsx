import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  bookingConfirmationHtml,
  confirmationPageTitle,
  defaultFlowSteps,
  formConfirmationHtml,
  resetBookingFlowToDefault,
  setBookingFlow,
  uid,
  type FlowStep,
} from "../lib/store";
import { useIsMobile } from "../lib/use-is-mobile";
import { useDemoStore } from "../lib/use-demo-store";

const CARD_W = 176;
const GAP_W = 24;
const TRACK_PAD_X = 120;

type AddSelection = { formId: string } | null;

function stepTitle(step: FlowStep, previous?: FlowStep | null): string {
  if (step.stepType === "schedule" || step.stepType === "contact") {
    return "Booking form";
  }
  if (step.stepType === "form") {
    return step.formName?.trim() || "Form";
  }
  if (previous?.stepType === "schedule" || previous?.stepType === "contact") {
    return "Booking confirmation";
  }
  if (previous?.stepType === "form") {
    return confirmationPageTitle(previous.formName ?? "Form");
  }
  const heading = step.confirmationHtml?.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  if (heading?.[1]) {
    return heading[1].replace(/<[^>]+>/g, "").trim() || "Confirmation";
  }
  return "Confirmation";
}

function makeConfirmationStep(
  formId: string | null,
  formName: string | null,
  html: string,
): FlowStep {
  return {
    id: uid("fs"),
    stepType: "confirmation",
    formId,
    formName,
    confirmationHtml: html,
  };
}

function makeFormStep(form: { id: string; name: string }): FlowStep {
  return {
    id: uid("fs"),
    stepType: "form",
    formId: form.id,
    formName: form.name,
    confirmationHtml: null,
  };
}

function toVisualSteps(steps: FlowStep[]): {
  visual: FlowStep[];
  bookingSpan: number;
} {
  if (steps[0]?.stepType === "schedule" && steps[1]?.stepType === "contact") {
    return {
      visual: [
        {
          ...steps[0],
          id: "booking-visual",
          formName: "Booking form",
        },
        ...steps.slice(2),
      ],
      bookingSpan: 2,
    };
  }
  if (steps[0]?.stepType === "schedule") {
    return {
      visual: [
        {
          ...steps[0],
          id: "booking-visual",
          formName: "Booking form",
        },
        ...steps.slice(1),
      ],
      bookingSpan: 1,
    };
  }
  return { visual: steps, bookingSpan: 0 };
}

function markerVisualToStepOrder(visualIdx: number, bookingSpan: number) {
  if (bookingSpan <= 0) return visualIdx;
  if (visualIdx === 0) return bookingSpan - 1;
  return bookingSpan + (visualIdx - 1);
}

function visualIndexToStepOrder(visualIdx: number, bookingSpan: number) {
  return markerVisualToStepOrder(visualIdx, bookingSpan);
}

function bookingBlockEndIndex(steps: FlowStep[]): number {
  if (steps[0]?.stepType !== "schedule") return -1;
  return steps[1]?.stepType === "contact" ? 1 : 0;
}

function isBookingConfirmationStep(steps: FlowStep[], stepOrder: number) {
  const step = steps[stepOrder];
  if (!step || step.stepType !== "confirmation") return false;
  const bookingEnd = bookingBlockEndIndex(steps);
  if (bookingEnd >= 0 && stepOrder === bookingEnd + 1) return true;
  const html = step.confirmationHtml ?? "";
  return (
    html === bookingConfirmationHtml() ||
    /<h2[^>]*>\s*Booking confirmation\s*<\/h2>/i.test(html)
  );
}

function isLockedVisualStep(
  steps: FlowStep[],
  visualIdx: number,
  bookingSpan: number,
) {
  if (visualIdx === 0 && bookingSpan > 0) return true;
  const stepOrder = visualIndexToStepOrder(visualIdx, bookingSpan);
  return isBookingConfirmationStep(steps, stepOrder);
}

function isMarkerEligibleStep(
  step: FlowStep,
  visualIdx: number,
  bookingSpan: number,
) {
  if (visualIdx === 0 && bookingSpan > 0) return true;
  return step.stepType === "form";
}

function normalizeAppointmentAfter(steps: FlowStep[], after: number) {
  const step = steps[after];
  if (!step || step.stepType === "confirmation") {
    for (let i = Math.min(after, steps.length - 1); i >= 0; i--) {
      const candidate = steps[i];
      if (
        candidate?.stepType === "form" ||
        candidate?.stepType === "schedule" ||
        candidate?.stepType === "contact"
      ) {
        return i;
      }
    }
    return 0;
  }
  return after;
}

function StepPreview({ step }: { step: FlowStep }) {
  const isBooking =
    step.stepType === "schedule" || step.stepType === "contact";
  const isForm = step.stepType === "form";
  const isConfirm = step.stepType === "confirmation";

  return (
    <div className="relative h-36 w-full overflow-hidden rounded-md border border-karsa-border bg-[#f7f3ec] p-2.5 shadow-sm">
      <div className="mb-2 h-1.5 w-10 rounded-full bg-stone-300/80" />
      {isBooking ? (
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <div className="h-5 rounded border border-stone-300/80 bg-white/70" />
            <div className="h-5 rounded border border-stone-300/80 bg-white/70" />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="h-5 rounded border border-stone-300/80 bg-white/70" />
            <div className="h-5 rounded border border-stone-300/80 bg-white/70" />
          </div>
          <div className="mt-2 h-4 w-16 rounded bg-stone-800/80" />
        </div>
      ) : null}
      {isForm ? (
        <div className="space-y-1.5">
          <div className="h-2 w-[66%] rounded bg-stone-400/50" />
          <div className="h-4 rounded border border-stone-300/80 bg-white/70" />
          <div className="h-4 rounded border border-stone-300/80 bg-white/70" />
          <div className="h-4 w-[80%] rounded border border-stone-300/80 bg-white/70" />
          <div className="mt-1 h-4 w-14 rounded bg-stone-800/70" />
        </div>
      ) : null}
      {isConfirm ? (
        <div className="flex h-[calc(100%-0.75rem)] flex-col justify-between">
          <div className="space-y-1.5">
            <div className="h-2 w-3/4 rounded bg-stone-400/60" />
            <div className="h-2 w-1/2 rounded bg-stone-300/70" />
            <div
              className="mt-2 line-clamp-3 text-[9px] leading-snug text-stone-500 [&_h2]:m-0 [&_h2]:text-[10px] [&_h2]:font-semibold [&_p]:m-0"
              dangerouslySetInnerHTML={{
                __html: step.confirmationHtml || "<p>Confirmation</p>",
              }}
            />
          </div>
          <div className="h-4 w-20 rounded bg-stone-800/75" />
        </div>
      ) : null}
    </div>
  );
}

function BookingFlowTestModal({
  steps,
  onClose,
}: {
  steps: FlowStep[];
  onClose: () => void;
}) {
  const { services, employees, forms } = useDemoStore();
  const [sessionKey, setSessionKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [i, setI] = useState(0);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const walkSteps = useMemo(() => {
    // Collapse schedule+contact into one "booking form" walk page
    const out: { kind: string; label: string; formId?: string | null; html?: string | null }[] =
      [];
    let skipContact = false;
    for (const s of steps) {
      if (s.stepType === "schedule") {
        out.push({ kind: "booking", label: "Booking form" });
        skipContact = true;
        continue;
      }
      if (s.stepType === "contact" && skipContact) {
        skipContact = false;
        continue;
      }
      if (s.stepType === "form") {
        out.push({
          kind: "form",
          label: s.formName ?? "Form",
          formId: s.formId,
        });
        continue;
      }
      if (s.stepType === "confirmation") {
        out.push({
          kind: "confirmation",
          label: stepTitle(s),
          html: s.confirmationHtml,
          formId: s.formId,
        });
      }
    }
    return out;
  }, [steps]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    setI(0);
    setName("");
    setEmail("");
  }, [sessionKey]);

  if (!mounted) return null;

  const step = walkSteps[i];
  const form = step?.formId
    ? forms.find((f) => f.id === step.formId)
    : null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 p-4 py-8">
      <div
        className="absolute inset-0"
        onClick={onClose}
        role="presentation"
      />
      <div
        className="relative z-10 w-full max-w-xl rounded-lg border border-stone-200 bg-white shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-flow-test-title"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-stone-200 bg-white/95 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-xs font-medium tracking-[0.16em] text-stone-500 uppercase">
              Booking flow
            </p>
            <h2
              id="booking-flow-test-title"
              className="mt-1 font-display text-2xl text-stone-900"
            >
              Test out your flow
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Same screens as Book Now. No appointments or form answers are
              saved.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setSessionKey((k) => k + 1)}
              className="rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-800"
            >
              Restart
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white"
            >
              Close
            </button>
          </div>
        </div>

        <div className="bg-[#faf8f5] px-5 py-6 text-stone-900" key={sessionKey}>
          {!step ? (
            <p className="py-6 text-center text-sm text-stone-600">
              Preview complete. Close or restart.
            </p>
          ) : (
            <>
              <p className="text-xs text-stone-500">
                Step {i + 1} of {walkSteps.length}
              </p>
              <h3 className="mt-1 font-display text-xl">{step.label}</h3>

              {step.kind === "booking" ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs font-medium text-stone-500 uppercase">
                      Service
                    </p>
                    <div className="mt-2 space-y-2">
                      {services.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setServiceId(s.id)}
                          className={`block w-full rounded-md border px-3 py-2.5 text-left text-sm ${
                            serviceId === s.id
                              ? "border-stone-900 bg-stone-900 text-white"
                              : "border-stone-300 bg-white"
                          }`}
                        >
                          {s.name} · {s.durationMin}m · ${s.price}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-stone-500 uppercase">
                      Practitioner
                    </p>
                    <div className="mt-2 space-y-2">
                      {employees.map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => setEmployeeId(e.id)}
                          className={`block w-full rounded-md border px-3 py-2.5 text-left text-sm ${
                            employeeId === e.id
                              ? "border-stone-900 bg-stone-900 text-white"
                              : "border-stone-300 bg-white"
                          }`}
                        >
                          {e.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-stone-500 uppercase">
                      Date &amp; time
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {[
                        "9:00 AM",
                        "10:30 AM",
                        "1:00 PM",
                        "2:30 PM",
                        "4:00 PM",
                      ].map((t) => (
                        <button
                          key={t}
                          type="button"
                          className="rounded-md border border-stone-300 bg-white px-2 py-2 text-sm hover:border-stone-900"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm text-stone-700">
                      Your name
                      <input
                        className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="First and last"
                      />
                    </label>
                    <label className="block text-sm text-stone-700">
                      Email
                      <input
                        className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                      />
                    </label>
                  </div>
                </div>
              ) : step.kind === "form" ? (
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-stone-600">
                    Sample Studio · {form?.name ?? step.label}
                  </p>
                  {(form?.sections.filter((s) => s.enabled) ?? []).map((s) => (
                    <fieldset
                      key={s.id}
                      className="border-t border-stone-200 pt-3"
                    >
                      <legend className="text-sm font-semibold text-stone-800">
                        {s.label}
                      </legend>
                      <input
                        className="mt-2 h-9 w-full rounded border border-stone-300 bg-white px-2 text-sm"
                        placeholder="Sample answer…"
                      />
                    </fieldset>
                  ))}
                  {!form ? (
                    <p className="text-sm text-stone-600">
                      Form fields would appear here.
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-stone-700">
                  <div
                    className="[&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-stone-900 [&_p]:mt-2"
                    dangerouslySetInnerHTML={{
                      __html: (step.html ?? "<p>You're all set.</p>")
                        .replace(/\{\{first_name\}\}/g, name.split(" ")[0] || "there")
                        .replace(
                          /\{\{date\}\}/g,
                          new Date().toLocaleDateString(),
                        )
                        .replace(/\{\{time\}\}/g, "2:00 PM"),
                    }}
                  />
                  <p className="text-stone-500">
                    {services.find((s) => s.id === serviceId)?.name ??
                      "Appointment"}{" "}
                    with{" "}
                    {employees.find((e) => e.id === employeeId)?.name ??
                      "your practitioner"}
                    .
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-between gap-2 border-t border-stone-200 bg-white px-5 py-3">
          <button
            type="button"
            disabled={i === 0}
            onClick={() => setI((x) => Math.max(0, x - 1))}
            className="rounded-md border border-stone-300 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              if (i >= walkSteps.length - 1) onClose();
              else setI((x) => x + 1);
            }}
            className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            {i >= walkSteps.length - 1 ? "Done" : "Continue"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function BookingFlowPage() {
  const isMobile = useIsMobile();
  const { flowSteps, forms, appointmentCreatedAfterStepOrder } = useDemoStore();
  const [steps, setSteps] = useState(flowSteps);
  const [appointmentAfter, setAppointmentAfter] = useState(
    appointmentCreatedAfterStepOrder,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addSelection, setAddSelection] = useState<AddSelection>(null);
  const [resetMessage, setResetMessage] = useState("");
  const [testOpen, setTestOpen] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState<number | null>(null);
  const grabOffsetXRef = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSteps(flowSteps);
    setAppointmentAfter(appointmentCreatedAfterStepOrder);
  }, [flowSteps, appointmentCreatedAfterStepOrder]);

  const clientForms = useMemo(
    () =>
      forms.filter(
        (f) =>
          !f.isDraft &&
          f.audience === "client" &&
          f.templateKey !== "booking" &&
          f.templateKey !== "waitlist" &&
          f.showInCalendarDescription === true,
      ),
    [forms],
  );

  const { visual, bookingSpan } = useMemo(() => toVisualSteps(steps), [steps]);

  const markerSlots = useMemo(
    () =>
      visual
        .map((step, visualIdx) => ({
          step,
          visualIdx,
          stepOrder: markerVisualToStepOrder(visualIdx, bookingSpan),
        }))
        .filter(({ step, visualIdx }) =>
          isMarkerEligibleStep(step, visualIdx, bookingSpan),
        ),
    [visual, bookingSpan],
  );

  const markerSlotCount = markerSlots.length;

  const markerSlotIdx = useMemo(() => {
    const exact = markerSlots.findIndex((s) => s.stepOrder === appointmentAfter);
    if (exact >= 0) return exact;
    let best = 0;
    for (let i = 0; i < markerSlots.length; i++) {
      if (markerSlots[i]!.stepOrder <= appointmentAfter) best = i;
    }
    return best;
  }, [markerSlots, appointmentAfter]);

  const formsAlreadyInFlow = useMemo(
    () =>
      new Set(
        steps
          .filter((s) => s.stepType === "form" && s.formId)
          .map((s) => s.formId!),
      ),
    [steps],
  );

  const selectedStep = steps.find((s) => s.id === selectedId) ?? null;
  const selectedIsConfirmation = selectedStep?.stepType === "confirmation";
  const selectedIsBookingConfirmation =
    selectedStep?.stepType === "confirmation" &&
    isBookingConfirmationStep(
      steps,
      steps.findIndex((s) => s.id === selectedStep.id),
    );
  const selectedPairedFormId =
    selectedStep?.stepType === "confirmation" && !selectedIsBookingConfirmation
      ? selectedStep.formId
      : null;

  function slotCenterX(slotIdx: number) {
    const visualIdx = markerSlots[slotIdx]?.visualIdx ?? 0;
    return visualIdx * (CARD_W + GAP_W) + CARD_W / 2;
  }

  function nearestSlotFromTrackX(x: number) {
    if (markerSlotCount === 0) return 0;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < markerSlotCount; i++) {
      const d = Math.abs(slotCenterX(i) - x);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }

  function nearestSlotFromClientX(clientX: number) {
    const track = trackRef.current;
    if (!track || markerSlotCount === 0) return 0;
    const x = clientX - track.getBoundingClientRect().left;
    return nearestSlotFromTrackX(x);
  }

  function setMarkerFromSlot(slotIdx: number) {
    const slot = markerSlots[slotIdx];
    if (slot) setAppointmentAfter(slot.stepOrder);
  }

  function onTrackPointerDown(e: ReactPointerEvent, fromSlot?: number) {
    if (isMobile) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragging(true);
    const slot = fromSlot ?? nearestSlotFromClientX(e.clientX);
    setMarkerFromSlot(slot);
    const track = trackRef.current;
    if (track) {
      const pointerX = e.clientX - track.getBoundingClientRect().left;
      const originX = slotCenterX(slot);
      grabOffsetXRef.current = pointerX - originX;
      setDragX(originX);
    }
  }

  function onTrackPointerMove(e: ReactPointerEvent) {
    if (!dragging) return;
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const minX = slotCenterX(0);
    const maxX = slotCenterX(Math.max(0, markerSlotCount - 1));
    const pointerX = e.clientX - rect.left;
    const x = Math.min(
      maxX,
      Math.max(minX, pointerX - grabOffsetXRef.current),
    );
    setDragX(x);
    setMarkerFromSlot(nearestSlotFromTrackX(x));
  }

  function onTrackPointerUp() {
    setDragging(false);
    setDragX(null);
    grabOffsetXRef.current = 0;
  }

  useEffect(() => {
    if (!dragging) return;
    function onUp() {
      setDragging(false);
      setDragX(null);
      grabOffsetXRef.current = 0;
    }
    window.addEventListener("pointerup", onUp);
    return () => window.removeEventListener("pointerup", onUp);
  }, [dragging]);

  useEffect(() => {
    const normalized = normalizeAppointmentAfter(steps, appointmentAfter);
    if (normalized !== appointmentAfter) setAppointmentAfter(normalized);
  }, [steps, appointmentAfter]);

  function appendFormWithConfirmation(form: {
    id: string;
    name: string;
  }) {
    setSteps((prev) => {
      if (prev.some((s) => s.stepType === "form" && s.formId === form.id)) {
        return prev;
      }
      return [
        ...prev,
        makeFormStep(form),
        makeConfirmationStep(
          form.id,
          form.name,
          formConfirmationHtml(form.name),
        ),
      ];
    });
  }

  function addFromSelector() {
    if (!addSelection) return;
    const form = clientForms.find((f) => f.id === addSelection.formId);
    if (!form) return;
    appendFormWithConfirmation(form);
    setAddSelection(null);
  }

  function removeVisualAt(visualIdx: number) {
    if (isLockedVisualStep(steps, visualIdx, bookingSpan)) return;
    const stepOrder = visualIndexToStepOrder(visualIdx, bookingSpan);
    const target = steps[stepOrder];
    if (!target) return;
    if (target.stepType === "schedule" || target.stepType === "contact") return;
    if (isBookingConfirmationStep(steps, stepOrder)) return;

    setSteps((prev) => {
      let next = prev.filter((_, i) => i !== stepOrder);
      if (
        target.stepType === "form" &&
        next[stepOrder]?.stepType === "confirmation" &&
        !isBookingConfirmationStep(prev, stepOrder + 1)
      ) {
        next = next.filter((_, i) => i !== stepOrder);
      }
      return next;
    });

    setAppointmentAfter((after) =>
      Math.min(after, Math.max(0, steps.length - 2)),
    );
    if (selectedId === target.id) setSelectedId(null);
  }

  function onResetToDefault() {
    resetBookingFlowToDefault();
    setSteps(defaultFlowSteps());
    setAppointmentAfter(1);
    setSelectedId(null);
    setAddSelection(null);
    setResetMessage("Booking flow reset to default.");
    window.setTimeout(() => setResetMessage(""), 3500);
  }

  function onSave() {
    setBookingFlow(steps, appointmentAfter);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  }

  const trackWidth =
    visual.length === 0
      ? CARD_W
      : visual.length * CARD_W + Math.max(0, visual.length - 1) * GAP_W;

  const activeDotX =
    dragging && dragX != null ? dragX : slotCenterX(markerSlotIdx);

  return (
    <div className="mx-auto max-w-7xl">
      <p className="text-xs font-medium tracking-[0.16em] text-karsa-faint uppercase">
        Settings · Booking
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-karsa-text">
        Booking flow
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-karsa-muted">
        Build the step-by-step path clients and staff follow when booking.
        Add forms in order, then choose when the appointment is actually
        created. Those forms come from Forms, and the thank-you messages come
        from Confirmations.
      </p>

      <div className="mt-8 space-y-8">
        <div className="space-y-3 border border-karsa-border-subtle bg-karsa-bg-elevated p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <p className="text-xs font-medium tracking-[0.12em] text-karsa-faint uppercase">
                Add a form
              </p>
              <p className="mt-1 text-xs text-karsa-faint">
                Adds the form plus its paired confirmation page. Edit confirmation
                copy under Forms → Confirmations.
              </p>
            </div>
            <button
              type="button"
              disabled={!addSelection}
              onClick={addFromSelector}
              className="rounded-md bg-karsa-accent px-4 py-2 text-sm font-medium text-karsa-bg disabled:opacity-50"
            >
              Add to flow
            </button>
            <button
              type="button"
              onClick={() => setTestOpen(true)}
              className="rounded-md border border-karsa-border bg-karsa-surface px-4 py-2 text-sm font-medium text-karsa-text transition-colors hover:bg-karsa-surface-hover"
            >
              Test out your flow
            </button>
            <button
              type="button"
              onClick={onResetToDefault}
              className="rounded-md border border-karsa-border bg-karsa-surface px-4 py-2 text-sm font-medium text-karsa-text transition-colors hover:bg-karsa-surface-hover"
            >
              Reset to default
            </button>
          </div>

          {clientForms.length === 0 ? (
            <p className="text-sm text-karsa-faint">
              No appointment-linked client forms yet. On Forms, set a client form
              to “Link to appointment” to make it available here.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {clientForms.map((form) => {
                const inFlow = formsAlreadyInFlow.has(form.id);
                const selected = addSelection?.formId === form.id;
                return (
                  <button
                    key={form.id}
                    type="button"
                    disabled={inFlow}
                    onClick={() => setAddSelection({ formId: form.id })}
                    className={[
                      "rounded-md border px-3 py-2.5 text-left text-sm transition-colors",
                      inFlow
                        ? "cursor-not-allowed border-karsa-border-subtle text-karsa-faint opacity-60"
                        : selected
                          ? "border-karsa-accent bg-karsa-accent-soft text-karsa-text"
                          : "border-karsa-border bg-karsa-bg text-karsa-text hover:border-karsa-accent hover:bg-karsa-accent-soft",
                    ].join(" ")}
                    title={
                      inFlow
                        ? "Already in this flow"
                        : `Add ${form.name} with confirmation`
                    }
                  >
                    <span className="block truncate font-medium">
                      {form.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-karsa-faint">
                      + {confirmationPageTitle(form.name)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <p className="text-xs text-karsa-faint">
            Booking form and its confirmation stay in the flow. Test uses your
            current chart (including unsaved changes) without creating
            appointments. Reset restores the default template.
          </p>
          {resetMessage ? (
            <p className="text-sm text-karsa-accent-strong">{resetMessage}</p>
          ) : null}
        </div>

        {testOpen ? (
          <BookingFlowTestModal
            steps={steps}
            onClose={() => setTestOpen(false)}
          />
        ) : null}

        <div className="karsa-h-scroll pt-3 pb-4">
          <div
            className="flex justify-center pt-1 pb-4"
            style={{
              width: `max(100%, ${trackWidth + TRACK_PAD_X * 2}px)`,
              paddingLeft: TRACK_PAD_X,
              paddingRight: TRACK_PAD_X,
            }}
          >
            <div style={{ width: trackWidth }}>
              <div className="flex gap-6" style={{ width: trackWidth }}>
                {visual.map((step, visualIdx) => {
                  const locked = isLockedVisualStep(
                    steps,
                    visualIdx,
                    bookingSpan,
                  );
                  const isBookingCard = visualIdx === 0 && bookingSpan > 0;
                  const isSelected = selectedId === step.id;
                  const afterCreate =
                    markerVisualToStepOrder(visualIdx, bookingSpan) >
                    appointmentAfter;
                  const previous =
                    visualIdx > 0 ? visual[visualIdx - 1] : null;

                  return (
                    <div
                      key={`${step.id}-${visualIdx}`}
                      className="flex shrink-0 flex-col items-center"
                      style={{ width: CARD_W }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (isBookingCard) {
                            setSelectedId(null);
                            return;
                          }
                          setSelectedId(step.id);
                        }}
                        className={[
                          "w-full text-left transition",
                          isSelected
                            ? "ring-2 ring-karsa-accent ring-offset-2 ring-offset-karsa-bg"
                            : "hover:opacity-95",
                          afterCreate ? "opacity-75" : "",
                        ].join(" ")}
                      >
                        <StepPreview step={step} />
                        <p className="mt-2 text-center text-sm font-medium text-karsa-text">
                          {stepTitle(step, previous)}
                        </p>
                        <p className="text-center text-[11px] text-karsa-faint">
                          {locked
                            ? "Required · Book Now"
                            : afterCreate
                              ? "Optional push"
                              : step.stepType === "confirmation"
                                ? "Confirmation"
                                : "Form"}
                        </p>
                      </button>
                      {!locked ? (
                        <button
                          type="button"
                          onClick={() => removeVisualAt(visualIdx)}
                          className="mt-1 text-[11px] text-karsa-muted underline-offset-2 hover:text-karsa-danger hover:underline"
                        >
                          Remove
                        </button>
                      ) : (
                        <span className="mt-1 h-4" />
                      )}
                    </div>
                  );
                })}
              </div>

              <div
                ref={trackRef}
                className="relative mt-3 select-none"
                style={{ width: trackWidth, height: 16, marginBottom: 140 }}
                onPointerDown={(e) => onTrackPointerDown(e)}
                onPointerMove={onTrackPointerMove}
                onPointerUp={onTrackPointerUp}
              >
                {markerSlotCount > 1 ? (
                  <div
                    className="pointer-events-none absolute top-1/2 h-0.5 -translate-y-1/2 bg-karsa-border"
                    style={{
                      left: slotCenterX(0),
                      width: slotCenterX(markerSlotCount - 1) - slotCenterX(0),
                    }}
                  />
                ) : null}

                {markerSlots.map((slot, slotIdx) => (
                  <button
                    key={`slot-${slot.step.id}-${slot.visualIdx}`}
                    type="button"
                    aria-label={`Appointment created when ${stepTitle(slot.step, slot.visualIdx > 0 ? visual[slot.visualIdx - 1] : null)} is completed`}
                    className="absolute top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-karsa-accent bg-karsa-bg transition hover:bg-karsa-accent-soft"
                    style={{ left: slotCenterX(slotIdx) }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMarkerFromSlot(slotIdx);
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      if (isMobile) {
                        setMarkerFromSlot(slotIdx);
                        return;
                      }
                      onTrackPointerDown(e, slotIdx);
                    }}
                  />
                ))}

                {markerSlotCount > 0 ? (
                  <div
                    className="absolute top-1/2 z-20"
                    style={{ left: activeDotX }}
                  >
                    <div
                      className={[
                        "absolute top-0 left-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-karsa-accent bg-karsa-accent",
                        isMobile
                          ? ""
                          : dragging
                            ? "cursor-grabbing"
                            : "cursor-grab",
                      ].join(" ")}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        onTrackPointerDown(e, markerSlotIdx);
                      }}
                    />
                    <div className="absolute top-2 left-0 flex -translate-x-1/2 flex-col items-center">
                      <div className="h-8 w-px bg-karsa-accent" />
                      <div
                        className={[
                          "w-40 rounded-md border border-karsa-accent bg-karsa-accent-soft px-3 py-2.5 text-center shadow-sm md:w-48",
                          isMobile
                            ? ""
                            : dragging
                              ? "cursor-grabbing"
                              : "cursor-grab",
                        ].join(" ")}
                        onPointerDown={(e) => {
                          if (isMobile) return;
                          e.stopPropagation();
                          onTrackPointerDown(e, markerSlotIdx);
                        }}
                      >
                        <p className="text-[11px] font-medium tracking-wide text-karsa-accent-strong uppercase">
                          Appointment created
                        </p>
                        <p className="mt-1 text-xs leading-snug text-karsa-muted">
                          Created when the step above is completed
                        </p>
                        {isMobile ? (
                          <div className="mt-2 flex items-center justify-center gap-2">
                            <button
                              type="button"
                              aria-label="Move earlier"
                              disabled={markerSlotIdx <= 0}
                              onClick={() =>
                                setMarkerFromSlot(markerSlotIdx - 1)
                              }
                              className="rounded-md border border-karsa-accent/40 px-2 py-1 text-sm text-karsa-accent-strong disabled:opacity-30"
                            >
                              ‹
                            </button>
                            <button
                              type="button"
                              aria-label="Move later"
                              disabled={markerSlotIdx >= markerSlotCount - 1}
                              onClick={() =>
                                setMarkerFromSlot(markerSlotIdx + 1)
                              }
                              className="rounded-md border border-karsa-accent/40 px-2 py-1 text-sm text-karsa-accent-strong disabled:opacity-30"
                            >
                              ›
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-karsa-muted">
          The filled circle marks where the appointment is created when that step
          finishes. It can only be placed under the booking form or a form step —
          not under confirmation pages. Steps to the right are optional follow-ups
          you can still push clients toward.
        </p>

        {selectedIsConfirmation && selectedStep ? (
          <div className="border border-karsa-border-subtle bg-karsa-bg-elevated p-5">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-xl text-karsa-text">
                {selectedIsBookingConfirmation
                  ? "Booking confirmation"
                  : confirmationPageTitle(selectedStep.formName ?? "Form")}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="text-sm text-karsa-muted hover:text-karsa-text"
              >
                Close
              </button>
            </div>
            {selectedIsBookingConfirmation ? (
              <p className="mt-3 text-sm text-karsa-muted">
                Required Book Now confirmation. It stays in the flow and cannot be
                removed. Button label is Close unless another form follows in the
                chart.
              </p>
            ) : selectedPairedFormId ? (
              <p className="mt-3 text-sm text-karsa-muted">
                Confirmation copy is edited under{" "}
                <Link
                  to="/dashboard/forms/confirmations"
                  className="font-medium text-karsa-accent-strong underline-offset-4 hover:underline"
                >
                  Forms → Confirmations
                </Link>
                . The Continue / Close button is set automatically from the next
                form in this chart.
              </p>
            ) : (
              <p className="mt-3 text-sm text-karsa-muted">
                Confirmation messages for client forms live under Forms →
                Confirmations.
              </p>
            )}
          </div>
        ) : selectedStep?.stepType === "form" && selectedStep.formId ? (
          <div className="border border-karsa-border-subtle p-4 text-sm text-karsa-muted">
            <span className="font-medium text-karsa-text">
              {selectedStep.formName}
            </span>{" "}
            — edit this form under{" "}
            <Link
              to={`/dashboard/forms/${selectedStep.formId}`}
              className="font-medium text-karsa-accent-strong underline-offset-4 hover:underline"
            >
              Forms
            </Link>
            , or customize its confirmation under{" "}
            <Link
              to="/dashboard/forms/confirmations"
              className="font-medium text-karsa-accent-strong underline-offset-4 hover:underline"
            >
              Confirmations
            </Link>
            .
          </div>
        ) : null}

        {savedFlash ? (
          <p className="text-sm text-karsa-accent-strong">Saved.</p>
        ) : null}

        <button
          type="button"
          onClick={onSave}
          className="rounded-md bg-karsa-accent px-4 py-2.5 text-sm font-medium text-karsa-bg"
        >
          Save booking flow
        </button>
      </div>
    </div>
  );
}
