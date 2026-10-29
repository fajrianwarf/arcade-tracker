export type DataMode = "demo" | "supabase";
/** An explicit live choice never silently falls back to dummy data. */
export function resolveDataMode(value: string | undefined): DataMode {
  if (!value || value === "demo") return "demo";
  if (value === "supabase") return "supabase";
  throw new Error("NEXT_PUBLIC_DATA_MODE must be demo or supabase.");
}
