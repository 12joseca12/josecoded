"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/Button/Button";

interface SignOutButtonProps {
  label: string;
  loadingLabel: string;
}

export function SignOutButton({ label, loadingLabel }: SignOutButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="quiet" size="sm" loading={pending} loadingLabel={loadingLabel}>
      {label}
    </Button>
  );
}
