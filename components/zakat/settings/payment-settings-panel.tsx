"use client";

import { type FormEvent, useState } from "react";
import { QrCode, RotateCw, Save } from "lucide-react";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { ErrorAlert } from "@/components/dashboard/error-alert";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { DetailList, Panel } from "@/components/dashboard/panel";
import { receivingAccountToSend } from "@/components/zakat/settings/logic";
import { staffRef } from "@/components/zakat/staff-ref";
import { Badge } from "@/components/ui/badge";
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
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage, fieldErrorMap, isVersionConflict, VERSION_CONFLICT_MESSAGE } from "@/lib/api/errors";
import { useResource } from "@/lib/api/use-resource";
import { formatDateTime } from "@/lib/beneficiary/format";
import { fixedCodeOnLiveBank, modeLabel, modeWarning, railMode } from "@/lib/zakat/payment-mode";

const SETTINGS = "/bff/payments-admin/payment-settings";

type PaymentSettings = {
  /** Last 4 digits only, e.g. "*********7357". Sent back as is, it keeps the stored account. */
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
  /** The settings' own version (fund accounts have another); a stale one gives 409 VERSION_CONFLICT. */
  version?: number;
};

type EthqrMerchant = {
  puid: string;
  merchantId?: string | null;
  globalMerchantId?: string | null;
  merchantName: string;
  /** Last 4 digits only. */
  accountNumber: string;
  registeredBy?: string | null;
  registeredAt?: string | null;
  qrEnabled: boolean;
  qrReady: boolean;
  mode: string | null;
};

export function PaymentSettingsPanel() {
  const { data, error, mutate, reload } = useResource<PaymentSettings>(SETTINGS);
  // Kept here: the form remounts after a save, so its own state is lost.
  const [notice, setNotice] = useState<string | null>(null);
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
            // Re-initialised after a save or a reload.
            key={`${data.version ?? ""}-${data.updatedAt ?? "new"}`}
            settings={data}
            onEdit={() => setNotice(null)}
            onReload={reload}
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
  onReload,
  onSaved,
}: {
  settings: PaymentSettings;
  onEdit: () => void;
  onReload: () => void;
  onSaved: (settings: PaymentSettings) => void;
}) {
  const [account, setAccount] = useState(settings.creditAccountNumber ?? "");
  const [name, setName] = useState(settings.creditAccountName ?? "");
  // The old Coop account flow is kept off; it can only be switched off from here.
  const [enabled, setEnabled] = useState(settings.coopEnabled);
  const [confirmAccount, setConfirmAccount] = useState(false);
  const [qrEnabled, setQrEnabled] = useState(settings.qrEnabled ?? false);
  const accountToSend = receivingAccountToSend(account, settings.creditAccountNumber);
  const warning = modeWarning(settings, ["bank", "qr"]);
  const [min, setMin] = useState(settings.minAmountEtb != null ? String(settings.minAmountEtb) : "");
  const [max, setMax] = useState(settings.maxAmountEtb != null ? String(settings.maxAmountEtb) : "");
  const [message, setMessage] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onEdit();
    setMessage(null);
    const amountProblem = min.trim() && max.trim() && Number(min) > Number(max) ? "Must be at least the minimum payment." : null;
    if (accountToSend.problem || amountProblem) {
      setFieldErrors({
        ...(accountToSend.problem ? { creditAccountNumber: accountToSend.problem } : {}),
        ...(amountProblem ? { maxAmountEtb: amountProblem } : {}),
      });
      return;
    }
    setFieldErrors({});
    // Donations are paid into this account, so a change is shown before and after first
    // (and, when registered, it clears the EthQR registration).
    if (accountToSend.changed) {
      setConfirmAccount(true);
      return;
    }
    void save();
  }

  async function save() {
    setIsSaving(true);
    setMessage(null);
    setConflict(false);
    setFieldErrors({});
    try {
      const saved = await apiClient<PaymentSettings>(SETTINGS, {
        method: "PUT",
        body: JSON.stringify({
          creditAccountNumber: accountToSend.value,
          creditAccountName: name.trim() || null,
          coopEnabled: enabled,
          qrEnabled,
          minAmountEtb: min.trim() ? Number(min) : null,
          maxAmountEtb: max.trim() ? Number(max) : null,
          ...(settings.version != null ? { version: settings.version } : {}),
        }),
      });
      onSaved(saved);
    } catch (saveError) {
      if (isVersionConflict(saveError)) {
        setConflict(true);
      } else {
        setMessage(errorMessage(saveError, "Couldn't save payment settings"));
        if (saveError instanceof ApiError) setFieldErrors(fieldErrorMap(saveError.errors));
      }
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
      {conflict ? (
        <InlineAlert
          tone="error"
          action={
            <Button type="button" variant="outline" size="sm" onClick={onReload}>
              <RotateCw />
              Reload
            </Button>
          }
        >
          {VERSION_CONFLICT_MESSAGE}
        </InlineAlert>
      ) : null}
      {message ? <InlineAlert tone="error">{message}</InlineAlert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Receiving account number"
          htmlFor="ps-account"
          hint={
            accountToSend.changed && settings.ethqrPuid
              ? "Changing it clears the EthQR registration: QR payments stop until the new account is registered."
              : settings.creditAccountNumber
                ? "Shown by its last 4 digits. Leave it as it is to keep the account, or type a new number (6–20 digits)."
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
            <span className="font-mono">{accountToSend.value || "none"}</span>.{" "}
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
