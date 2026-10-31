import { validateContact } from "../../../mfe-app-1/src/utils/validation";

describe("mfe-app-1 validateContact", () => {
  it("requires a name of at least 2 characters", () => {
    expect(validateContact({ name: "A", email: "a@b.com" })).toHaveProperty("name");
    expect(validateContact({ name: "Alice", email: "a@b.com" })).not.toHaveProperty("name");
  });

  it("requires a valid email", () => {
    expect(validateContact({ name: "Alice", email: "not-an-email" })).toHaveProperty("email");
    expect(validateContact({ name: "Alice", email: "alice@example.com" })).toEqual({});
  });

  it("returns no errors for valid input", () => {
    expect(validateContact({ name: "Alice", email: "alice@example.com" })).toEqual({});
  });
});
