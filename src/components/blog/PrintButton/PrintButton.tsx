"use client";

import { Button } from "@/components/ui/Button/Button";

interface PrintButtonProps {
  label: string;
}

export function PrintButton({ label }: PrintButtonProps) {
  return (
    <div data-print="hide">
      <Button
        type="button"
        variant="light"
        size="sm"
        onClick={() => {
          window.print();
        }}
      >
        {label}
      </Button>
    </div>
  );
}
