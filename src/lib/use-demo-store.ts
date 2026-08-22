import { useSyncExternalStore } from "react";
import { getDemoState, subscribeDemo, type DemoState } from "./store";

export function useDemoStore(): DemoState {
  return useSyncExternalStore(subscribeDemo, getDemoState, getDemoState);
}
