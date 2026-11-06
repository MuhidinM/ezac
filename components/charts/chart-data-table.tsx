/**
 * A chart's numbers as a plain table behind "Show the numbers", so every
 * value can be read without a mouse, by screen readers and for copying.
 */
export function ChartDataTable({
  caption,
  columns,
  rows,
}: {
  /** What the chart shows; the table's caption for screen readers. */
  caption: string;
  /** Header cells; the first names the row label column. */
  columns: string[];
  /** One row per category or period, already formatted. */
  rows: string[][];
}) {
  return (
    <details className="group text-xs">
      <summary className="inline-flex cursor-pointer items-center gap-1 rounded text-black/60 select-none hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <span className="group-open:hidden">Show the numbers</span>
        <span className="hidden group-open:inline">Hide the numbers</span>
      </summary>
      <div className="mt-2 max-h-64 overflow-auto rounded-md border border-black/[0.06]">
        <table className="w-full text-left tabular-nums">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-black/[0.06]">
              {columns.map((column, index) => (
                <th
                  key={column}
                  scope="col"
                  className={index === 0 ? "px-3 py-2 font-medium text-black/60" : "px-3 py-2 text-right font-medium text-black/60"}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-black/[0.04] last:border-0">
                {row.map((cell, index) =>
                  index === 0 ? (
                    <th key={index} scope="row" className="px-3 py-1.5 font-normal text-black/65">
                      {cell}
                    </th>
                  ) : (
                    <td key={index} className="px-3 py-1.5 text-right text-navy">
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
