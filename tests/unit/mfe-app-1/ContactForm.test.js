import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContactForm from "../../../mfe-app-1/src/components/ContactForm";

describe("mfe-app-1 ContactForm", () => {
  it("shows validation errors on blur with invalid data", () => {
    render(<ContactForm />);
    userEvent.type(screen.getByTestId("name-input"), "A");
    userEvent.tab();
    userEvent.type(screen.getByTestId("email-input"), "bad");
    userEvent.tab();
    expect(screen.getByTestId("name-error")).toBeInTheDocument();
    expect(screen.getByTestId("email-error")).toBeInTheDocument();
  });

  it("submits successfully with valid data", () => {
    global.window.alert = jest.fn();
    render(<ContactForm />);
    userEvent.type(screen.getByTestId("name-input"), "Alice");
    userEvent.type(screen.getByTestId("email-input"), "alice@example.com");
    userEvent.click(screen.getByTestId("submit-btn"));
    expect(screen.getByTestId("form-success")).toBeInTheDocument();
    expect(global.window.alert).toHaveBeenCalled();
  });
});
