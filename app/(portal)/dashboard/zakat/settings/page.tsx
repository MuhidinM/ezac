"use client";

import { type FormEvent, useState } from "react";
import { Pencil, Plus, QrCode, Save } from "lucide-react";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { DetailList, Panel } from "@/components/dashboard/panel";
import { ErrorAlert } from "@/components/dashboard/error-alert";
import { RequireRole } from "@/components/dashboard/require-role";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
import { staffRef } from "@/components/zakat/staff-ref";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage, fieldErrorMap } from "@/lib/api/errors";
import { useResource } from "@/lib/api/use-resource";
import { formatCount, formatDate, formatEtb } from "@/lib/backoffice/format";
import { formatDateTime } from "@/lib/beneficiary/format";
import { fixedCodeOnLiveBank, modeLabel, modeWarning, railMode } from "@/lib/zakat/payment-mode";
import { cleanReceivingAccount, receivingAccountProblem } from "@/lib/zakat/payments";

type HomeAdjustment = {
  offlineCollectedEtb: number;
  offlineBeneficiaries: number;
  note: string | null;
  createdBy?: string | null;
  /** Requested from the backend (§20); the id is shown until it comes. */
  createdByName?: string | null;
  createdAt?: string | null;
};

type PaymentSettings = {
  creditAccountNumber: string | null;
  creditAccountName: string | null;
  coopEnabled: boolean;
  minAmountEtb: number | null;
  maxAmountEtb: number | null;
  ready: boolean;
  /** "live" or "sandbox"; anything else (or nothing) is treated as test. */
  bankMode: string | null;
  defaultOtpEnabled: boolean;
  /** QR (EthQR): switched on; ready = switched on, account set and registered. */
  qrEnabled?: boolean;
  qrReady?: boolean;
  ethqrPuid?: string | null;
  ethqrMode?: string | null;
  updatedBy?: string | null;
  updatedByName?: string | null;
  updatedAt?: string | null;
};

type EthqrMerchant = {
  puid: string;
  merchantId?: string | null;
  globalMerchantId?: string | null;
  merchantName: string;
  accountNumber: string;
  registeredBy?: string | null;
  registeredAt?: string | null;
  qrEnabled: boolean;
  qrReady: boolean;
  mode: string | null;
};

type FitrSeason = {
  hijriYear: number;
  status: "upcoming" | "open" | "closed";
  startsOn: string;
  dueBy: string;
  perPersonAmountEtb: number;
  basis: string | null;
  updatedBy?: string | null;
  updatedAt?: string | null;
};

const SEASON_TONE: Record<FitrSeason["status"], BadgeTone> = { upcoming: "info", open: "success", closed: "neutral" };

export default function ZakatSettingsPage() {
  return (
    <RequireRole audience={["admin"]}>
      <section className="space-y-6">
        <PageHeader
          title="Zakat settings"
          description="Payment receiving account, the offline figures on the public home screen, and Zakat al-Fitr seasons."
        />
        <PaymentSettingsPanel />
        <HomeFiguresPanel />
        <FitrSeasonsPanel />
      </section>
    </RequireRole>
  );
}

function PaymentSettingsPanel() {
  const { data, error, mutate, reload } = useResource<PaymentSettings>("/bff/payments-admin/payment-settings");
  // Kept here: the form remounts after a save, so its own state is lost.
  const [notice, setNotice] = useState<string | null>(null);
  // Keyed on updatedAt so the form re-initialises after a save.
  return (
    <>
      <Panel
        title="Payment settings"
        description="Donors pay by QR code from any bank app into this commission account. Changes apply to new payments only."
        actions={
          data ? (
            data.qrReady && railMode(data.ethqrMode) === "test" ? (
              <Badge tone="warning">QR payments: test mode</Badge>
            ) : (
              <Badge tone={data.qrReady ? "success" : "warning"}>{data.qrReady ? "QR payments: ready" : "QR payments: not ready"}</Badge>
            )
          ) : null
        }
      >
        <ErrorAlert error={error} onRetry={reload} />
        {notice ? (
          <InlineAlert tone="success" className="mb-4">
            {notice}
          </InlineAlert>
        ) : null}
        {data ? (
          <PaymentSettingsForm
            key={data.updatedAt ?? "new"}
            settings={data}
            onEdit={() => setNotice(null)}
            onSaved={(saved) => {
              setNotice("Payment settings saved. They apply to new payments.");
              mutate(saved);
            }}
          />
        ) : null}
      </Panel>
      {/* Registering changes the settings (ethqrPuid, qrReady), so reload them. */}
      <EthqrPanel onRegistered={reload} />
    </>
  );
}

