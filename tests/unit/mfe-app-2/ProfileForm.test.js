import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { makeStore } from "../../../mfe-app-2/src/redux/store";
import ProfileForm from "../../../mfe-app-2/src/components/ProfileForm";

function renderForm() {
  const store = makeStore();
  render(
    <Provider store={store}>
      <ProfileForm />
    </Provider>
  );
  return store;
}

describe("mfe-app-2 ProfileForm", () => {
  it("shows validation errors when saving invalid input", () => {
    renderForm();
    userEvent.type(screen.getByTestId("fullName-input"), "A");
    userEvent.click(screen.getByTestId("save-btn"));
    expect(screen.getByTestId("fullName-error")).toBeInTheDocument();
    expect(screen.getByTestId("email-error")).toBeInTheDocument();
    expect(screen.queryByTestId("saved-profile")).not.toBeInTheDocument();
  });

  it("saves a valid profile into Redux state", () => {
    const store = renderForm();
    userEvent.type(screen.getByTestId("fullName-input"), "Alice Smith");
    userEvent.type(screen.getByTestId("email-input"), "alice@example.com");
    userEvent.type(screen.getByTestId("age-input"), "30");
    userEvent.click(screen.getByTestId("save-btn"));
    expect(screen.getByTestId("saved-profile")).toBeInTheDocument();
    expect(store.getState().profile.saved.fullName).toBe("Alice Smith");
  });
});
