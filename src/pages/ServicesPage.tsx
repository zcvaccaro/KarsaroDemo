import { useState } from "react";
import { ExpandableAddSection } from "../components/ExpandableAddSection";
import { KarsaToggleField } from "../components/karsa-toggle-switch";
import {
  DEFAULT_SERVICE_COLOR_ID,
  SERVICE_COLOR_OPTIONS,
} from "../lib/service-colors";
import {
  formatServiceOptionLabel,
  setServiceActive,
  upsertService,
  type Service,
} from "../lib/store";
import { useDemoStore } from "../lib/use-demo-store";

const inputClass =
  "mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-sm text-karsa-text outline-none ring-karsa-accent/40 focus:ring-2";
const labelClass = "text-xs text-karsa-faint";

type OptionDraft = {
  durationMinutes: number;
  price: string;
  label: string;
};

type LocationOption = { id: string; name: string };

type ServiceDraft = {
  name: string;
  description: string;
  bufferMinutes: number;
  colorId: string;
  options: OptionDraft[];
  locationIds: string[];
};

function defaultOptions(service?: Service): OptionDraft[] {
  if (service?.options.length) {
    return service.options.map((option) => ({
      durationMinutes: option.durationMinutes,
      price: String(option.price),
      label: option.label ?? "",
    }));
  }
  return [{ durationMinutes: 60, price: "0", label: "" }];
}

function initialDraft(
  service: Service | undefined,
  locations: LocationOption[],
  selectedLocationIds: string[],
): ServiceDraft {
  return {
    name: service?.name ?? "",
    description: service?.description ?? "",
    bufferMinutes: service?.bufferMinutes ?? 15,
    colorId: service?.colorId ?? DEFAULT_SERVICE_COLOR_ID,
    options: defaultOptions(service),
    locationIds:
      selectedLocationIds.length > 0
        ? selectedLocationIds
        : locations.map((l) => l.id),
  };
}