function PaymentSettingsForm({
  settings,
  onEdit,
  onSaved,
}: {
  settings: PaymentSettings;
  onEdit: () => void;
  onSaved: (settings: PaymentSettings) => void;
}) {
  const [account, setAccount] = useState(settings.creditAccountNumber ?? "");
  const [name, setName] = useState(settings.creditAccountName ?? "");
  // The old Coop account flow is kept off; it can only be switched off from here.
  const [enabled, setEnabled] = useState(settings.coopEnabled);
  const [confirmAccount, setConfirmAccount] = useState(false);
  const [qrEnabled, setQrEnabled] = useState(settings.qrEnabled ?? false);
  const accountChanged = (settings.creditAccountNumber ?? "") !== cleanReceivingAccount(account);
  const warning = modeWarning(settings, ["bank", "qr"]);
  const [min, setMin] = useState(settings.minAmountEtb != null ? String(settings.minAmountEtb) : "");
  const [max, setMax] = useState(settings.maxAmountEtb != null ? String(settings.maxAmountEtb) : "");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onEdit();
    setMessage(null);
    const accountProblem = receivingAccountProblem(account);
    const amountProblem = min.trim() && max.trim() && Number(min) > Number(max) ? "Must be at least the minimum payment." : null;
    if (accountProblem || amountProblem) {
      setFieldErrors({
        ...(accountProblem ? { creditAccountNumber: accountProblem } : {}),
        ...(amountProblem ? { maxAmountEtb: amountProblem } : {}),
      });
      return;
    }
    setFieldErrors({});
    // Donations are paid into this account, so a change is shown before and after first
    // (and, when registered, it clears the EthQR registration).
    if (accountChanged) {
      setConfirmAccount(true);
      return;
    }
    void save();
  }

  async function save() {
    setIsSaving(true);
    setMessage(null);
    setFieldErrors({});
    try {
      const saved = await apiClient<PaymentSettings>("/bff/payments-admin/payment-settings", {
        method: "PUT",
        body: JSON.stringify({
          creditAccountNumber: cleanReceivingAccount(account) || null,
          creditAccountName: name.trim() || null,
          coopEnabled: enabled,
          qrEnabled,
          minAmountEtb: min.trim() ? Number(min) : null,
          maxAmountEtb: max.trim() ? Number(max) : null,
        }),
      });
      onSaved(saved);
    } catch (saveError) {
      setMessage({ tone: "error", text: errorMessage(saveError, "Couldn't save payment settings") });
      if (saveError instanceof ApiError) setFieldErrors(fieldErrorMap(saveError.errors));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {warning.test ? (
        <InlineAlert tone="error" title="Test mode: no real money moves">
          <ul className="list-disc space-y-0.5 pl-4">
            {warning.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </InlineAlert>
      ) : null}
      {fixedCodeOnLiveBank(settings) ? (
        // Not dismissable: it stays until the server setting changes (gap-r1-2-3).
        <InlineAlert tone="error" title="Launch blocker: fixed test code with a live bank connection">
          The server accepts one fixed confirmation code instead of an SMS code, while the bank connection is live.{" "}
          {settings.coopEnabled
            ? "Anyone who knows the code can confirm an old Coop account payment. Switch off the old Coop account payments below now."
            : "The old Coop account payments that use it are switched off; keep them off."}{" "}
          The fixed code is a server setting: it must be switched off before launch. It can&apos;t be changed from this page.
        </InlineAlert>
      ) : settings.defaultOtpEnabled ? (
        <InlineAlert tone="warning" title="Test confirmation code in use">
          SMS isn&apos;t connected yet; the server accepts one fixed confirmation code. Don&apos;t treat payments as production.
        </InlineAlert>
      ) : null}
      {message ? <InlineAlert tone={message.tone}>{message.text}</InlineAlert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Receiving account number"
          htmlFor="ps-account"
          hint={
            accountChanged && settings.ethqrPuid
              ? "Changing it clears the EthQR registration: QR payments stop until the new account is registered."
              : "6–20 digits; required to switch payments on"
          }
          error={fieldErrors.creditAccountNumber}
        >
          <Input id="ps-account" inputMode="numeric" value={account} onChange={(e) => setAccount(e.target.value)} className="font-mono" />
        </FormField>
        <FormField label="Account name" htmlFor="ps-name" error={fieldErrors.creditAccountName}>
          <Input id="ps-name" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Minimum payment (ETB)" htmlFor="ps-min" error={fieldErrors.minAmountEtb}>
          <Input id="ps-min" type="number" min={0} value={min} onChange={(e) => setMin(e.target.value)} />
        </FormField>
        <FormField label="Maximum payment (ETB)" htmlFor="ps-max" error={fieldErrors.maxAmountEtb}>
          <Input id="ps-max" type="number" min={0} value={max} onChange={(e) => setMax(e.target.value)} />
        </FormField>
      </div>
      {settings.coopEnabled ? (
        <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-sm text-navy">
          <input type="checkbox" checked={!enabled} onChange={(e) => setEnabled(!e.target.checked)} className="mt-0.5 size-4 accent-brand" />
          <span>
            Switch off the old Coop account payments
            <span className="block text-xs text-black/60">They are still on. Donors should pay by QR; the old flow is being retired.</span>
          </span>
        </label>
      ) : (
        <p className="text-xs text-black/60">Old Coop account payments: switched off.</p>
      )}
      <label className="flex items-start gap-2 text-sm text-navy">
        <input
          type="checkbox"
          checked={qrEnabled}
          onChange={(e) => setQrEnabled(e.target.checked)}
          disabled={!settings.ethqrPuid && !qrEnabled}
          className="mt-0.5 size-4 accent-brand"
        />
        <span>
          Accept QR payments (EthQR)
          <span className="block text-xs text-black/60">
            {settings.ethqrPuid ? `Registered with EthQR (merchant ${settings.ethqrPuid}).` : "Register the account with EthQR below first."}
          </span>
        </span>
      </label>
      <div className="flex items-center justify-between border-t border-black/[0.06] pt-4">
        <p className="flex flex-wrap items-center gap-1 text-xs text-black/60">
          {settings.updatedAt ? <>Last changed {formatDateTime(settings.updatedAt)}</> : "Not configured yet"}
          {settings.updatedAt && (settings.updatedBy || settings.updatedByName) ? <>by {staffRef(settings.updatedBy, settings.updatedByName)}</> : null}
          <span>· Bank connection: {modeLabel(settings.bankMode)}</span>
        </p>
        <Button type="submit" loading={isSaving} loadingText="Saving…">
          <Save />
          Save
        </Button>
      </div>
      <ConfirmDialog
        open={confirmAccount}
        onOpenChange={setConfirmAccount}
        title="Change the commission account?"
        description={
          <>
            Donations are paid into this account from now on: <span className="font-mono">{settings.creditAccountNumber || "none"}</span> →{" "}
            <span className="font-mono">{cleanReceivingAccount(account) || "none"}</span>.{" "}
            {settings.ethqrPuid
              ? `This clears the EthQR registration (merchant ${settings.ethqrPuid}). QR payments stop until the new account is registered with EthQR.`
              : "Check the number with the bank statement before saving."}
          </>
        }
        confirmLabel="Change account"
        destructive
        onConfirm={save}
      />
    </form>
  );
}

function EthqrPanel({ onRegistered }: { onRegistered: () => void }) {
  const { data, error, mutate } = useResource<EthqrMerchant>("/bff/payments-admin/ethqr/merchant");
  const [open, setOpen] = useState(false);
  const notRegistered = !data && (error?.status === 404 || error?.status === 409);

  return (
    <Panel
      title="QR payments (EthQR)"
      description="Donors scan a QR code from any bank app and pay into the commission account. Register the account once, then switch QR payments on above."
      actions={
        <Button size="sm" variant={data ? "outline" : "default"} onClick={() => setOpen(true)}>
          <QrCode />
          {data ? "Register again" : "Register with EthQR"}
        </Button>
      }
    >
      {data && railMode(data.mode) === "test" ? (
        <InlineAlert tone="error" title="Test mode: no real money moves" className="mb-4">
          {data.mode === "sandbox"
            ? "EthQR is a sandbox: QR codes are fake and no money moves."
            : `EthQR's mode is ${modeLabel(data.mode)}, so QR payments are treated as a test.`}
        </InlineAlert>
      ) : null}
      {data ? (
        <DetailList
          columns={4}
          items={[
            { label: "Merchant id (PUID)", value: <span className="font-mono">{data.puid}</span> },
            { label: "Name on QR", value: data.merchantName },
            { label: "Account", value: <span className="font-mono">{data.accountNumber}</span> },
            { label: "Registered", value: formatDateTime(data.registeredAt ?? null) },
            { label: "Registered by", value: staffRef(data.registeredBy) },
            {
              label: "Status",
              value:
                data.qrReady && railMode(data.mode) === "test" ? (
                  <Badge tone="warning">Ready (test mode)</Badge>
                ) : (
                  <Badge tone={data.qrReady ? "success" : "warning"}>{data.qrReady ? "Ready" : data.qrEnabled ? "Switched on, not ready" : "Switched off"}</Badge>
                ),
            },
            { label: "Mode", value: modeLabel(data.mode) },
            { label: "Merchant id", value: data.merchantId ? <span className="font-mono text-xs">{data.merchantId}</span> : null },
          ]}
        />
      ) : notRegistered ? (
        <p className="text-sm text-black/60">The commission account isn&apos;t registered with EthQR yet.</p>
      ) : error ? (
        <ErrorAlert error={error} />
      ) : (
        <p className="text-sm text-black/60">Loading…</p>
      )}
      {open ? (
        <EthqrRegisterDialog
          onClose={() => setOpen(false)}
          onRegistered={(merchant) => {
            setOpen(false);
            mutate(merchant);
            onRegistered();
          }}
        />
      ) : null}
    </Panel>
  );
}

function EthqrRegisterDialog({ onClose, onRegistered }: { onClose: () => void; onRegistered: (merchant: EthqrMerchant) => void }) {
  const [form, setForm] = useState({ phoneNumber: "", email: "", dbaName: "", businessType: "", city: "", region: "" });
  const [error, setError] = useState<{ text: string; ethqrCode?: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const set = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSaving(true);
    try {
      const optional = (value: string) => value.trim() || undefined;
      const merchant = await apiClient<EthqrMerchant>("/bff/payments-admin/ethqr/merchant", {
        method: "POST",
        body: JSON.stringify({
          phoneNumber: form.phoneNumber.trim(),
          email: form.email.trim(),
          dbaName: form.dbaName.trim(),
          businessType: optional(form.businessType),
          city: optional(form.city),
          region: optional(form.region),
        }),
      });
      onRegistered(merchant);
    } catch (saveError) {
      const details = saveError instanceof ApiError ? (saveError.data as { ethqrCode?: unknown } | null) : null;
      const code = details?.ethqrCode;
      setError({
        text: errorMessage(saveError, "Couldn't register with EthQR"),
        ethqrCode: typeof code === "string" || typeof code === "number" ? String(code) : undefined,
      });
      if (saveError instanceof ApiError) setFieldErrors(fieldErrorMap(saveError.errors));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-lg">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-navy">Register with EthQR</DialogTitle>
            <DialogDescription>
              Registers the commission account set above. Doing it again returns the same merchant.
            </DialogDescription>
          </DialogHeader>
          {error ? (
            <InlineAlert title={error.text}>
              {error.ethqrCode ? (
                <span className="block">
                  EthQR code: <span className="font-mono">{error.ethqrCode}</span>
                </span>
              ) : null}

            </InlineAlert>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Name on QR posters" htmlFor="eq-dba" required error={fieldErrors.dbaName} className="sm:col-span-2">
              <Input id="eq-dba" value={form.dbaName} onChange={(e) => set("dbaName", e.target.value)} placeholder="EZAC Zakat Fund" required />
            </FormField>
            <FormField label="Phone" htmlFor="eq-phone" required error={fieldErrors.phoneNumber}>
              <Input id="eq-phone" type="tel" value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} placeholder="+2519…" required />
            </FormField>
            <FormField label="Email" htmlFor="eq-email" required hint="Must be real: it becomes the EthQR merchant portal login" error={fieldErrors.email}>
              <Input id="eq-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
            </FormField>
            <FormField label="Business type" htmlFor="eq-type" error={fieldErrors.businessType}>
              <Input id="eq-type" value={form.businessType} onChange={(e) => set("businessType", e.target.value)} />
            </FormField>
            <FormField label="City" htmlFor="eq-city" error={fieldErrors.city}>
              <Input id="eq-city" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Addis Ababa" />
            </FormField>
            <FormField label="Region" htmlFor="eq-region" hint="e.g. ADDIS_ABABA" error={fieldErrors.region}>
              <Input id="eq-region" value={form.region} onChange={(e) => set("region", e.target.value)} />
            </FormField>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving} loadingText="Registering…">
              Register
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function HomeFiguresPanel() {
  const { data, error, mutate, reload } = useResource<HomeAdjustment>("/bff/zakat-admin/home/adjustment");
  // Kept here: the form remounts after a save, so its own state is lost.
  const [notice, setNotice] = useState<string | null>(null);
  return (
    <Panel
      title="Home figures (offline)"
      description="Collections and households from outside the app (cash, history before the app). Added to the live totals on the public home screen within about a minute. Saving replaces the previous values."
    >
      <ErrorAlert error={error} onRetry={reload} />
      {notice ? (
        <InlineAlert tone="success" className="mb-4">
          {notice}
        </InlineAlert>
      ) : null}
      {data ? (
        <HomeFiguresForm
          key={data.createdAt ?? "new"}
          adjustment={data}
          onEdit={() => setNotice(null)}
          onSaved={(saved) => {
            setNotice("Home figures saved. The public home screen shows them within about a minute.");
            mutate(saved);
          }}
        />
      ) : null}
    </Panel>
  );
}

function HomeFiguresForm({
  adjustment,
  onEdit,
  onSaved,
}: {
  adjustment: HomeAdjustment;
  onEdit: () => void;
  onSaved: (value: HomeAdjustment) => void;
}) {
  const [collected, setCollected] = useState(String(adjustment.offlineCollectedEtb ?? 0));
  const [households, setHouseholds] = useState(String(adjustment.offlineBeneficiaries ?? 0));
  // A fresh note for each change: where the new figures come from.
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [householdsError, setHouseholdsError] = useState<string | undefined>();
  const [noteError, setNoteError] = useState<string | undefined>();
  const [confirming, setConfirming] = useState(false);
  const nextCollected = Number(collected || 0);
  const nextHouseholds = Number(households || 0);
  const changed = nextCollected !== (adjustment.offlineCollectedEtb ?? 0) || nextHouseholds !== (adjustment.offlineBeneficiaries ?? 0);

  // These figures go public, so a save first shows the change and needs a source (gap-r1-3-2).
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onEdit();
    setError(null);
    const householdsProblem = households.trim() && !Number.isInteger(Number(households)) ? "Enter a whole number of households." : undefined;
    const noteProblem = note.trim().length < 10 ? "Say where these figures come from (at least 10 characters)." : undefined;
    setHouseholdsError(householdsProblem);
    setNoteError(noteProblem);
    if (householdsProblem || noteProblem) return;
    setConfirming(true);
  }

  async function save() {
    try {
      onSaved(
        await apiClient<HomeAdjustment>("/bff/zakat-admin/home/adjustment", {
          method: "PUT",
          body: JSON.stringify({
            offlineCollectedEtb: nextCollected,
            offlineBeneficiaries: nextHouseholds,
            note: note.trim(),
          }),
        }),
      );
    } catch (saveError) {
      // Shown on the form once the confirm step closes.
      setError(errorMessage(saveError, "Couldn't save the figures"));
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <InlineAlert>{error}</InlineAlert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Collected offline (ETB)" htmlFor="hf-collected" required>
          <Input id="hf-collected" type="number" min={0} step="0.01" value={collected} onChange={(e) => setCollected(e.target.value)} required className="tabular-nums" />
        </FormField>
        <FormField label="Households supported offline" htmlFor="hf-households" error={householdsError}>
          <Input id="hf-households" type="number" min={0} step={1} value={households} onChange={(e) => setHouseholds(e.target.value)} className="tabular-nums" />
        </FormField>
      </div>
      <FormField
        label="Source of these figures"
        htmlFor="hf-note"
        required
        hint="Where the new figures come from, e.g. the report or ledger and its date"
        error={noteError}
      >
        <Textarea id="hf-note" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
      </FormField>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-4">
        <div className="space-y-0.5 text-xs text-black/60">
          {adjustment.createdAt ? (
            <>
              <p className="flex flex-wrap items-center gap-1">
                Currently {formatEtb(adjustment.offlineCollectedEtb)} and {formatCount(adjustment.offlineBeneficiaries)} households, set{" "}
                {formatDateTime(adjustment.createdAt)}
                {adjustment.createdBy || adjustment.createdByName ? <>by {staffRef(adjustment.createdBy, adjustment.createdByName)}</> : null}
              </p>
              {adjustment.note ? <p>Source given: {adjustment.note}</p> : null}
            </>
          ) : (
            <p>Not set yet</p>
          )}
        </div>
        <Button type="submit" disabled={!changed} title={changed ? undefined : "Change a figure first"}>
          <Save />
          Review and save
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Publish the new home figures?"
        description="The public home screen shows them within about a minute, added to the live totals. Saving replaces the previous values."
        confirmLabel="Publish figures"
        onConfirm={save}
      >
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm text-navy">
          <dt className="text-black/60">Collected offline</dt>
          <dd className="tabular-nums">
            {formatEtb(adjustment.offlineCollectedEtb ?? 0)} → <strong>{formatEtb(nextCollected)}</strong>
          </dd>
          <dt className="text-black/60">Households</dt>
          <dd className="tabular-nums">
            {formatCount(adjustment.offlineBeneficiaries ?? 0)} → <strong>{formatCount(nextHouseholds)}</strong>
          </dd>
          <dt className="text-black/60">Source</dt>
          <dd className="break-words">{note.trim()}</dd>
        </dl>
      </ConfirmDialog>
    </form>
  );
}

function FitrSeasonsPanel() {
  const { data, error, reload } = useResource<FitrSeason[]>("/bff/zakat-admin/zakat-al-fitr");
  const [editing, setEditing] = useState<FitrSeason | "new" | null>(null);
  const seasons = data ?? [];

  return (
    <Panel
      title="Zakat al-Fitr seasons"
      description="One season per Hijri year. The app shows the open season, or the next upcoming one."
      flush
      actions={
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus />
          New season
        </Button>
      }
    >
      {error ? (
        <div className="px-5 pt-4">
          <ErrorAlert error={error} onRetry={reload} />
        </div>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow className="bg-black/[0.015]">
            <TableHead className="pl-5">Hijri year</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Window</TableHead>
            <TableHead className="text-right">Per person</TableHead>
            <TableHead>Basis</TableHead>
            <TableHead className="pr-5 text-right">
              <span className="sr-only">Edit</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!data && !error ? (
            <TableSkeletonRows colSpan={6} />
          ) : seasons.length === 0 ? (
            <TableMessageRow colSpan={6}>No seasons yet.</TableMessageRow>
          ) : (
            seasons.map((season) => (
              <TableRow key={season.hijriYear}>
                <TableCell className="pl-5 font-semibold text-navy tabular-nums">{season.hijriYear} AH</TableCell>
                <TableCell>
                  <Badge tone={SEASON_TONE[season.status] ?? "neutral"} className="capitalize">
                    {season.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {formatDate(season.startsOn)} – {formatDate(season.dueBy)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatEtb(season.perPersonAmountEtb)}</TableCell>
                <TableCell className="max-w-xs truncate text-sm text-black/60">{season.basis ?? "—"}</TableCell>
                <TableCell className="pr-5 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(season)}>
                    <Pencil />
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {editing ? (
        <FitrSeasonDialog
          key={editing === "new" ? "new" : editing.hijriYear}
          season={editing === "new" ? null : editing}
          seasons={seasons}
          onEditExisting={setEditing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      ) : null}
    </Panel>
  );
}

/** The Hijri (Umm al-Qura) year of a calendar day, or null when the browser can't tell. */
function hijriYearOf(day: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { year: "numeric", timeZone: "UTC" }).formatToParts(
      new Date(`${day}T00:00:00Z`),
    );
    const year = Number.parseInt(parts.find((part) => part.type === "year")?.value ?? "", 10);
    return Number.isFinite(year) ? year : null;
  } catch {
    return null;
  }
}

/** Things to double-check before saving a season; saving stays possible. */
function seasonWarnings(year: number, startsOn: string, dueBy: string, others: FitrSeason[]): string[] {
  const warnings: string[] = [];
  if (startsOn && dueBy) {
    for (const other of others) {
      if (other.startsOn <= dueBy && startsOn <= other.dueBy) {
        warnings.push(`The dates overlap the ${other.hijriYear} AH season (${formatDate(other.startsOn)} – ${formatDate(other.dueBy)}).`);
      }
    }
  }
  const startYear = startsOn ? hijriYearOf(startsOn) : null;
  const dueYear = dueBy ? hijriYearOf(dueBy) : null;
  if (Number.isInteger(year) && year > 0 && startYear !== null && startYear !== year && dueYear !== year) {
    warnings.push(`${formatDate(startsOn)} falls in ${startYear} AH, not ${year} AH. Check the year or the dates.`);
  }
  return warnings;
}

function FitrSeasonDialog({
  season,
  seasons,
  onEditExisting,
  onClose,
  onSaved,
}: {
  season: FitrSeason | null;
  seasons: FitrSeason[];
  onEditExisting: (season: FitrSeason) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [year, setYear] = useState(season ? String(season.hijriYear) : "");
  const [startsOn, setStartsOn] = useState(season?.startsOn ?? "");
  const [dueBy, setDueBy] = useState(season?.dueBy ?? "");
  const [amount, setAmount] = useState(season ? String(season.perPersonAmountEtb) : "");
  const [basis, setBasis] = useState(season?.basis ?? "");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const yearNumber = year.trim() ? Number(year.trim()) : Number.NaN;
  // Saving a year creates or replaces its season, so a new season must not reuse a year.
  const existing = season ? null : (seasons.find((item) => item.hijriYear === yearNumber) ?? null);
  const others = seasons.filter((item) => item.hijriYear !== (season?.hijriYear ?? yearNumber));
  const warnings = seasonWarnings(yearNumber, startsOn, dueBy, others);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const problems: Record<string, string> = {};
    if (!Number.isInteger(yearNumber) || yearNumber < 1400 || yearNumber > 1600) problems.hijriYear = "Enter a year from 1400 to 1600.";
    else if (existing) problems.hijriYear = `A season for ${existing.hijriYear} AH already exists. Edit it instead.`;
    if (startsOn && dueBy && dueBy < startsOn) problems.dueBy = "Must be on or after the start date.";
    setFieldErrors(problems);
    if (Object.keys(problems).length > 0) return;
    setIsSaving(true);
    try {
      await apiClient(`/bff/zakat-admin/zakat-al-fitr/${encodeURIComponent(year.trim())}`, {
        method: "PUT",
        body: JSON.stringify({ startsOn, dueBy, perPersonAmountEtb: Number(amount), basis: basis.trim() || undefined }),
      });
      onSaved();
    } catch (saveError) {
      setError(errorMessage(saveError, "Couldn't save the season"));
      if (saveError instanceof ApiError) setFieldErrors(fieldErrorMap(saveError.errors));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="max-w-lg">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-navy">{season ? `Zakat al-Fitr ${season.hijriYear} AH` : "New Zakat al-Fitr season"}</DialogTitle>
            <DialogDescription>The status (upcoming, open, closed) follows today&apos;s date.</DialogDescription>
          </DialogHeader>
          {error ? <InlineAlert>{error}</InlineAlert> : null}
          {existing ? (
            <InlineAlert
              tone="warning"
              title={`${existing.hijriYear} AH already has a season`}
              action={
                <Button type="button" size="sm" variant="outline" onClick={() => onEditExisting(existing)}>
                  Edit {existing.hijriYear} AH
                </Button>
              }
            >
              {formatEtb(existing.perPersonAmountEtb)} per person, {formatDate(existing.startsOn)} – {formatDate(existing.dueBy)}. Saving
              here would replace it.
            </InlineAlert>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Hijri year" htmlFor="fs-year" required hint="1400–1600" error={fieldErrors.hijriYear}>
              <Input id="fs-year" type="number" min={1400} max={1600} value={year} onChange={(e) => setYear(e.target.value)} disabled={!!season} required />
            </FormField>
            <FormField label="Per person (ETB)" htmlFor="fs-amount" required error={fieldErrors.perPersonAmountEtb}>
              <Input id="fs-amount" type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </FormField>
            <FormField label="Starts on" htmlFor="fs-start" required error={fieldErrors.startsOn}>
              <Input id="fs-start" type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} required />
            </FormField>
            <FormField label="Due by" htmlFor="fs-due" required hint="On or after the start" error={fieldErrors.dueBy}>
              <Input id="fs-due" type="date" value={dueBy} onChange={(e) => setDueBy(e.target.value)} required />
            </FormField>
          </div>
          <FormField label="Basis" htmlFor="fs-basis" hint="How the amount was set" error={fieldErrors.basis}>
            <Textarea id="fs-basis" rows={2} maxLength={500} value={basis} onChange={(e) => setBasis(e.target.value)} />
          </FormField>
          {warnings.length > 0 ? (
            <InlineAlert tone="warning" title="Check before saving">
              <ul className="list-disc space-y-0.5 pl-4">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </InlineAlert>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={existing !== null} loading={isSaving} loadingText="Saving…">
              {warnings.length > 0 ? "Save anyway" : "Save season"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
