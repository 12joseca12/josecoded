"use client";

import { useEffect, useState } from "react";

let detonated = false;

export function Bomb({ recovered }: { recovered: string }) {
  const [fail, setFail] = useState(false);

  useEffect(() => {
    if (detonated) return;
    detonated = true;
    queueMicrotask(() => {
      setFail(true);
    });
  }, []);

  if (fail) throw new Error("Dev test error");
  return <p>{recovered}</p>;
}
