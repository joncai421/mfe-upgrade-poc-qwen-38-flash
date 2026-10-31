import { REPORTS } from "../data/reports";

// Pure selector — unit tested independently of React/Redux.
export function selectReports(reports, { status, query }) {
  const q = (query || "").trim().toLowerCase();
  return reports.filter((r) => {
    const statusOk = status === "all" || r.status === status;
    const queryOk = q === "" || r.title.toLowerCase().includes(q);
    return statusOk && queryOk;
  });
}

export function selectFilteredReports(state) {
  return selectReports(REPORTS, state.reports);
}
