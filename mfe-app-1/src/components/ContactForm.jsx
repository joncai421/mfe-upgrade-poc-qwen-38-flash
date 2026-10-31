import React from "react";
import { validateContact } from "../utils/validation";

export default class ContactForm extends React.Component {
  state = {
    values: { name: "", email: "" },
    errors: {},
    touched: {},
    submitted: false,
  };

  handleChange = (event) => {
    const { name, value } = event.target;
    this.setState((prev) => ({ values: { ...prev.values, [name]: value } }));
  };

  handleBlur = (event) => {
    const { name } = event.target;
    const errors = validateContact(this.state.values);
    this.setState((prev) => ({
      touched: { ...prev.touched, [name]: true },
      errors,
    }));
  };

  handleSubmit = (event) => {
    event.preventDefault();
    const errors = validateContact(this.state.values);
    // On explicit submit, every field is considered touched so errors surface.
    this.setState({ errors, submitted: true, touched: { name: true, email: true } });
    if (Object.keys(errors).length === 0) {
      // eslint-disable-next-line no-alert
      window.alert(`Thanks, ${this.state.values.name}!`);
    }
  };

  render() {
    const { values, errors, touched, submitted } = this.state;
    const showError = (field) => touched[field] && errors[field];
    const isValid = submitted && Object.keys(errors).length === 0;

    return (
      <form onSubmit={this.handleSubmit} className="border border-gray-200 rounded p-4" data-testid="contact-form" noValidate>
        <h4 className="app-subheading">Contact Form (local validation)</h4>
        <div className="mb-3">
          <label className="form-label" htmlFor="app1-name">
            Name
          </label>
          <input
            id="app1-name"
            name="name"
            type="text"
            className="form-input"
            value={values.name}
            onChange={this.handleChange}
            onBlur={this.handleBlur}
            data-testid="name-input"
          />
          {showError("name") ? (
            <p className="form-error" data-testid="name-error">
              {errors.name}
            </p>
          ) : null}
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="app1-email">
            Email
          </label>
          <input
            id="app1-email"
            name="email"
            type="email"
            className="form-input"
            value={values.email}
            onChange={this.handleChange}
            onBlur={this.handleBlur}
            data-testid="email-input"
          />
          {showError("email") ? (
            <p className="form-error" data-testid="email-error">
              {errors.email}
            </p>
          ) : null}
        </div>
        <button type="submit" className="btn-primary" data-testid="submit-btn">
          Submit
        </button>
        {isValid ? (
          <p className="text-green-700 text-sm mt-2" data-testid="form-success">
            Form submitted successfully.
          </p>
        ) : null}
      </form>
    );
  }
}
