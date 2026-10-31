import { Route, NavLink, Switch } from "react-router-dom";
import HomePage from "./pages/HomePage";
import DetailsPage from "./pages/DetailsPage";

const tabClass = ({ isActive }) =>
  `mr-2 px-3 py-1 text-sm rounded ${
    isActive ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
  }`;

export default function App() {
  return (
    <div className="app-card" data-testid="app1-root">
      <h3 className="app-heading">MFE App 1 — Counter &amp; Form</h3>
      <nav className="mb-4" aria-label="App 1 sections" data-testid="app1-nav">
        <NavLink to="/" exact className={tabClass}>
          Home
        </NavLink>
        <NavLink to="/details" className={tabClass}>
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
