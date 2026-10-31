import { SET_STATUS, SET_QUERY, CLEAR_FILTERS } from "./actions";

export const initialState = {
  status: "all",
  query: "",
};

export default function reportsReducer(state = initialState, action) {
  switch (action.type) {
    case SET_STATUS:
      return { ...state, status: action.status };
    case SET_QUERY:
      return { ...state, query: action.query };
    case CLEAR_FILTERS:
      return { ...initialState };
    default:
      return state;
  }
}
