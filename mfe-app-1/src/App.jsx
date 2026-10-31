// React 19 automatic JSX runtime: no `import React` needed for JSX.
import { Route, NavLink, Switch } from "react-router-dom";
import HomePage from "./pages/HomePage";
import DetailsPage from "./pages/DetailsPage";

// react-router-dom v5 computes the active state itself: `className` is always applied
// and `activeClassName` is appended on a match. A function `className` is the v6 API —
// in v5 the function is forwarded to the DOM <a>, and React 19 flags that as an invalid
// attribute value instead of silently stringifying it like React 16 did. The `!` variants
// (Tailwind important utilities) win over the inactive colours, which share the same
// specificity but are emitted later in the stylesheet.
const tabClass = "mr-2 px-3 py-1 text-sm rounded bg-gray-200 text-gray-700 hover:bg-gray-300";
const tabActiveClass = "!bg-indigo-600 !text-white";

export default function App() {
  return (
    <div className="app-card" data-testid="app1-root">
      <h3 className="app-heading">MFE App 1 — Counter &amp; Form</h3>
      <nav className="mb-4" aria-label="App 1 sections" data-testid="app1-nav">
        <NavLink to="/" exact className={tabClass} activeClassName={tabActiveClass}>
          Home
        </NavLink>
        <NavLink to="/details" className={tabClass} activeClassName={tabActiveClass}>
          Details
        </NavLink>
      </nav>
      <Switch>
        <Route path="/details">
          <DetailsPage />
        </Route>
        <Route path="/">
          <HomePage />
        </Route>
      </Switch>
    </div>
  );
}
