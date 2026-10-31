import reportsReducer, { initialState } from "../../../mfe-app-3/src/redux/reportsReducer";
import { setStatus, setQuery, clearFilters } from "../../../mfe-app-3/src/redux/actions";
import { selectReports } from "../../../mfe-app-3/src/redux/selectors";
import { REPORTS } from "../../../mfe-app-3/src/data/reports";

describe("mfe-app-3 reportsReducer", () => {
  it("updates status and query and clears filters", () => {
    let state = reportsReducer(initialState, setStatus("approved"));
    expect(state.status).toBe("approved");
    state = reportsReducer(state, setQuery("q1"));
    expect(state.query).toBe("q1");
    state = reportsReducer(state, clearFilters());
    expect(state).toEqual(initialState);
  });
});

describe("mfe-app-3 selectReports", () => {
  it("filters by status", () => {
    const result = selectReports(REPORTS, { status: "approved", query: "" });
    expect(result.length).toBe(3);
    expect(result.every((r) => r.status === "approved")).toBe(true);
  });

  it("filters by query (case-insensitive) combined with status", () => {
    const result = selectReports(REPORTS, { status: "all", query: "REVENUE" });
    expect(result.map((r) => r.title)).toEqual(["Q1 Revenue"]);
  });

  it("returns all for default filters", () => {
    expect(selectReports(REPORTS, { status: "all", query: "" })).toHaveLength(REPORTS.length);
  });
});
