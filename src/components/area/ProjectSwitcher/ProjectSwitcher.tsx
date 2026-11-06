import NextLink from "next/link";

import { activeProjectParam, type AreaProject } from "@/types/area";

import styles from "./ProjectSwitcher.module.css";

interface ProjectSwitcherProps {
  projects: AreaProject[];
  activeId: string;
  path: string;
  label: string;
}

export function ProjectSwitcher({ projects, activeId, path, label }: ProjectSwitcherProps) {
  if (projects.length < 2) return null;
  return (
    <nav aria-label={label}>
      <ul className={styles.list}>
        {projects.map((project) => (
          <li key={project.id}>
            <NextLink
              className={styles.link}
              href={`${path}?${activeProjectParam}=${project.id}`}
              aria-current={project.id === activeId ? "page" : undefined}
            >
              {project.name}
            </NextLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
