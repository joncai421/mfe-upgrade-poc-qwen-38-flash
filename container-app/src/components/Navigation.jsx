import React from "react";
import { NavLink } from "react-router-dom";
import { REMOTE_APPS } from "../remotes/registry";

const linkBase = "inline-block px-4 py-2 text-sm font-medium rounded-t";

function linkClass({ isActive }) {
  return `${linkBase} ${isActive ? "bg-white text-gray-900" : "text-gray-300 hover:bg-gray-700"}`;
}

export default function Navigation() {
  return (
    <nav className="max-w-6xl mx-auto px-4" data-testid="navigation" aria-label="Micro frontends">
      {REMOTE_APPS.map((remote) => (
        <NavLink key={remote.id} to={remote.path} exact className={linkClass}>
          {remote.label}
        </NavLink>
      ))}
      <NavLink to="/diagnostics" className={linkBase.replace("rounded-t", "rounded-t ml-2")}>
        Diagnostics
      </NavLink>
    </nav>
  );
}
