import { createStore, combineReducers } from "redux";
import profileReducer from "./profileReducer";

export function makeStore(preloadedState) {
  return createStore(combineReducers({ profile: profileReducer }), preloadedState);
}
