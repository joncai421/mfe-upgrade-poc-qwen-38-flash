import React from "react";
import ProfileForm from "./components/ProfileForm";

export default function App() {
  return (
    <div className="app-card" data-testid="app2-root">
      <h3 className="app-heading">MFE App 2 — Profile Management</h3>
      <ProfileForm />
    </div>
  );
}
