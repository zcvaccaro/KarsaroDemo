export type WebsitePlatform =
  | "squarespace"
  | "wix"
  | "wordpress"
  | "instagram"
  | "google-business"
  | "custom"
  | "unknown";

const HINTS: { platform: WebsitePlatform; tests: RegExp[] }[] = [
  {
    platform: "squarespace",
    tests: [/squarespace/i, /sqsp\.com/i],
  },
  {
    platform: "wix",
    tests: [/wixsite\.com/i, /wix\.com/i],
  },
  {
    platform: "wordpress",
    tests: [/wordpress/i, /wp-content/i, /wpengine/i],
  },
  {
    platform: "instagram",
    tests: [/instagram\.com/i],
  },
  {
    platform: "google-business",
    tests: [/business\.google/i, /g\.page/i, /maps\.app\.goo/i, /google\.com\/maps/i],
  },
];

export function guessWebsitePlatform(raw: string): WebsitePlatform {
  const value = raw.trim();
  if (!value) return "unknown";
  for (const hint of HINTS) {
    if (hint.tests.some((test) => test.test(value))) return hint.platform;
  }
  return "unknown";
}

export function platformLabel(platform: WebsitePlatform) {
  switch (platform) {
    case "squarespace":
      return "Squarespace";
    case "wix":
      return "Wix";
    case "wordpress":
      return "WordPress";
    case "instagram":
      return "Instagram";
    case "google-business":
      return "Google Business";
    case "custom":
      return "a custom site";
    default:
      return "another site";
  }
}
