import { createStore, combineReducers } from "redux";
import counterReducer from "./counterReducer";

export function makeStore(preloadedState) {
  return createStore(combineReducers({ counter: counterReducer }), preloadedState);
}
