export function pickProjects<T>(slugs: readonly string[], find: (slug: string) => T | undefined) {
  return slugs.flatMap((slug) => {
    const entry = find(slug);
    return entry ? [entry] : [];
  });
}
