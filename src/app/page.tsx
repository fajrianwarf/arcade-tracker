import DemoApp from "../components/DemoApp";
import LiveApp from "../components/LiveApp";
import { resolveDataMode } from "../lib/data-mode";
export default function Home() {
  const mode = resolveDataMode(process.env.NEXT_PUBLIC_DATA_MODE);
  return mode === "demo" ? <DemoApp /> : <LiveApp />;
}
