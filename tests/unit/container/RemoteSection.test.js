import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import RemoteSection from "../../../container-app/src/components/RemoteSection";

// A fake remote module implementing the mount contract, so the container's
// orchestration logic (load -> mount -> runtime info -> unmount) can be tested
// in isolation from the real Module Federation runtime (covered by integration/E2E).
function makeFakeRemote() {
  const unmountSpy = jest.fn();
  const remote = {
    id: "mfeAppFake",
    label: "Fake Remote",
    path: "/fake",
    testId: "remote-fake",
    load: () =>
      Promise.resolve({
        mount: (el) => {
          const node = document.createElement("div");
          node.setAttribute("data-testid", "fake-app-root");
          el.appendChild(node);
          return {
            unmount: () => {
              unmountSpy();
              el.innerHTML = "";
            },
            getRuntimeInfo: () => ({ reactVersion: "16.14.0", reactDomVersion: "16.14.0" }),
          };
        },
      }),
  };
  return { remote, unmountSpy };
}

describe("container RemoteSection", () => {
  it("loads and mounts a remote and shows its runtime info", async () => {
    const { remote } = makeFakeRemote();
    render(<RemoteSection remote={remote} />);
    await waitFor(() => expect(screen.getByTestId("fake-app-root")).toBeInTheDocument());
    expect(screen.getByTestId("status-mfeAppFake")).toHaveTextContent("mounted");
    expect(screen.getByTestId("runtime-mfeAppFake")).toHaveAttribute("data-react-version", "16.14.0");
  });

  it("unmounts the remote when the section unmounts", async () => {
    const { remote, unmountSpy } = makeFakeRemote();
    const { unmount } = render(<RemoteSection remote={remote} />);
    await waitFor(() => expect(screen.getByTestId("fake-app-root")).toBeInTheDocument());
    unmount();
    expect(unmountSpy).toHaveBeenCalledTimes(1);
  });

  it("surfaces a load failure without throwing", async () => {
    const remote = {
      id: "mfeAppBad",
      label: "Broken",
      path: "/bad",
      testId: "remote-bad",
      load: () => Promise.reject(new Error("network down")),
    };
    // Silence the expected console.error from the component.
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    render(<RemoteSection remote={remote} />);
    await waitFor(() => expect(screen.getByTestId("status-mfeAppBad")).toHaveTextContent("error"));
    expect(screen.getByTestId("error-mfeAppBad")).toHaveTextContent("network down");
    spy.mockRestore();
  });
});
