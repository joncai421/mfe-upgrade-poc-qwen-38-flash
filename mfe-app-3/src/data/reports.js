// Static mock report data — no backend (out of scope per PRD 1.3).
export const REPORTS = [
  { id: 1, title: "Q1 Revenue", category: "finance", status: "approved" },
  { id: 2, title: "Q1 Expenses", category: "finance", status: "pending" },
  { id: 3, title: "Hiring Pipeline", category: "hr", status: "approved" },
  { id: 4, title: "Attrition Analysis", category: "hr", status: "rejected" },
  { id: 5, title: "Uptime Report", category: "engineering", status: "pending" },
  { id: 6, title: "Deploy Frequency", category: "engineering", status: "approved" },
  { id: 7, title: "Marketing Spend", category: "marketing", status: "pending" },
];

export const STATUS_OPTIONS = ["all", "approved", "pending", "rejected"];
