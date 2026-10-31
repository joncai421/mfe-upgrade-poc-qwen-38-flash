import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContactForm from "../../../mfe-app-1/src/components/ContactForm";

describe("mfe-app-1 ContactForm (React 19)", () => {
  it("shows validation errors on blur with invalid data", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    await user.type(screen.getByTestId("name-input"), "A");
    await user.tab();
    await user.type(screen.getByTestId("email-input"), "bad");
    await user.tab();
    expect(screen.getByTestId("name-error")).toBeInTheDocument();
    expect(screen.getByTestId("email-error")).toBeInTheDocument();
  });

  it("submits successfully with valid data", async () => {
    global.window.alert = jest.fn();
    const user = userEvent.setup();
    render(<ContactForm />);
    await user.type(screen.getByTestId("name-input"), "Alice");
    await user.type(screen.getByTestId("email-input"), "alice@example.com");
    await user.click(screen.getByTestId("submit-btn"));
    expect(screen.getByTestId("form-success")).toBeInTheDocument();
    expect(global.window.alert).toHaveBeenCalled();
  });
});
