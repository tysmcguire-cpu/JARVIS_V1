"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="state-screen"><h1>Workspace unavailable</h1><p>An operation could not be completed. No private error details are displayed.</p><Button onClick={reset}>Try again</Button></main>; }
