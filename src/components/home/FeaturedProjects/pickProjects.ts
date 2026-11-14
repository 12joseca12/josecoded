export function pickProjects<T>(
  slugs: readonly string[],
  find: (slug: string) => T | undefined,
  max = 3,
) {
  return slugs
    .flatMap((slug) => {
      const entry = find(slug);
      return entry ? [entry] : [];
    })
    .slice(0, max);
}
