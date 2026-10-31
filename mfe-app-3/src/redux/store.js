import { createStore, combineReducers } from "redux";
import reportsReducer from "./reportsReducer";

export function makeStore(preloadedState) {
  return createStore(combineReducers({ reports: reportsReducer }), preloadedState);
}
