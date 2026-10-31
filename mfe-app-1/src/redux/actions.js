export const INCREMENT = "counter/INCREMENT";
export const DECREMENT = "counter/DECREMENT";
export const SET_STEP = "counter/SET_STEP";
export const RESET = "counter/RESET";

export const increment = () => ({ type: INCREMENT });
export const decrement = () => ({ type: DECREMENT });
export const setStep = (step) => ({ type: SET_STEP, step: Number(step) });
export const reset = () => ({ type: RESET });
