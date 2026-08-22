import { DayAvailabilityEdge } from "../components/DayAvailabilityEdge";
import { ExpandableAddSection } from "../components/ExpandableAddSection";
import { HmTimeSelect } from "../components/inputs/HmTimeSelect";
import type { Location, LocationHour } from "../lib/store";
import { updateLocationHours } from "../lib/store";
import { useDemoStore } from "../lib/use-demo-store";

const inputClass =
  "mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-sm text-karsa-text outline-none ring-karsa-accent/40 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70";
const labelClass = "text-xs text-karsa-faint";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "Pacific/Honolulu",
];

function hoursForLocation(location?: Location): LocationHour[] {
  return DAYS.map((_, dayOfWeek) => {
    const row = location?.hours.find((h) => h.dayOfWeek === dayOfWeek);
    return {
      dayOfWeek,
      startTime: row?.startTime ?? "09:00",
      endTime: row?.endTime ?? "17:00",
      closed: row?.closed ?? dayOfWeek === 0,
    };
  });
}

function LocationFields({
  location,
  hoursEditable = false,
}: {
  location?: Location;
  hoursEditable?: boolean;
}) {
  const hours = hoursForLocation(location);

  function patchHour(dayOfWeek: number, patch: Partial<LocationHour>) {
    if (!location || !hoursEditable) return;
    const next = hours.map((h) =>
      h.dayOfWeek === dayOfWeek ? { ...h, ...patch } : h,
    );
    updateLocationHours(location.id, next);
  }

  return (
    <div className="space-y-4">
      <p className="rounded-md border border-karsa-border-subtle bg-karsa-surface/40 px-3 py-2 text-xs text-karsa-faint">
        Sample location — name and address are live-app only. Hours below save
        in this browser.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Name</label>
          <input
            disabled
            value={location?.name ?? ""}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Timezone</label>
          <select
            disabled
            value={location?.timezone ?? "America/New_York"}
            className={inputClass}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-karsa-faint">
            Booking slots at this location use this timezone. Leave blank to
            inherit the main office timezone from Business settings.
          </p>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Address 1</label>
          <input
            disabled
            value={location?.address1 ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>City</label>
          <input
            disabled
            value={location?.city ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>State</label>
          <input
            disabled
            value={location?.state ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Postal code</label>
          <input
            disabled
            value={location?.postalCode ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input
            disabled
            value={location?.phone ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <p className={labelClass}>Hours of operation</p>
        {hoursEditable ? (
          <p className="mt-1 text-xs text-karsa-faint">
            Changes save in this browser and update closed hours on the
            Calendar.
          </p>
        ) : null}
        <div className="mt-2 space-y-2">
          {hours.map((hour, index) => (
            <div
              key={hour.dayOfWeek}
              className="flex items-stretch gap-3 rounded-md border border-karsa-border-subtle p-2 sm:p-3"
            >
              <div className="flex w-[6.5rem] shrink-0 self-stretch">
                <DayAvailabilityEdge
                  label="Closed"
                  variant="closed"
                  selected={hour.closed}
                  onToggle={() => {
                    if (!hoursEditable) return;
                    patchHour(hour.dayOfWeek, { closed: !hour.closed });
                  }}
                  className={
                    hoursEditable
                      ? "h-full min-h-full w-full"
                      : "pointer-events-none h-full min-h-full w-full"
                  }
                />
              </div>
              <div className="grid min-w-0 flex-1 items-center gap-2 sm:grid-cols-[1.2fr_1fr_1fr]">
                <p className="flex min-h-[4.75rem] items-center text-sm text-karsa-text">
                  {DAYS[index]}
                </p>
                <div>
                  <label className={labelClass}>Open</label>
                  {hour.closed ? (
                    <input
                      type="text"
                      value="—"
                      disabled
                      readOnly
                      className={`${inputClass} cursor-not-allowed text-karsa-faint`}
                    />
                  ) : hoursEditable ? (
                    <HmTimeSelect
                      aria-label={`${DAYS[index]} open`}
                      value={hour.startTime}
                      minHm="00:00"
                      maxHm={hour.endTime}
                      onChange={(value) =>
                        patchHour(hour.dayOfWeek, { startTime: value })
                      }
                      className={inputClass}
                    />
                  ) : (
                    <input
                      disabled
                      value={hour.startTime}
                      className={inputClass}
                    />
                  )}
                </div>
                <div>
                  <label className={labelClass}>Close</label>
                  {hour.closed ? (
                    <input
                      type="text"
                      value="—"
                      disabled
                      readOnly
                      className={`${inputClass} cursor-not-allowed text-karsa-faint`}
                    />
                  ) : hoursEditable ? (
                    <HmTimeSelect
                      aria-label={`${DAYS[index]} close`}
                      value={hour.endTime}
                      minHm={hour.startTime}
                      maxHm="23:59"
                      onChange={(value) =>
                        patchHour(hour.dayOfWeek, { endTime: value })
                      }
                      className={inputClass}
                    />
                  ) : (
                    <input
                      disabled
                      value={hour.endTime}
                      className={inputClass}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DisabledCreateLocationForm() {
  return (
    <div className="space-y-4 border border-karsa-border-subtle p-4 opacity-80">
      <h2 className="text-sm font-medium text-karsa-text">Add location</h2>
      <LocationFields />
      <p className="text-xs text-karsa-faint">
        Sample location — editing is live-app only
      </p>
      <button
        type="button"
        disabled
        className="rounded-md bg-karsa-accent px-3 py-2 text-sm font-medium text-karsa-bg opacity-60"
      >
        Create
      </button>
    </div>
  );
}

export function LocationsPage() {
  const { locations } = useDemoStore();
  const sorted = [...locations].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-xs font-medium tracking-[0.16em] text-karsa-faint uppercase">
        People
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-karsa-text">
        Locations
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-karsa-muted">
        Your studio address and which days/hours you are open. Closed days show
        as blocked on the Calendar so nobody books when you are away.
      </p>

      <ExpandableAddSection
        addLabel="Add location"
        disabled
        list={
          <div className="space-y-6">
            {sorted.length === 0 ? (
              <p className="text-center text-sm text-karsa-faint">
                No locations yet.
              </p>
            ) : (
              sorted.map((location) => (
                <div
                  key={location.id}
                  className="border border-karsa-border-subtle p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="font-medium text-karsa-text">{location.name}</p>
                    <span
                      className={
                        location.active
                          ? "text-xs text-karsa-accent-strong"
                          : "text-xs text-karsa-warning"
                      }
                    >
                      {location.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <LocationFields location={location} hoursEditable />
                </div>
              ))
            )}
          </div>
        }
      >
        <DisabledCreateLocationForm />
      </ExpandableAddSection>
    </div>
  );
}
