import { useSyncExternalStore } from "react";

export type ViewerRole = "admin" | "receptionist" | "practitioner";

const ROLE_LABEL: Record<ViewerRole, string> = {
  admin: "Admin",
  receptionist: "Receptionist",
  practitioner: "Practitioner",
};

let viewerRole: ViewerRole = "admin";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getViewerRole() {
  return viewerRole;
}

export function setViewerRole(next: ViewerRole) {
  if (viewerRole === next) return;
  viewerRole = next;
  emit();
}

export function subscribeViewerRole(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useViewerRole() {
  return useSyncExternalStore(subscribeViewerRole, getViewerRole, getViewerRole);
}

export function viewerRoleLabel(role: ViewerRole) {
  return ROLE_LABEL[role];
}
