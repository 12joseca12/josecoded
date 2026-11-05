"use client";

import { type KeyboardEvent, type Ref, useId, useState } from "react";

import { Button } from "@/components/ui/Button/Button";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden/VisuallyHidden";
import { type ChatLabels, chatMaxLength } from "@/types/chat";

import styles from "./ChatComposer.module.css";

type ComposerLabels = Pick<
  ChatLabels,
  "composerLabel" | "composerPlaceholder" | "send" | "sendingMessage" | "remaining"
>;

interface ChatComposerProps {
  labels: ComposerLabels;
  sending: boolean;
  disabled?: boolean;
  onSend: (body: string) => Promise<boolean>;
  onDraftingChange: (drafting: boolean) => void;
  inputRef?: Ref<HTMLTextAreaElement>;
}

const warnAt = 200;

function fit(node: HTMLTextAreaElement) {
  node.style.blockSize = "auto";
  node.style.blockSize = `${node.scrollHeight}px`;
}

export function ChatComposer({
  labels,
  sending,
  disabled = false,
  onSend,
  onDraftingChange,
  inputRef,
}: ChatComposerProps) {
  const inputId = useId();
  const counterId = useId();
  const [draft, setDraft] = useState("");
  const remaining = chatMaxLength - draft.length;
  const blocked = disabled || sending;

  const submit = async (field: HTMLTextAreaElement | null) => {
    const body = (field?.value ?? draft).trim();
    if (body === "" || blocked) return;
    const sent = await onSend(body);
    if (sent) {
      setDraft("");
      onDraftingChange(false);
      if (field) field.style.blockSize = "";
    }
    field?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    void submit(event.currentTarget);
  };

  return (
    <form
      className={styles.composer}
      onSubmit={(event) => {
        event.preventDefault();
        void submit(event.currentTarget.querySelector("textarea"));
      }}
    >
      <label htmlFor={inputId} className={styles.label}>
        <VisuallyHidden>{labels.composerLabel}</VisuallyHidden>
      </label>
      <textarea
        id={inputId}
        ref={inputRef}
        className={styles.input}
        rows={1}
        value={draft}
        maxLength={chatMaxLength}
        placeholder={labels.composerPlaceholder}
        enterKeyHint="send"
        autoComplete="off"
        aria-describedby={remaining <= warnAt ? counterId : undefined}
        disabled={disabled}
        onChange={(event) => {
          setDraft(event.target.value);
          fit(event.target);
          onDraftingChange(event.target.value.trim() !== "");
        }}
        onBlur={() => {
          onDraftingChange(false);
        }}
        onKeyDown={onKeyDown}
      />
      <Button
        type="submit"
        size="sm"
        icon={<ArrowIcon />}
        loading={sending}
        loadingLabel={labels.sendingMessage}
        disabled={disabled || draft.trim() === ""}
      >
        {labels.send}
      </Button>
      {remaining <= warnAt ? (
        <p id={counterId} className={styles.counter} data-low={remaining <= 0 || undefined}>
          {labels.remaining.replace("{count}", String(remaining))}
        </p>
      ) : null}
    </form>
  );
}
