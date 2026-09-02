import { useMemo, useSyncExternalStore } from "react";
import { useDemoStore } from "./use-demo-store";
import type { Appointment, Employee, Service } from "./store";

export const LOCATION_FILTER_ALL = "all";
const STORAGE_KEY = "karsaro-demo-location-filter";

let raw = LOCATION_FILTER_ALL;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function readStored(): string {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value && value.trim() ? value : LOCATION_FILTER_ALL;
  } catch {
    return LOCATION_FILTER_ALL;
  }
}

if (typeof window !== "undefined") {
  raw = readStored();
}

export function getDemoLocationFilterRaw(): string {
  return raw;
}

export function subscribeDemoLocationFilter(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setDemoLocationFilter(value: string) {
  raw = value && value !== LOCATION_FILTER_ALL ? value : LOCATION_FILTER_ALL;
  try {
    localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    /* ignore quota / private mode */
  }
  emit();
}

/** Null means every location. Invalid ids fall back to all. */
export function resolveLocationFilter(
  value: string | null | undefined,
  validIds: string[],
): string | null {
  if (!value || value === LOCATION_FILTER_ALL) return null;
  return validIds.includes(value) ? value : null;
}

/** Empty assignment = not offered at any location. */
export function isServiceAvailableAtLocation(
  assignedLocationIds: string[] | undefined | null,
  locationId: string | null | undefined,
): boolean {
  if (!locationId) return true;
  if (!assignedLocationIds || assignedLocationIds.length === 0) return false;
  return assignedLocationIds.includes(locationId);
}

/** Empty assignment = works at every location. */
export function isEmployeeAvailableAtLocation(
  assignedLocationIds: string[] | undefined | null,
  locationId: string | null | undefined,
): boolean {
  if (!locationId) return true;
  if (!assignedLocationIds || assignedLocationIds.length === 0) return true;
  return assignedLocationIds.includes(locationId);
}

export function isAppointmentAtLocation(
  appointment: Appointment,
  locationId: string | null | undefined,
  services: Service[],
): boolean {
  if (!locationId) return true;
  const service = services.find((row) => row.id === appointment.serviceId);
  return isServiceAvailableAtLocation(service?.locationIds, locationId);
}

export function useDemoLocationScope(): {
  locations: { id: string; name: string }[];
  locationId: string | null;
  setLocationFilter: (value: string) => void;
} {
  const { locations } = useDemoStore();
  const stored = useSyncExternalStore(
    subscribeDemoLocationFilter,
    getDemoLocationFilterRaw,
    getDemoLocationFilterRaw,
  );
  const active = useMemo(
    () => locations.filter((location) => location.active),
    [locations],
  );
  const locationId = resolveLocationFilter(
    stored,
    active.map((location) => location.id),
  );

  return {
    locations: active.map((location) => ({
      id: location.id,
      name: location.name,
    })),
    locationId,
    setLocationFilter: setDemoLocationFilter,
  };
}

export function filterEmployeesForLocation<T extends Employee>(
  employees: T[],
  locationId: string | null | undefined,
): T[] {
  if (!locationId) return employees;
  return employees.filter((employee) =>
    isEmployeeAvailableAtLocation(employee.locationIds, locationId),
  );
}

export function filterServicesForLocation<T extends Service>(
  services: T[],
  locationId: string | null | undefined,
): T[] {
  if (!locationId) return services;
  return services.filter((service) =>
    isServiceAvailableAtLocation(service.locationIds, locationId),
  );
}
