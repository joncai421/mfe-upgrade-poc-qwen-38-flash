import { INCREMENT, DECREMENT, SET_STEP, RESET } from "./actions";

const initialState = {
  value: 0,
  step: 1,
};

export default function counterReducer(state = initialState, action) {
  switch (action.type) {
    case INCREMENT:
      return { ...state, value: state.value + state.step };
    case DECREMENT:
      return { ...state, value: state.value - state.step };
    case SET_STEP: {
      const step = Number.isFinite(action.step) && action.step > 0 ? action.step : state.step;
      return { ...state, step };
    }
    case RESET:
      return { ...initialState };
    default:
      return state;
  }
}
