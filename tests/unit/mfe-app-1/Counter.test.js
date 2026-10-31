import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { makeStore } from "../../../mfe-app-1/src/redux/store";
import Counter from "../../../mfe-app-1/src/components/Counter";

// React 19 / RTL 16 / user-event 14: interactions are async and must be awaited
// so React's concurrent renders are flushed before each assertion.
async function renderCounter() {
  const store = makeStore();
  const user = userEvent.setup();
  render(
    <Provider store={store}>
      <Counter />
    </Provider>
  );
  return { store, user };
}

describe("mfe-app-1 Counter component (React 19)", () => {
  it("renders initial count 0", async () => {
    await renderCounter();
    expect(screen.getByTestId("counter-value")).toHaveTextContent("0");
  });

  it("increments and decrements through Redux", async () => {
    const { user } = await renderCounter();
    await user.click(screen.getByTestId("increment-btn"));
    await user.click(screen.getByTestId("increment-btn"));
    expect(screen.getByTestId("counter-value")).toHaveTextContent("2");
    await user.click(screen.getByTestId("decrement-btn"));
    expect(screen.getByTestId("counter-value")).toHaveTextContent("1");
  });

  it("honours the step value", async () => {
    const { user } = await renderCounter();
    await user.clear(screen.getByTestId("step-input"));
    await user.type(screen.getByTestId("step-input"), "5");
    await user.click(screen.getByTestId("increment-btn"));
    expect(screen.getByTestId("counter-value")).toHaveTextContent("5");
  });

  it("resets to zero", async () => {
    const { user } = await renderCounter();
    await user.click(screen.getByTestId("increment-btn"));
    await user.click(screen.getByTestId("reset-btn"));
    expect(screen.getByTestId("counter-value")).toHaveTextContent("0");
  });
});
