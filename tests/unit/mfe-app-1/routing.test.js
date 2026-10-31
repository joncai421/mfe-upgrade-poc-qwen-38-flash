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

// react-router-dom stays on v5 in this branch, so local routing must behave exactly
// as it did on React 16 — the point of the regression comparison.
describe("mfe-app-1 local routing", () => {
  it("shows Home by default", () => {
    renderApp();
    expect(screen.getByTestId("counter")).toBeInTheDocument();
    expect(screen.queryByTestId("app1-details")).not.toBeInTheDocument();
  });

  it("navigates to Details and reflects the shared Redux store", async () => {
    renderApp();
    await userEvent.click(screen.getByText("Details"));
    expect(screen.getByTestId("app1-details")).toBeInTheDocument();
    expect(screen.getByTestId("details-value")).toHaveTextContent("Current count: 0");
  });

  it("keeps store state across its own route switch", async () => {
    renderApp();
    await userEvent.click(screen.getByTestId("increment-btn"));
    await userEvent.click(screen.getByTestId("increment-btn"));
    expect(screen.getByTestId("counter-value")).toHaveTextContent("2");
    await userEvent.click(screen.getByText("Details"));
    expect(screen.getByTestId("details-value")).toHaveTextContent("Current count: 2");
  });

  it("marks the active tab with the react-router v5 activeClassName", async () => {
    renderApp();
    const home = screen.getByRole("link", { name: "Home" });
    const details = screen.getByRole("link", { name: "Details" });
    expect(home.className).toContain("!bg-indigo-600");
    expect(details.className).not.toContain("!bg-indigo-600");
    await userEvent.click(details);
    expect(screen.getByRole("link", { name: "Details" }).className).toContain("!bg-indigo-600");
  });
});
