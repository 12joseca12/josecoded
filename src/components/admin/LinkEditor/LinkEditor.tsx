"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import { Link } from "@/components/ui/Link/Link";
import {
  type LinkEditorLabels,
  type LinkHandler,
  type LinkResult,
  type LinkRow,
  linksMax,
} from "@/types/admin-project-team";

import styles from "./LinkEditor.module.css";
import { LinkRowForm, type LinkValues } from "./LinkRowForm";

interface LinkEditorProps {
  projectId: string;
  links: LinkRow[];
  labels: LinkEditorLabels;
  handlers: { add: LinkHandler; update: LinkHandler; remove: LinkHandler; reorder: LinkHandler };
}

const empty: LinkValues = { name: "", url: "", usage: "" };

export function LinkEditor({ projectId, links, labels, handlers }: LinkEditorProps) {
  const announce = useAnnounce();
  const [editing, setEditing] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (focusKey === null) return;
    const [id, direction] = focusKey.split(":");
    const same = list.current?.querySelector<HTMLButtonElement>(`[data-move="${id}:${direction}"]`);
    const other = list.current?.querySelector<HTMLButtonElement>(
      `[data-move="${id}:${direction === "up" ? "down" : "up"}"]`,
    );
    (same?.disabled === false ? same : other)?.focus();
  }, [focusKey, links]);

  const run = (call: () => Promise<LinkResult>, success: string | null, after?: () => void) => {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const result = await call();
      if (result.status === "done") {
        if (success !== null) announce(success);
        after?.();
      } else if (result.status === "error") {
        setError(labels.errors[result.code]);
      } else {
        setError(labels.errors[result.field]);
      }
      setConfirming(null);
    });
  };

  const move = (index: number, delta: -1 | 1) => {
    const target = links[index];
    if (target === undefined) return;
    const ids = links.map((link) => link.id);
    ids.splice(index, 1);
    ids.splice(index + delta, 0, target.id);
    setFocusKey(`${target.id}:${delta === -1 ? "up" : "down"}`);
    run(() => handlers.reorder({ projectId, ids }), labels.moved.replace("{name}", target.name));
  };

  const atLimit = links.length >= linksMax;

  return (
    <section className={styles.editor} aria-label={labels.region}>
      <p className={styles.intro}>{labels.intro}</p>
      {links.length === 0 && editing !== "new" ? (
        <p className={styles.intro}>{labels.empty}</p>
      ) : null}
      <ol className={styles.list} ref={list}>
        {links.map((link, index) => (
          <li key={link.id} className={styles.item}>
            {editing === link.id ? (
              <LinkRowForm
                mode="edit"
                initial={{ name: link.name, url: link.url, usage: link.usage ?? "" }}
                labels={labels}
                submit={(values) => handlers.update({ id: link.id, ...values })}
                onDone={() => {
                  announce(labels.saved);
                  setEditing(null);
                }}
                onCancel={() => {
                  setEditing(null);
                }}
              />
            ) : (
              <>
                <div className={styles.main}>
                  <p className={styles.name}>{link.name}</p>
                  <Link href={link.url} external newTabLabel={labels.openNewTab}>
                    <span className={styles.url}>{link.url}</span>
                  </Link>
                  {link.usage !== null ? <p className={styles.usage}>{link.usage}</p> : null}
                </div>
                <div className={styles.controls}>
                  <button
                    type="button"
                    className={styles.step}
                    data-move={`${link.id}:up`}
                    disabled={pending || index === 0}
                    aria-label={labels.up.replace("{name}", link.name)}
                    onClick={() => {
                      move(index, -1);
                    }}
                  >
                    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                      <path d="M5 12l5-5 5 5" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={styles.step}
                    data-move={`${link.id}:down`}
                    disabled={pending || index === links.length - 1}
                    aria-label={labels.down.replace("{name}", link.name)}
                    onClick={() => {
                      move(index, 1);
                    }}
                  >
                    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                      <path d="M5 8l5 5 5-5" />
                    </svg>
                  </button>
                  <Button
                    variant="light"
                    size="sm"
                    disabled={pending}
                    aria-label={labels.editFor.replace("{name}", link.name)}
                    onClick={() => {
                      setError(null);
                      setEditing(link.id);
                    }}
                  >
                    {labels.edit}
                  </Button>
                  {confirming === link.id ? (
                    <div className={styles.confirm} role="group" aria-label={labels.delete}>
                      <p className={styles.usage}>{labels.deleteConfirm}</p>
                      <Button
                        variant="light"
                        size="sm"
                        loading={pending}
                        loadingLabel={labels.deleting}
                        onClick={() => {
                          run(
                            () => handlers.remove({ id: link.id }),
                            labels.deleted.replace("{name}", link.name),
                          );
                        }}
                      >
                        {labels.delete}
                      </Button>
                      <Button
                        variant="quiet"
                        size="sm"
                        disabled={pending}
                        onClick={() => {
                          setConfirming(null);
                        }}
                      >
                        {labels.cancel}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="quiet"
                      size="sm"
                      disabled={pending}
                      aria-label={labels.deleteFor.replace("{name}", link.name)}
                      onClick={() => {
                        setError(null);
                        setConfirming(link.id);
                      }}
                    >
                      {labels.delete}
                    </Button>
                  )}
                </div>
              </>
            )}
          </li>
        ))}
      </ol>
      {editing === "new" ? (
        <div className={styles.item}>
          <LinkRowForm
            mode="add"
            initial={empty}
            labels={labels}
            submit={(values) => handlers.add({ projectId, ...values })}
            onDone={() => {
              announce(labels.saved);
              setEditing(null);
            }}
            onCancel={() => {
              setEditing(null);
            }}
          />
        </div>
      ) : atLimit ? (
        <p className={styles.intro}>{labels.limit}</p>
      ) : (
        <div className={styles.actions}>
          <Button
            variant="light"
            onClick={() => {
              setError(null);
              setEditing("new");
            }}
          >
            {labels.add}
          </Button>
        </div>
      )}
      <p className={styles.feedback} role="alert">
        {error}
      </p>
    </section>
  );
}
