// Async boundary required by Module Federation: the entry must not import
// react/react-dom synchronously so shared modules can be registered first.
import("./bootstrap");