function ServiceFields({
  draft,
  onChange,
  locations,
}: {
  draft: ServiceDraft;
  onChange: (next: ServiceDraft) => void;
  locations: LocationOption[];
}) {
  function updateOption(index: number, patch: Partial<OptionDraft>) {
    onChange({
      ...draft,
      options: draft.options.map((row, i) =>
        i === index ? { ...row, ...patch } : row,
      ),
    });
  }

  function addOption() {
    onChange({
      ...draft,
      options: [
        ...draft.options,
        {
          durationMinutes: 60,
          price: draft.options[0]?.price ?? "0",
          label: "",
        },
      ],
    });
  }

  function removeOption(index: number) {
    if (draft.options.length <= 1) return;
    onChange({
      ...draft,
      options: draft.options.filter((_, i) => i !== index),
    });
  }

  function toggleLocation(locationId: string, next: boolean) {
    onChange({
      ...draft,
      locationIds: next
        ? draft.locationIds.includes(locationId)
          ? draft.locationIds
          : [...draft.locationIds, locationId]
        : draft.locationIds.filter((id) => id !== locationId),
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Name</label>
          <input
            required
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Description</label>
          <textarea
            rows={2}
            value={draft.description}
            onChange={(e) =>
              onChange({ ...draft, description: e.target.value })
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Buffer (minutes)</label>
          <input
            type="number"
            min={0}
            max={240}
            required
            value={draft.bufferMinutes}
            onChange={(e) =>
              onChange({
                ...draft,
                bufferMinutes: Number(e.target.value),
              })
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Calendar color</label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {SERVICE_COLOR_OPTIONS.map((color) => {
              const selected = draft.colorId === color.id;
              return (
                <button
                  key={color.id}
                  type="button"
                  title={color.label}
                  aria-label={color.label}
                  aria-pressed={selected}
                  onClick={() => onChange({ ...draft, colorId: color.id })}
                  className={`size-7 rounded-md border transition ${
                    selected
                      ? "ring-2 ring-karsa-accent ring-offset-1 ring-offset-karsa-bg"
                      : "border-karsa-border-subtle hover:border-karsa-accent/50"
                  }`}
                  style={{
                    backgroundColor: color.swatch,
                    borderColor: selected ? color.swatch : undefined,
                  }}
                />
              );
            })}
          </div>
          <p className="mt-1 text-[11px] text-karsa-faint">
            Display this service in the color of your choice. If Google Calendar
            sync is enabled these colors will be reflected there as well.
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <p className={labelClass}>Duration & price options</p>
          <button
            type="button"
            className="text-xs text-karsa-accent-strong"
            onClick={addOption}
          >
            + Add option
          </button>
        </div>
        <div className="mt-2 space-y-3">
          {draft.options.map((option, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-md border border-karsa-border-subtle p-3 sm:grid-cols-[1fr_1fr_1.2fr_auto]"
            >
              <div>
                <label className={labelClass}>Duration (min)</label>
                <input
                  type="number"
                  min={5}
                  required
                  value={option.durationMinutes}
                  onChange={(e) =>
                    updateOption(index, {
                      durationMinutes: Number(e.target.value),
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Price</label>
                <input
                  required
                  value={option.price}
                  onChange={(e) =>
                    updateOption(index, { price: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Label (optional)</label>
                <input
                  value={option.label}
                  placeholder={formatServiceOptionLabel({
                    durationMinutes: option.durationMinutes,
                    price: option.price,
                    label: null,
                  })}
                  onChange={(e) =>
                    updateOption(index, { label: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  disabled={draft.options.length <= 1}
                  className="rounded-md border border-karsa-border px-2 py-2 text-xs text-karsa-muted disabled:opacity-40"
                  onClick={() => removeOption(index)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-karsa-faint">
          The first option syncs to the legacy service duration/price for
          backwards compatibility.
        </p>
      </div>

      {locations.length > 0 ? (
        <div className="space-y-3 rounded-md border border-karsa-border-subtle p-4">
          <div>
            <p className="text-sm text-karsa-text">Available at</p>
            <p className="mt-0.5 text-xs text-karsa-faint">
              All locations are on by default. Turn a location off if this
              service is not offered there.
            </p>
          </div>
          <div className="space-y-4">
            {locations.map((location) => (
              <KarsaToggleField
                key={location.id}
                label={location.name}
                checked={draft.locationIds.includes(location.id)}
                onChange={(next) => toggleLocation(location.id, next)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function toPersisted(draft: ServiceDraft) {
  return {
    name: draft.name.trim(),
    description: draft.description,
    bufferMinutes: draft.bufferMinutes,
    colorId: draft.colorId,
    options: draft.options.map((o) => ({
      durationMinutes: Number(o.durationMinutes) || 60,
      price: Number(o.price) || 0,
      label: o.label.trim() || null,
    })),
    locationIds: draft.locationIds,
  };
}

function CreateServiceForm({ locations }: { locations: LocationOption[] }) {
  const [draft, setDraft] = useState(() =>
    initialDraft(undefined, locations, locations.map((l) => l.id)),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  return (
    <form
      key={formKey}
      className="space-y-4 border border-karsa-border-subtle p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!draft.name.trim()) {
          setError("Name is required.");
          setMessage(null);
          return;
        }
        upsertService({ ...toPersisted(draft), active: true });
        setError(null);
        setMessage("Service created.");
        setDraft(
          initialDraft(undefined, locations, locations.map((l) => l.id)),
        );
        setFormKey((k) => k + 1);
      }}
    >
      <h2 className="text-sm font-medium text-karsa-text">Add service</h2>
      <ServiceFields draft={draft} onChange={setDraft} locations={locations} />
      {error ? <p className="text-sm text-karsa-danger">{error}</p> : null}
      {message ? (
        <p className="text-sm text-karsa-accent-strong">{message}</p>
      ) : null}
      <button
        type="submit"
        className="rounded-md bg-karsa-accent px-3 py-2 text-sm font-medium text-karsa-bg"
      >
        Create
      </button>
    </form>
  );
}

function EditServiceForm({
  service,
  locations,
  selectedLocationIds,
}: {
  service: Service;
  locations: LocationOption[];
  selectedLocationIds: string[];
}) {
  const [draft, setDraft] = useState(() =>
    initialDraft(service, locations, selectedLocationIds),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!draft.name.trim()) {
          setError("Name is required.");
          setMessage(null);
          return;
        }
        upsertService({
          id: service.id,
          ...toPersisted(draft),
          active: service.active,
        });
        setError(null);
        setMessage("Saved.");
      }}
    >
      <ServiceFields draft={draft} onChange={setDraft} locations={locations} />
      {error ? <p className="text-sm text-karsa-danger">{error}</p> : null}
      {message ? (
        <p className="text-sm text-karsa-accent-strong">{message}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded-md bg-karsa-accent px-3 py-1.5 text-sm font-medium text-karsa-bg"
        >
          Save
        </button>
        <button
          type="button"
          className="rounded-md border border-karsa-border px-3 py-1.5 text-sm text-karsa-muted"
          onClick={() => setServiceActive(service.id, !service.active)}
        >
          {service.active ? "Deactivate" : "Activate"}
        </button>
      </div>
    </form>
  );
}

export function ServicesPage() {
  const { services, locations } = useDemoStore();
  const locationOptions = locations
    .filter((l) => l.active)
    .map((l) => ({ id: l.id, name: l.name }));
  const sorted = [...services].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-xs font-medium tracking-[0.16em] text-karsa-faint uppercase">
        People
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-karsa-text">
        Services
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-karsa-muted">
        Set up what you offer: name, how long it takes, price to display, and
        calendar color. These choices appear when you book on the Calendar or
        Book Now, and they color-code visits on the schedule.
      </p>

      <ExpandableAddSection
        addLabel="Add service"
        list={
          <div className="space-y-6">
            {sorted.length === 0 ? (
              <p className="text-center text-sm text-karsa-faint">
                No services yet.
              </p>
            ) : (
              sorted.map((service) => (
                <div
                  key={service.id}
                  className="border border-karsa-border-subtle p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="font-medium text-karsa-text">{service.name}</p>
                    <span
                      className={
                        service.active
                          ? "text-xs text-karsa-accent-strong"
                          : "text-xs text-karsa-warning"
                      }
                    >
                      {service.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <EditServiceForm
                    locations={locationOptions}
                    selectedLocationIds={
                      service.locationIds.length > 0
                        ? service.locationIds
                        : locationOptions.map((l) => l.id)
                    }
                    service={service}
                  />
                </div>
              ))
            )}
          </div>
        }
      >
        <CreateServiceForm locations={locationOptions} />
      </ExpandableAddSection>
    </div>
  );
}
