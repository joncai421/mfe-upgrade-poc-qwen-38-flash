import React from "react";
import ReportFilter from "./components/ReportFilter";
import ReportList from "./components/ReportList";

export default function App() {
  return (
    <div className="app-card" data-testid="app3-root">
      <h3 className="app-heading">MFE App 3 — Report Filtering</h3>
      <ReportFilter />
      <ReportList />
    </div>
  );
}
