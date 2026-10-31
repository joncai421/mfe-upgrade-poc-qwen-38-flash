import React from "react";
import { connect } from "react-redux";
import { updateField, saveProfile, setErrors, reset } from "../redux/actions";
import { validateProfile } from "../utils/validation";

class ProfileForm extends React.Component {
  handleChange = (event) => {
    const { name, value } = event.target;
    this.props.updateField(name, value);
  };

  handleSubmit = (event) => {
    event.preventDefault();
    const errors = validateProfile(this.props.form);
    this.props.setErrors(errors);
    if (Object.keys(errors).length === 0) {
      this.props.saveProfile(this.props.form);
    }
  };

  render() {
    const { form, errors, saved } = this.props;
    return (
      <form onSubmit={this.handleSubmit} data-testid="profile-form" noValidate>
        <div className="mb-3">
          <label className="form-label" htmlFor="app2-fullName">
            Full name
          </label>
          <input
            id="app2-fullName"
            name="fullName"
            type="text"
            className="form-input"
            value={form.fullName}
            onChange={this.handleChange}
            data-testid="fullName-input"
          />
          {errors.fullName ? (
            <p className="form-error" data-testid="fullName-error">
              {errors.fullName}
            </p>
          ) : null}
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="app2-email">
            Email
          </label>
          <input
            id="app2-email"
            name="email"
            type="email"
            className="form-input"
            value={form.email}
            onChange={this.handleChange}
            data-testid="email-input"
          />
          {errors.email ? (
            <p className="form-error" data-testid="email-error">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="app2-age">
            Age
          </label>
          <input
            id="app2-age"
            name="age"
            type="number"
            className="form-input"
            value={form.age}
            onChange={this.handleChange}
            data-testid="age-input"
          />
          {errors.age ? (
            <p className="form-error" data-testid="age-error">
              {errors.age}
            </p>
          ) : null}
        </div>

        <div className="flex gap-2">
          <button type="submit" className="btn-primary" data-testid="save-btn">
            Save Profile
          </button>
          <button type="button" className="btn-secondary" onClick={this.props.reset} data-testid="reset-btn">
            Reset
          </button>
        </div>

        {saved ? (
          <div className="mt-4 bg-green-50 border border-green-300 rounded p-3" data-testid="saved-profile">
            <p className="text-green-800 text-sm font-medium">Saved profile:</p>
            <p className="text-sm text-gray-700" data-testid="saved-name">
              {saved.fullName} ({saved.email})
            </p>
          </div>
        ) : null}
      </form>
    );
  }
}

const mapStateToProps = (state) => ({
  form: state.profile.form,
  errors: state.profile.errors,
  saved: state.profile.saved,
});

const mapDispatchToProps = { updateField, saveProfile, setErrors, reset };

export default connect(mapStateToProps, mapDispatchToProps)(ProfileForm);
