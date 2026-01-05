"use client";

import { Button } from "@/components/alignui/actions/button";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="mb-5 text-center">Something went wrong!</h2>
      <Button type="submit" variant="primary" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
