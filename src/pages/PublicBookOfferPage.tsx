import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  showsOnCalendar,
  todayISO,
} from "../lib/store";
import { useDemoStore } from "../lib/use-demo-store";

function timeToMin(hhmm: string) {
  const [hour, minute] = hhmm.split(":").map(Number);
  return hour * 60 + minute;
}

export function PublicBookOfferPage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const { services, appointments } = useDemoStore();

  const serviceId = params.get("serviceId") ?? "";
  const date = params.get("date") ?? "";
  const time = params.get("time") ?? "";
  const durationParam = Number(params.get("duration") ?? "");

  const service = services.find((row) => row.id === serviceId);
  const durationMin =
    Number.isFinite(durationParam) && durationParam > 0
      ? durationParam
      : (service?.durationMin ?? 60);

  const unavailable = useMemo(() => {
    if (!service || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{1,2}:\d{2}$/.test(time)) {
      return true;
    }
    if (date < todayISO()) return true;
    const startMin = timeToMin(time);
    return appointments.some((appointment) => {
      if (!showsOnCalendar(appointment) || appointment.date !== date) {
        return false;
      }
      const otherEnd = appointment.startMin + appointment.durationMin;
      return appointment.startMin < startMin + durationMin && startMin < otherEnd;
    });
  }, [appointments, date, durationMin, service, time]);

  return (
    <div className="min-h-screen bg-[#f7f4ef] px-4 py-16 text-stone-900">
      <div className="mx-auto max-w-lg">
        <p className="text-xs tracking-[0.16em] text-stone-500 uppercase">
          Book now
        </p>
        <h1 className="mt-2 font-serif text-3xl">Sample Studio</h1>
        {unavailable ? (
          <p className="mt-8 text-base leading-relaxed text-stone-800">
            It is no longer available.
          </p>
        ) : (
          <div className="mt-8 space-y-3 text-sm leading-relaxed text-stone-700">
            <p>
              {service?.name} on {date} at {time} ({durationMin} minutes) is
              still open.
            </p>
            <p>
              In the full product this continues into the public booking form
              with that service, duration, date, and time already filled in.
            </p>
          </div>
        )}
        <Link
          to="/dashboard/settings/email"
          className="mt-8 inline-block text-sm text-stone-600 underline-offset-4 hover:underline"
        >
          ← Back to Messaging
        </Link>
        {slug ? (
          <p className="mt-6 text-[11px] text-stone-400">/{slug}</p>
        ) : null}
      </div>
    </div>
  );
}
