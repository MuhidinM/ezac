import { redirect } from "next/navigation";

/** The breadcrumb links here; the section starts at prices. */
export default function ZakatIndexPage() {
  redirect("/dashboard/zakat/prices");
}
