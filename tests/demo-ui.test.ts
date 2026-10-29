import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import React from "react";
import { createDemoState } from "../src/lib/demo/model";

// Render owned components in an isolated DOM. No remote browser or network is used.
test("dummy MVP: hydration, catalog search, earning, sync, failures and persistence", async () => {
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    url: "http://localhost",
  });
  Object.defineProperty(globalThis, "window", {
    value: dom.window,
    configurable: true,
  });
  Object.defineProperty(globalThis, "document", {
    value: dom.window.document,
    configurable: true,
  });
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: dom.window.localStorage,
    configurable: true,
  });
  Object.defineProperty(globalThis, "HTMLElement", {
    value: dom.window.HTMLElement,
    configurable: true,
  });
  Object.defineProperty(globalThis, "StorageEvent", {
    value: dom.window.StorageEvent,
    configurable: true,
  });
  Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
    value: true,
    writable: true,
    configurable: true,
  });
  const Dialog = dom.window.HTMLDialogElement;
  Dialog.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  Dialog.prototype.close = function () {
    this.removeAttribute("open");
  };
  const { render, screen, fireEvent, waitFor, cleanup } =
    await import("@testing-library/react");
  const { default: DemoApp } = await import("../src/components/DemoApp");
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    throw new Error("Demo attempted a network request");
  };
  const storageKey = "arcade-atlas.demo.v1";
  // A deterministic seed simulates an existing cached observation.
  dom.window.localStorage.setItem(
    storageKey,
    JSON.stringify(createDemoState(new Date().toISOString())),
  );
  const { renderToString } = await import("react-dom/server");
  const container = dom.window.document.createElement("div");
  container.innerHTML = renderToString(React.createElement(DemoApp));
  dom.window.document.body.appendChild(container);
  let rendered: ReturnType<typeof render> = render(
    React.createElement(DemoApp),
    { container, hydrate: true },
  );
  try {
    await waitFor(() =>
      assert.equal(
        (
          screen.getByRole("button", {
            name: "Sync profile",
          }) as HTMLButtonElement
        ).disabled,
        false,
      ),
    );
    assert.ok(screen.getByRole("heading", { name: "Alex Morgan" }));
    assert.equal(screen.queryByRole("button", { name: "Community" }), null);
    assert.deepEqual(
      Array.from(
        dom.window.document.querySelectorAll(
          'nav[aria-label="Main navigation"] button',
        ),
      ).map((b) => b.textContent?.trim()),
      ["Progress", "Catalog"],
    );
    fireEvent.click(screen.getByRole("button", { name: "Catalog" }));
    assert.equal(
      screen.getAllByRole("button", { name: "View details" }).length,
      12,
    );
    // The reference-inspired controls compose without introducing solution links.
    assert.equal(
      dom.window.document.querySelectorAll('a[href*="github.com"]').length,
      0,
    );
    fireEvent.click(screen.getByRole("button", { name: /Arcade games/ }));
    assert.equal(
      screen.getAllByRole("button", { name: "View details" }).length,
      5,
    );
    fireEvent.click(screen.getByRole("button", { name: "Completed" }));
    assert.equal(
      screen.getAllByRole("button", { name: "View details" }).length,
      2,
    );
    fireEvent.click(screen.getByRole("button", { name: "Not completed" }));
    assert.equal(
      screen.getAllByRole("button", { name: "View details" }).length,
      3,
    );
    fireEvent.click(screen.getByRole("button", { name: /All activities/ }));
    fireEvent.click(screen.getByRole("button", { name: /My targets/ }));
    assert.equal(
      screen.getAllByRole("button", { name: "View details" }).length,
      2,
    );
    fireEvent.click(screen.getByRole("button", { name: "List view" }));
    assert.ok(dom.window.document.querySelector(".catalog-results.is-list"));
    fireEvent.click(screen.getByRole("button", { name: "Grid view" }));
    assert.equal(
      dom.window.document.querySelector(".catalog-results.is-list"),
      null,
    );
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    fireEvent.change(
      screen.getByRole("textbox", { name: "Search activities" }),
      { target: { value: "Prompt" } },
    );
    assert.equal(
      screen.getAllByRole("button", { name: "View details" }).length,
      1,
    );
    fireEvent.click(screen.getByRole("button", { name: "View details" }));
    assert.ok(screen.getByRole("dialog", { name: "Prompt, Test, Repeat" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Simulate earning badge" }),
    );
    assert.equal(screen.queryByRole("dialog"), null);
    let stored = JSON.parse(dom.window.localStorage.getItem(storageKey)!);
    assert.equal(stored.awards.length, 7);
    fireEvent.click(screen.getByRole("button", { name: "Demo controls" }));
    fireEvent.click(
      screen.getByRole("button", { name: /Simulate a private profile/ }),
    );
    // UI can be on a different tab while sync completes; persisted cache is the contract.
    await waitFor(
      () => {
        const s = JSON.parse(dom.window.localStorage.getItem(storageKey)!);
        assert.match(s.lastError, /private/);
        assert.equal(s.awards.length, 7);
      },
      { timeout: 3000 },
    );
    fireEvent.click(screen.getByRole("button", { name: "Progress" }));
    fireEvent.click(screen.getByRole("button", { name: "Sync profile" }));
    await waitFor(
      () => {
        const s = JSON.parse(dom.window.localStorage.getItem(storageKey)!);
        assert.equal(s.lastError, null);
        assert.equal(s.awards.length, 8);
      },
      { timeout: 3000 },
    );
    stored = JSON.parse(dom.window.localStorage.getItem(storageKey)!);
    rendered.unmount();
    rendered = render(React.createElement(DemoApp));
    await waitFor(() =>
      assert.equal(
        (
          screen.getByRole("button", {
            name: "Sync profile",
          }) as HTMLButtonElement
        ).disabled,
        false,
      ),
    );
    assert.equal(
      JSON.parse(dom.window.localStorage.getItem(storageKey)!).awards.length,
      stored.awards.length,
    );
    fireEvent.click(screen.getByRole("button", { name: "Demo controls" }));
    fireEvent.click(screen.getByRole("button", { name: /Sign out of demo/ }));
    assert.ok(screen.getByRole("button", { name: "Enter demo" }));
    assert.equal(
      (
        screen.getByRole("button", {
          name: "Sync profile",
        }) as HTMLButtonElement
      ).disabled,
      true,
    );
    fireEvent.click(screen.getByRole("button", { name: "Enter demo" }));
    assert.equal(
      (
        screen.getByRole("button", {
          name: "Sync profile",
        }) as HTMLButtonElement
      ).disabled,
      false,
    );
    fireEvent.click(screen.getByRole("button", { name: "Demo controls" }));
    fireEvent.click(screen.getByRole("button", { name: /Reset demo data/ }));
    assert.equal(
      JSON.parse(dom.window.localStorage.getItem(storageKey)!).awards.length,
      6,
    );
    fireEvent.click(screen.getByRole("button", { name: "Manage" }));
    fireEvent.change(screen.getByLabelText("Public profile URL"), {
      target: { value: "https://example.com/private" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Save sample profile" }),
    );
    assert.ok(
      screen
        .getByRole("dialog")
        .querySelector("[role=alert]")
        ?.textContent?.includes("Google Skills"),
    );
    fireEvent.change(screen.getByLabelText(/Display name/), {
      target: { value: "Demo Two" },
    });
    fireEvent.change(screen.getByLabelText("Public profile URL"), {
      target: {
        value:
          "https://www.skills.google/public_profiles/00000000-0000-4000-8000-000000000002",
      },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Save sample profile" }),
    );
    assert.equal(screen.queryByRole("dialog"), null);
    assert.ok(screen.getByRole("heading", { name: "Demo Two" }));
    assert.ok(
      screen.getByRole("heading", { name: "Your next badge starts here." }),
    );
    assert.equal(
      JSON.parse(dom.window.localStorage.getItem(storageKey)!).awards.length,
      0,
    );
    // URL-only entry also works after switching profiles; a second login or name is not required.
    fireEvent.change(
      screen.getByLabelText("Public Google Skills profile URL"),
      {
        target: {
          value:
            "https://www.skills.google/public_profiles/00000000-0000-4000-8000-000000000003",
        },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Track profile" }));
    await waitFor(
      () =>
        assert.equal(
          JSON.parse(dom.window.localStorage.getItem(storageKey)!).awards
            .length,
          1,
        ),
      { timeout: 3000 },
    );
    assert.equal(
      requests,
      0,
      "All demo interactions must work without network requests",
    );
  } finally {
    globalThis.fetch = originalFetch;
    rendered.unmount();
    cleanup();
    dom.window.close();
  }
});
