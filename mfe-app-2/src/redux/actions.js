export const UPDATE_FIELD = "profile/UPDATE_FIELD";
export const SAVE_PROFILE = "profile/SAVE_PROFILE";
export const SET_ERRORS = "profile/SET_ERRORS";
export const RESET = "profile/RESET";

export const updateField = (field, value) => ({ type: UPDATE_FIELD, field, value });
export const saveProfile = (profile) => ({ type: SAVE_PROFILE, profile });
export const setErrors = (errors) => ({ type: SET_ERRORS, errors });
export const reset = () => ({ type: RESET });
