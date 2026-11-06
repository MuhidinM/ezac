/**
 * The staff portal's type scale (ui-22): one set of classes for each level of
 * text, so a panel title, a wizard step heading and a form label read at the
 * same size wherever they appear. The page title (h1) lives in PageHeader.
 *
 *   section      h2 of a wizard step, the biggest heading inside a page
 *   panelTitle   h2 of a Panel; also sub-headings inside a step (h3)
 *   description  the sentence under a section or panel title
 *   label        a form field's label or a group's legend
 *   term         the small label above a value (DetailList <dt>)
 *   value        a value shown under a term
 *   hint / error the line under a form control
 */
export const typeScale = {
  section: "text-base font-semibold text-navy",
  panelTitle: "text-sm font-semibold text-navy",
  description: "text-sm text-black/60",
  label: "text-[13px] font-medium text-navy",
  term: "text-xs font-medium text-black/60",
  value: "text-sm text-navy",
  hint: "text-xs text-black/60",
  error: "text-xs text-rose-700",
} as const;
