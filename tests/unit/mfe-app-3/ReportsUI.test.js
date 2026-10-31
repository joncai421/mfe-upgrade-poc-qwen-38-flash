import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { makeStore } from "../../../mfe-app-3/src/redux/store";
import App from "../../../mfe-app-3/src/App";

function renderApp() {
  const store = makeStore();
  render(
    <Provider store={store}>
      <App />
    </Provider>
  );
  return store;
}

describe("mfe-app-3 report filtering UI", () => {
  it("shows all reports initially", () => {
    renderApp();
    expect(screen.getByTestId("report-count")).toHaveTextContent("Showing 7 reports");
  });

  it("narrows results when status changes", () => {
    renderApp();
    userEvent.selectOptions(screen.getByTestId("status-select"), "approved");
    expect(screen.getByTestId("report-count")).toHaveTextContent("Showing 3 reports");
    expect(screen.getByTestId("report-item-1")).toBeInTheDocument();
    expect(screen.queryByTestId("report-item-2")).not.toBeInTheDocument();
  });

  it("narrows results when the search query changes", () => {
    renderApp();
    userEvent.type(screen.getByTestId("query-input"), "revenue");
    expect(screen.getByTestId("report-count")).toHaveTextContent("Showing 1 report");
  });

  it("clears filters back to the full list", () => {
    renderApp();
    userEvent.selectOptions(screen.getByTestId("status-select"), "rejected");
    userEvent.click(screen.getByTestId("clear-filters-btn"));
    expect(screen.getByTestId("report-count")).toHaveTextContent("Showing 7 reports");
  });
});
