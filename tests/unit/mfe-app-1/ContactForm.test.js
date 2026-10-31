import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContactForm from "../../../mfe-app-1/src/components/ContactForm";

// ContactForm is a class component: React 19 keeps class support, but it drops
// function-component defaultProps — this form uses neither, so no code change was
// needed beyond the automatic JSX runtime.
describe("mfe-app-1 ContactForm", () => {
  it("shows validation errors on blur with invalid data", async () => {
    render(<ContactForm />);
    await userEvent.type(screen.getByTestId("name-input"), "A");
    await userEvent.tab();
    await userEvent.type(screen.getByTestId("email-input"), "bad");
    await userEvent.tab();
    expect(screen.getByTestId("name-error")).toBeInTheDocument();
    expect(screen.getByTestId("email-error")).toBeInTheDocument();
  });

  it("submits successfully with valid data", async () => {
    const alert = jest.spyOn(window, "alert").mockImplementation(() => {});
    render(<ContactForm />);
    await userEvent.type(screen.getByTestId("name-input"), "Alice");
    await userEvent.type(screen.getByTestId("email-input"), "alice@example.com");
    await userEvent.click(screen.getByTestId("submit-btn"));
    expect(screen.getByTestId("form-success")).toBeInTheDocument();
    expect(alert).toHaveBeenCalledWith("Thanks, Alice!");
    alert.mockRestore();
  });
});
