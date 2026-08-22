/**
 * Google Calendar event colorIds (1–11), muted for Karsaro’s dark UI.
 */
export type ServiceColorOption = {
  id: string;
  label: string;
  googleColorId: string;
  bg: string;
  border: string;
  swatch: string;
};

export const SERVICE_COLOR_OPTIONS: ServiceColorOption[] = [
  {
    id: "1",
    label: "Lavender",
    googleColorId: "1",
    bg: "rgba(140, 120, 168, 0.22)",
    border: "rgba(160, 140, 190, 0.55)",
    swatch: "#8c78a8",
  },
  {
    id: "2",
    label: "Sage",
    googleColorId: "2",
    bg: "rgba(154, 175, 157, 0.22)",
    border: "rgba(154, 175, 157, 0.55)",
    swatch: "#9aaf9d",
  },
  {
    id: "3",
    label: "Grape",
    googleColorId: "3",
    bg: "rgba(120, 100, 150, 0.24)",
    border: "rgba(150, 130, 180, 0.55)",
    swatch: "#786496",
  },
  {
    id: "4",
    label: "Flamingo",
    googleColorId: "4",
    bg: "rgba(180, 120, 130, 0.22)",
    border: "rgba(200, 140, 150, 0.55)",
    swatch: "#b47882",
  },
  {
    id: "5",
    label: "Banana",
    googleColorId: "5",
    bg: "rgba(180, 160, 90, 0.22)",
    border: "rgba(200, 180, 110, 0.55)",
    swatch: "#b4a05a",
  },
  {
    id: "6",
    label: "Tangerine",
    googleColorId: "6",
    bg: "rgba(180, 130, 80, 0.22)",
    border: "rgba(200, 150, 100, 0.55)",
    swatch: "#b48250",
  },
  {
    id: "7",
    label: "Peacock",
    googleColorId: "7",
    bg: "rgba(80, 140, 150, 0.22)",
    border: "rgba(100, 160, 170, 0.55)",
    swatch: "#508c96",
  },
  {
    id: "8",
    label: "Graphite",
    googleColorId: "8",
    bg: "rgba(120, 126, 138, 0.28)",
    border: "rgba(150, 156, 168, 0.55)",
    swatch: "#787e8a",
  },
  {
    id: "9",
    label: "Blueberry",
    googleColorId: "9",
    bg: "rgba(90, 120, 170, 0.22)",
    border: "rgba(110, 140, 190, 0.55)",
    swatch: "#5a78aa",
  },
  {
    id: "10",
    label: "Basil",
    googleColorId: "10",
    bg: "rgba(100, 140, 100, 0.22)",
    border: "rgba(120, 160, 120, 0.55)",
    swatch: "#648c64",
  },
  {
    id: "11",
    label: "Tomato",
    googleColorId: "11",
    bg: "rgba(170, 100, 95, 0.22)",
    border: "rgba(190, 120, 115, 0.55)",
    swatch: "#aa645f",
  },
];

export const DEFAULT_SERVICE_COLOR_ID = "2";

export function getServiceColor(
  colorId: string | null | undefined,
): ServiceColorOption {
  return (
    SERVICE_COLOR_OPTIONS.find((c) => c.id === colorId) ??
    SERVICE_COLOR_OPTIONS.find((c) => c.id === DEFAULT_SERVICE_COLOR_ID)!
  );
}
