import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { makeStore } from "../../../mfe-app-1/src/redux/store";
import Counter from "../../../mfe-app-1/src/components/Counter";

function renderCounter() {
  const store = makeStore();
  render(
    <Provider store={store}>
      <Counter />
    </Provider>
  );
  return store;
}

describe("mfe-app-1 Counter component", () => {
  it("renders initial count 0", () => {
    renderCounter();
    expect(screen.getByTestId("counter-value")).toHaveTextContent("0");
  });

  it("increments and decrements through Redux", () => {
    renderCounter();
    userEvent.click(screen.getByTestId("increment-btn"));
    userEvent.click(screen.getByTestId("increment-btn"));
    expect(screen.getByTestId("counter-value")).toHaveTextContent("2");
    userEvent.click(screen.getByTestId("decrement-btn"));
    expect(screen.getByTestId("counter-value")).toHaveTextContent("1");
  });

  it("honours the step value", () => {
    renderCounter();
    userEvent.clear(screen.getByTestId("step-input"));
    userEvent.type(screen.getByTestId("step-input"), "5");
    userEvent.click(screen.getByTestId("increment-btn"));
    expect(screen.getByTestId("counter-value")).toHaveTextContent("5");
  });

  it("resets to zero", () => {
    renderCounter();
    userEvent.click(screen.getByTestId("increment-btn"));
    userEvent.click(screen.getByTestId("reset-btn"));
    expect(screen.getByTestId("counter-value")).toHaveTextContent("0");
  });
});
