// The LCP element of the home must be the hero `h1` or the hero poster image (task 2.9, DT §1.6). Anything else
// (a late card, the canvas, a font swap on another block) means the first paint was regressed. Reads the reports that
// `lhci autorun` writes to `.lighthouseci/<form-factor>/*.report.json` (upload target `filesystem`).
// Runs with plain Node (type stripping, Node >= 22.18).
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export interface LcpNode {
  selector?: string;
  snippet?: string;
}

/** `h1` anywhere in the selector path (the LCP can be a letter span inside it) or the poster `<img>`. */
export function isAllowedLcpElement(node: LcpNode | undefined): boolean {
  if (!node) return false;
  const selector = node.selector ?? '';
  const snippet = node.snippet ?? '';
  if (/(^|[\s>])h1([.#:\s>]|$)/.test(selector.replaceAll(/\s*>\s*/g, ' > '))) return true;
  return /^<img\b/.test(snippet) && /\/hero\/poster\./.test(snippet);
}

interface Lhr {
  finalDisplayedUrl?: string;
  finalUrl?: string;
  audits?: Record<string, { details?: { items?: { items?: { node?: LcpNode }[]; node?: LcpNode }[] } }>;
}

/** Node of the LCP element in a Lighthouse report, or `undefined` if the audit did not run. */
export function lcpNode(lhr: Lhr): LcpNode | undefined {
  const items = lhr.audits?.['largest-contentful-paint-element']?.details?.items ?? [];
  // the first item is the element table: its first row holds the node
  return items[0]?.items?.[0]?.node ?? items[0]?.node;
}

export function assertReports(reports: { file: string; lhr: Lhr }[]): string[] {
  if (reports.length === 0) return ['no Lighthouse reports found: run `pnpm lhci` first'];
  return reports.flatMap(({ file, lhr }) => {
    const node = lcpNode(lhr);
    return isAllowedLcpElement(node)
      ? []
      : [`${file} (${lhr.finalDisplayedUrl ?? lhr.finalUrl}): LCP element is ${node?.selector ?? 'missing'} ${node?.snippet ?? ''}, expected the hero h1 or poster`];
  });
}

function main() {
  const root = fileURLToPath(new URL('../.lighthouseci', import.meta.url));
  const reports: { file: string; lhr: Lhr }[] = [];
  if (existsSync(root)) {
    for (const form of readdirSync(root)) {
      const dir = join(root, form);
      if (!statSync(dir).isDirectory()) continue;
      for (const name of readdirSync(dir)) {
        if (/(^lhr-.*|\.report)\.json$/.test(name)) reports.push({ file: `${form}/${name}`, lhr: JSON.parse(readFileSync(join(dir, name), 'utf8')) as Lhr });
      }
    }
  }
  const errors = assertReports(reports);
  for (const error of errors) console.error(`lhci:assert-lcp-element: ${error}`);
  if (errors.length > 0) process.exit(1);
  console.log(`lhci:assert-lcp-element: ${reports.length} reports, LCP is the hero h1 or poster in all of them`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
