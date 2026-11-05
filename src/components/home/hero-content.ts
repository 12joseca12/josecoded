import type { CSSProperties } from "react";

export type CodeKind = "plain" | "keyword" | "function" | "component" | "attribute" | "string";

export interface CodeToken {
  kind: CodeKind;
  text: string;
}

export const codeLines: CodeToken[][] = [
  [
    { kind: "keyword", text: "export function" },
    { kind: "plain", text: " " },
    { kind: "function", text: "OrderCard" },
    { kind: "plain", text: "({ orders }) {" },
  ],
  [
    { kind: "plain", text: "  " },
    { kind: "keyword", text: "return" },
    { kind: "plain", text: " (" },
  ],
  [
    { kind: "plain", text: "    <" },
    { kind: "component", text: "Card" },
    { kind: "plain", text: " " },
    { kind: "attribute", text: "tone" },
    { kind: "plain", text: "=" },
    { kind: "string", text: '"coral"' },
    { kind: "plain", text: ">" },
  ],
  [
    { kind: "plain", text: "      <" },
    { kind: "component", text: "Count" },
    { kind: "plain", text: " " },
    { kind: "attribute", text: "value" },
    { kind: "plain", text: "={orders.length} />" },
  ],
  [
    { kind: "plain", text: "    </" },
    { kind: "component", text: "Card" },
    { kind: "plain", text: ">" },
  ],
];

export const codeFile = "OrderCard.tsx";
export const briefFile = "brief.md";
export const previewUrl = "vista-previa.pedidos.app";
export const liveUrl = "pedidos.app";
export const clockTime = "9:41";
export const typeSample = "Aa";
export const typeFace = "Inter Tight · 800";
export const rulerWide = "24";
export const rulerHigh = "16";

export const tags = {
  header: "<Header>",
  orderCard: "<OrderCard>",
  orderRow: "<OrderRow>",
  tabBar: "<TabBar>",
  sidebar: "<Sidebar>",
  kpi: "<Kpi>",
  chart: "<OrdersChart>",
} as const;

export const chartBars = [0.34, 0.48, 0.41, 0.6, 0.52, 0.7, 0.63, 0.78, 0.72, 0.9] as const;

export function vars(values: Record<string, number | string>): CSSProperties {
  return values;
}
