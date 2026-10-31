import React from "react";
import { connect } from "react-redux";
import { setStatus, setQuery, clearFilters } from "../redux/actions";
import { STATUS_OPTIONS } from "../data/reports";

function ReportFilter({ status, query, setStatus, setQuery, clearFilters }) {
  return (
    <div className="mb-4 flex items-end gap-3 flex-wrap" data-testid="report-filter">
      <div>
        <label className="form-label" htmlFor="app3-status">
          Status
        </label>
        <select
          id="app3-status"
          className="form-input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          data-testid="status-select"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 min-w-40">
        <label className="form-label" htmlFor="app3-query">
          Search title
        </label>
        <input
          id="app3-query"
          type="text"
          className="form-input"
          value={query}
          placeholder="e.g. revenue"
          onChange={(e) => setQuery(e.target.value)}
          data-testid="query-input"
        />
      </div>
      <button className="btn-secondary" onClick={clearFilters} data-testid="clear-filters-btn">
        Clear filters
      </button>
    </div>
  );
}

const mapStateToProps = (state) => ({
  status: state.reports.status,
  query: state.reports.query,
});

const mapDispatchToProps = { setStatus, setQuery, clearFilters };

export default connect(mapStateToProps, mapDispatchToProps)(ReportFilter);
