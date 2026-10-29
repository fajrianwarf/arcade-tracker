import DemoApp from "./DemoApp";
import LiveApp from "./LiveApp";
import { resolveDataMode } from "../lib/data-mode";
export default function TrackerApp({
  initialTab = "Progress",
}: {
  initialTab?: "Progress" | "Catalog";
}) {
  return resolveDataMode(process.env.NEXT_PUBLIC_DATA_MODE) === "demo" ? (
    <DemoApp initialTab={initialTab} />
  ) : (
    <LiveApp initialTab={initialTab} />
  );
}
