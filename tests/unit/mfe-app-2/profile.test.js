import profileReducer, { initialState } from "../../../mfe-app-2/src/redux/profileReducer";
import { updateField, setErrors, saveProfile, reset } from "../../../mfe-app-2/src/redux/actions";
import { validateProfile } from "../../../mfe-app-2/src/utils/validation";

describe("mfe-app-2 profileReducer", () => {
  it("updates a single field", () => {
    const state = profileReducer(initialState, updateField("fullName", "Alice"));
    expect(state.form.fullName).toBe("Alice");
  });

  it("saves the profile and clears errors", () => {
    let state = profileReducer(initialState, setErrors({ fullName: "bad" }));
    state = profileReducer(state, saveProfile({ fullName: "Alice", email: "a@b.com" }));
    expect(state.saved.fullName).toBe("Alice");
    expect(state.errors).toEqual({});
  });

  it("resets", () => {
    const dirty = { form: { fullName: "X", email: "", age: "" }, saved: { z: 1 }, errors: { a: 1 } };
    expect(profileReducer(dirty, reset())).toEqual(initialState);
  });
});

describe("mfe-app-2 validateProfile", () => {
  it("requires a valid name and email, and non-negative integer age", () => {
    expect(validateProfile({ fullName: "A", email: "x", age: "-1" })).toEqual({
      fullName: expect.any(String),
      email: expect.any(String),
      age: expect.any(String),
    });
    expect(validateProfile({ fullName: "Alice", email: "a@b.com", age: "30" })).toEqual({});
    expect(validateProfile({ fullName: "Alice", email: "a@b.com", age: "" })).toEqual({});
  });
});
