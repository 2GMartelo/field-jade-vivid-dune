import { createFileRoute } from "@tanstack/react-router";
import { App } from "@/components/app-shell";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <App />;
}
