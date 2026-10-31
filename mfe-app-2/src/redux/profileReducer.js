import { UPDATE_FIELD, SAVE_PROFILE, SET_ERRORS, RESET } from "./actions";

export const initialState = {
  form: { fullName: "", email: "", age: "" },
  saved: null,
  errors: {},
};

export default function profileReducer(state = initialState, action) {
  switch (action.type) {
    case UPDATE_FIELD:
      return { ...state, form: { ...state.form, [action.field]: action.value } };
    case SET_ERRORS:
      return { ...state, errors: action.errors };
    case SAVE_PROFILE:
      return { ...state, saved: action.profile, errors: {} };
    case RESET:
      return { ...initialState };
    default:
      return state;
  }
}
