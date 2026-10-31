// Standalone bootstrap for independent development (PRD 2.1: each app runnable alone).
// Async boundary: entry does not import react/react-dom synchronously so the
// Module Federation shared scope initialises first.
import("./bootstrap");
