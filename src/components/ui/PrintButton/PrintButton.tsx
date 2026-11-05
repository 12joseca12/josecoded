"use client";

import { Button } from "../Button/Button";

interface PrintButtonProps {
  label: string;
}

export function PrintButton({ label }: PrintButtonProps) {
  return (
    <Button
      variant="primary"
      type="button"
      onClick={() => {
        window.print();
      }}
    >
      {label}
    </Button>
  );
}
