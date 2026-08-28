import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AppointmentDetailModal } from "./AppointmentDetailModal";
import { WaitlistDetailModal } from "./WaitlistDetailModal";

type EntityModals = {
  openAppointment: (id: string) => void;
  openWaitlist: (id: string) => void;
};

const EntityModalsContext = createContext<EntityModals | null>(null);

export function useEntityModals(): EntityModals {
  const ctx = useContext(EntityModalsContext);
  if (!ctx) {
    throw new Error("useEntityModals must be used within EntityModalsProvider");
  }
  return ctx;
}

export function EntityModalsProvider({ children }: { children: ReactNode }) {
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [waitlistId, setWaitlistId] = useState<string | null>(null);

  const openAppointment = useCallback((id: string) => {
    setWaitlistId(null);
    setAppointmentId(id);
  }, []);

  const openWaitlist = useCallback((id: string) => {
    setAppointmentId(null);
    setWaitlistId(id);
  }, []);

  const value = useMemo(
    () => ({ openAppointment, openWaitlist }),
    [openAppointment, openWaitlist],
  );

  return (
    <EntityModalsContext.Provider value={value}>
      {children}
      {appointmentId ? (
        <AppointmentDetailModal
          appointmentId={appointmentId}
          onClose={() => setAppointmentId(null)}
        />
      ) : null}
      {waitlistId ? (
        <WaitlistDetailModal
          waitlistId={waitlistId}
          onClose={() => setWaitlistId(null)}
        />
      ) : null}
    </EntityModalsContext.Provider>
  );
}

export function EntityOpenButton({
  kind,
  id,
  className,
  children,
}: {
  kind: "appointment" | "waitlist";
  id: string;
  className?: string;
  children: ReactNode;
}) {
  const { openAppointment, openWaitlist } = useEntityModals();
  return (
    <button
      type="button"
      className={className}
      onClick={() =>
        kind === "appointment" ? openAppointment(id) : openWaitlist(id)
      }
    >
      {children}
    </button>
  );
}
