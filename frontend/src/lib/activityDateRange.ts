export type DatePreset = "7d" | "30d" | "today" | "all";

export function dateRangeFromPreset(preset: DatePreset): { from?: string; to?: string } {
  if (preset === "all") return {};
  const to = new Date();
  const from = new Date();
  if (preset === "today") {
    from.setHours(0, 0, 0, 0);
  } else if (preset === "30d") {
    from.setDate(from.getDate() - 30);
  } else {
    from.setDate(from.getDate() - 7);
  }
  return { from: from.toISOString(), to: to.toISOString() };
}

export function datePresetLabel(preset: DatePreset): string {
  const map: Record<DatePreset, string> = {
    today: "Today",
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    all: "All time",
  };
  return map[preset];
}
