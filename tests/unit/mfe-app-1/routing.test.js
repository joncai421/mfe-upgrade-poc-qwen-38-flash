import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { makeStore } from "../../../mfe-app-1/src/redux/store";
import App from "../../../mfe-app-1/src/App";

function renderApp() {
  const store = makeStore();
  render(
    <Provider store={store}>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </Provider>
  );
  return store;
}

describe("mfe-app-1 local routing", () => {
  it("shows Home by default", () => {
    renderApp();
    expect(screen.getByTestId("counter")).toBeInTheDocument();
    expect(screen.queryByTestId("app1-details")).not.toBeInTheDocument();
  });

  it("navigates to Details and reflects the shared Redux store", () => {
    const store = renderApp();
    store.getState(); // sanity
    userEvent.click(screen.getByText("Details"));
    expect(screen.getByTestId("app1-details")).toBeInTheDocument();
    expect(screen.getByTestId("details-value")).toHaveTextContent("Current count: 0");
  });
});
