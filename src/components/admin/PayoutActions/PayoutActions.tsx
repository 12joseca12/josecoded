"use client";

import { useRouter } from "next/navigation";
import { type SyntheticEvent, useState, useTransition } from "react";

import { ConfirmAction } from "@/components/admin/ConfirmAction/ConfirmAction";
import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import { ModalSheet } from "@/components/ui/ModalSheet/ModalSheet";
import type { PayoutStatus } from "@/types/money";
import type { PayoutActionHandler, PayoutActionResult, PayoutActionsLabels } from "@/types/payouts";

import form from "../admin-form.module.css";

interface PayoutActionsProps {
  id: string;
  status: PayoutStatus;
  netText: string;
  beneficiary: string;
  today: string;
  backHref: string;
  labels: PayoutActionsLabels;
  issue: PayoutActionHandler;
  pay: PayoutActionHandler;
  remove: PayoutActionHandler;
}

function failure(result: PayoutActionResult, labels: PayoutActionsLabels["pay"]): string {
  if (result.status === "done") return "";
  if (result.status === "invalid") return labels.errors[result.field];
  return labels.errors[result.code];
}

export function PayoutActions({
  id,
  status,
  netText,
  beneficiary,
  today,
  backHref,
  labels,
  issue,
  pay,
  remove,
}: PayoutActionsProps) {
  const announce = useAnnounce();
  const router = useRouter();
  const [issuing, startIssuing] = useTransition();
  const [issueProblem, setIssueProblem] = useState("");
  const [open, setOpen] = useState(false);
  const [paidAt, setPaidAt] = useState(today);
  const [reference, setReference] = useState("");
  const [payProblem, setPayProblem] = useState("");
  const [saving, startSaving] = useTransition();

  const onIssue = () => {
    if (issuing) return;
    setIssueProblem("");
    startIssuing(async () => {
      const result = await issue({ id });
      if (result.status === "done") {
        announce(labels.issueDone);
        return;
      }
      setIssueProblem(
        result.status === "failed" ? labels.errors[result.code] : labels.errors.error,
      );
    });
  };

  const onPay = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setPayProblem("");
    startSaving(async () => {
      const result = await pay({ id, paidAt, reference });
      const problem = failure(result, labels.pay);
      setPayProblem(problem);
      if (problem === "") {
        announce(labels.pay.done);
        setOpen(false);
      }
    });
  };

  if (status === "paid") return null;

  return (
    <div className={form.templates}>
      {status === "draft" ? (
        <>
          <Button
            variant="primary"
            loading={issuing}
            loadingLabel={labels.issueSaving}
            onClick={onIssue}
          >
            {labels.issue}
          </Button>
          <ConfirmAction
            triggerText={labels.deleteDraft}
            triggerAria={labels.deleteDraft}
            title={labels.deleteConfirm.title}
            text={labels.deleteConfirm.text}
            submitLabel={labels.deleteConfirm.submit}
            savingLabel={labels.deleteConfirm.saving}
            closeLabel={labels.deleteConfirm.close}
            doneMessage={labels.deleteConfirm.done}
            errors={labels.errors}
            run={async () => {
              const result = await remove({ id });
              if (result.status === "done") {
                router.push(backHref);
                return result;
              }
              return {
                status: "failed",
                code: result.status === "failed" ? result.code : "error",
              };
            }}
          />
        </>
      ) : (
        <>
          <Button
            variant="primary"
            onClick={() => {
              setPaidAt(today);
              setReference("");
              setPayProblem("");
              setOpen(true);
            }}
          >
            {labels.markPaid}
          </Button>
          <ModalSheet
            open={open}
            onClose={() => {
              setOpen(false);
            }}
            title={labels.pay.title}
            closeLabel={labels.pay.close}
          >
            <form className={form.form} onSubmit={onPay} noValidate>
              <p>{labels.pay.text.replace("{amount}", netText).replace("{name}", beneficiary)}</p>
              <Field
                name="paidAt"
                type="date"
                label={labels.pay.date}
                max={today}
                value={paidAt}
                onChange={(event) => {
                  setPaidAt(event.target.value);
                }}
                error={payProblem === labels.pay.errors.date ? payProblem : undefined}
              />
              <Field
                name="reference"
                label={labels.pay.reference}
                maxLength={200}
                autoComplete="off"
                value={reference}
                onChange={(event) => {
                  setReference(event.target.value);
                }}
                error={payProblem === labels.pay.errors.reference ? payProblem : undefined}
              />
              <p
                className={form.feedback}
                data-tone="error"
                role="alert"
                hidden={
                  payProblem === "" ||
                  payProblem === labels.pay.errors.date ||
                  payProblem === labels.pay.errors.reference
                }
              >
                {payProblem === labels.pay.errors.date || payProblem === labels.pay.errors.reference
                  ? ""
                  : payProblem}
              </p>
              <div className={form.actions}>
                <Button
                  type="submit"
                  variant="primary"
                  loading={saving}
                  loadingLabel={labels.pay.saving}
                >
                  {labels.pay.submit}
                </Button>
              </div>
            </form>
          </ModalSheet>
        </>
      )}
      <p className={form.feedback} data-tone="error" role="alert" hidden={issueProblem === ""}>
        {issueProblem}
      </p>
    </div>
  );
}
