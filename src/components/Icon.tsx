import type { ReactNode } from "react";

export type IconName =
  | "home" | "feed" | "bottle" | "moon" | "sun" | "diaper" | "chart" | "clock" | "heart" | "swap"
  | "check" | "drop" | "target" | "play" | "plus" | "edit" | "trash" | "close" | "back" | "chevron"
  | "trend" | "pill" | "syringe" | "star" | "music" | "file" | "sliders" | "grid" | "calendar"
  | "thermo" | "camera" | "bell" | "cloud" | "smile" | "download" | "upload" | "alert" | "stop";

const FILLED: IconName[] = ["heart", "play", "stop"];

const PATHS: Record<IconName, ReactNode> = {
  home: (<><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5a1 1 0 0 0 1 1H10v-5h4v5h3.5a1 1 0 0 0 1-1V10" /></>),
  feed: (<><circle cx="9" cy="6.5" r="3" /><path d="M4 21v-3a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v3" /><circle cx="17.5" cy="10.5" r="2" /></>),
  bottle: (<><path d="M10 2.500h4V5h-4z" /><path d="M8.500 8c0-1.700 1.300-3 3-3h1c1.700 0 3 1.300 3 3v11a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2z" /><path d="M8.500 12h7M8.500 15.500h7" /></>),
  moon: (<><path d="M20 14.500A8 8 0 0 1 9.500 4a8 8 0 1 0 10.500 10.500z" /><path d="M17.500 3.500v3M16 5h3" /></>),
  sun: (<><circle cx="12" cy="12" r="4" /><path d="M12 2.500v3M12 18.500v3M2.500 12h3M18.500 12h3M5.300 5.300l2.100 2.100M16.600 16.600l2.100 2.100M5.300 18.700l2.100-2.100M16.600 7.400l2.100-2.100" /></>),
  diaper: (<><path d="M3.500 7.500h17v3.200a8.500 8.500 0 0 1-5.400 7.900L12 20l-3.100-1.400a8.500 8.500 0 0 1-5.400-7.900z" /><path d="M3.500 7.500c2.600 1.400 5.200 2 8.500 2s5.900-.6 8.500-2" /></>),
  chart: (<path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />),
  clock: (<><circle cx="12" cy="12" r="8.500" /><path d="M12 7.500V12l3 2" /></>),
  heart: (<path d="M12 20.600c-.3 0-.6-.1-.8-.3C6.300 16.200 3 13.200 3 9.600 3 7 5 5 7.500 5c1.700 0 3.300.9 4.500 2.400C13.200 5.900 14.800 5 16.500 5 19 5 21 7 21 9.600c0 3.600-3.300 6.600-8.200 10.700-.2.200-.5.300-.8.300z" />),
  swap: (<><path d="M4 9a8 8 0 0 1 14-3l2 2M20 4v4h-4" /><path d="M20 15a8 8 0 0 1-14 3l-2-2M4 20v-4h4" /></>),
  check: (<path d="m5 12.500 4.500 4.500L19 7.500" />),
  drop: (<path d="M12 3.500s6 6.200 6 10.300a6 6 0 0 1-12 0C6 9.700 12 3.500 12 3.500z" />),
  target: (<><circle cx="12" cy="12" r="8.500" /><circle cx="12" cy="12" r="4.500" /><circle cx="12" cy="12" r="1" /></>),
  play: (<path d="M8 5.500v13a1 1 0 0 0 1.500.9l10.500-6.500a1 1 0 0 0 0-1.700L9.500 4.600A1 1 0 0 0 8 5.500z" />),
  stop: (<rect x="6" y="6" width="12" height="12" rx="2" />),
  plus: (<path d="M12 5v14M5 12h14" />),
  edit: (<><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13.500 6.500 4 4" /></>),
  trash: (<><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /><path d="M10 11v6M14 11v6" /></>),
  close: (<path d="M6 6l12 12M18 6 6 18" />),
  back: (<path d="m15 5-7 7 7 7" />),
  chevron: (<path d="m9 5 7 7-7 7" />),
  trend: (<><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></>),
  pill: (<><path d="M10.200 20.200a4.600 4.600 0 0 1-6.400-6.400l9.900-9.900a4.600 4.600 0 0 1 6.400 6.400z" /><path d="m8.500 8.500 7 7" /></>),
  syringe: (<><path d="m18 3 3 3M16 5l3 3M14.500 6.500l3 3-8 8-3-3zM9 15l-4 4M3 21l2-2" /></>),
  star: (<path d="m12 3.500 2.600 5.300 5.900.9-4.300 4.100 1 5.800L12 16.800l-5.200 2.800 1-5.800-4.300-4.100 5.900-.9z" />),
  music: (<><path d="M9 18V6l10-2v12" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" /></>),
  file: (<><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M9.500 13h6M9.500 17h6" /></>),
  sliders: (<><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>),
  grid: (<><rect x="4" y="4" width="6.500" height="6.500" rx="1.500" /><rect x="13.500" y="4" width="6.500" height="6.500" rx="1.500" /><rect x="4" y="13.500" width="6.500" height="6.500" rx="1.500" /><rect x="13.500" y="13.500" width="6.500" height="6.500" rx="1.500" /></>),
  calendar: (<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M8 3v4M16 3v4" /></>),
  thermo: (<path d="M10 14.500V5a2 2 0 1 1 4 0v9.500a4 4 0 1 1-4 0z" />),
  camera: (<><path d="M4 8h3l1.500-2h7L17 8h3v11H4z" /><circle cx="12" cy="13.500" r="3.200" /></>),
  bell: (<><path d="M6 17v-6a6 6 0 1 1 12 0v6l1.500 2h-15z" /><path d="M10 21h4" /></>),
  cloud: (<path d="M7 18a4 4 0 0 1-.6-8A6 6 0 0 1 18 9.500 3.800 3.800 0 0 1 17.500 18z" />),
  smile: (<><circle cx="12" cy="12" r="8.500" /><path d="M8.500 14a4.500 4.500 0 0 0 7 0M9 9.500h.01M15 9.500h.01" /></>),
  download: (<path d="M12 4v11M7 10l5 5 5-5M5 20h14" />),
  upload: (<path d="M12 20V9M7 14l5-5 5 5M5 4h14" />),
  alert: (<><path d="M12 3.500 21.500 20h-19z" /><path d="M12 10v4.500M12 17.200h.01" /></>),
};

export function Icon({ name, className = "w-5 h-5" }: { name: IconName; className?: string }) {
  const filled = FILLED.includes(name);
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
