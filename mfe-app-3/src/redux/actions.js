export const SET_STATUS = "reports/SET_STATUS";
export const SET_QUERY = "reports/SET_QUERY";
export const CLEAR_FILTERS = "reports/CLEAR_FILTERS";

export const setStatus = (status) => ({ type: SET_STATUS, status });
export const setQuery = (query) => ({ type: SET_QUERY, query });
export const clearFilters = () => ({ type: CLEAR_FILTERS });
