// Pure profile validation — unit tested independently.
export function validateProfile(values) {
  const errors = {};
  if (!values.fullName || values.fullName.trim().length < 2) {
    errors.fullName = "Full name must be at least 2 characters.";
  }
  if (!values.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "A valid email address is required.";
  }
  if (values.age !== "" && (!Number.isInteger(Number(values.age)) || Number(values.age) < 0)) {
    errors.age = "Age must be a non-negative number.";
  }
  return errors;
}
