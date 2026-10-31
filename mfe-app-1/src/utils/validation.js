// Pure form validation helper — unit tested independently of React.
export function validateContact(values) {
  const errors = {};
  if (!values.name || values.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters.";
  }
  if (!values.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "A valid email address is required.";
  }
  return errors;
}

export function isInitialValid(values) {
  return Object.keys(validateContact(values)).length === 0;
}
