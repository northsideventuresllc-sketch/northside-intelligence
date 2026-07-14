/** Extract tool slug from report ids like `report-90d-{slug}-{YYYY-MM-DD}`. */
export function parseReportToolSlug(reportId: string): string {
  const ninety = reportId.match(/^report-90d-(.+)-(\d{4}-\d{2}-\d{2})$/);
  if (ninety) return ninety[1];

  const trial = reportId.match(/^report-trial-(.+)-(\d{4}-\d{2}-\d{2})$/);
  if (trial) return trial[1];

  const revival = reportId.match(/^revival-(.+)-(\d{4}-\d{2})$/);
  if (revival) return revival[1];

  return reportId;
}
