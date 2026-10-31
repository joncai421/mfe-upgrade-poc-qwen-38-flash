import React from "react";
import { connect } from "react-redux";
import { selectFilteredReports } from "../redux/selectors";

function statusBadge(status) {
  const map = {
    approved: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    rejected: "bg-red-100 text-red-800",
  };
  return map[status] || "bg-gray-100 text-gray-800";
}

function ReportList({ reports }) {
  return (
    <div data-testid="report-list">
      <p className="text-sm text-gray-600 mb-2" data-testid="report-count">
        Showing {reports.length} report{reports.length === 1 ? "" : "s"}
      </p>
      {reports.length === 0 ? (
        <p className="text-gray-500" data-testid="no-reports">
          No reports match the current filters.
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded">
          {reports.map((r) => (
            <li key={r.id} className="flex items-center justify-between px-3 py-2" data-testid={`report-item-${r.id}`}>
              <span className="text-sm text-gray-800">{r.title}</span>
              <span className={`text-xs px-2 py-1 rounded ${statusBadge(r.status)}`} data-testid={`report-status-${r.id}`}>
                {r.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const mapStateToProps = (state) => ({
  reports: selectFilteredReports(state),
});

export default connect(mapStateToProps)(ReportList);
