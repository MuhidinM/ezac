"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { RequireRole } from "@/components/dashboard/require-role";
import { FitrSeasonsPanel } from "@/components/zakat/settings/fitr-seasons-panel";
import { HomeFiguresPanel } from "@/components/zakat/settings/home-figures-panel";
import { PaymentSettingsPanel } from "@/components/zakat/settings/payment-settings-panel";

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
