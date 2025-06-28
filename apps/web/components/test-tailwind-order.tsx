import React from "react";

export function TestTailwindOrder() {
  // These classes are deliberately in the wrong order to demonstrate the linting
  return (
    <div className="m-2 flex gap-2 rounded-lg bg-gray-100 p-4 text-red-500 hover:bg-blue-200">
      <p className="text-lg font-bold">
        This component has unordered Tailwind classes that will be fixed by the
        linter.
      </p>
      <button className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
        Click me
      </button>
    </div>
  );
}
