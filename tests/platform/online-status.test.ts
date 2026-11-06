import { describe, expect, it, vi } from "vitest";

import { isBrowserOnline, subscribeToConnection } from "@/lib/api/online-status";

describe("subscribeToConnection (forms-errors-6)", () => {
  it("reports online and offline, and stops after unsubscribing", () => {
    const target = new EventTarget();
    const onChange = vi.fn();
    const unsubscribe = subscribeToConnection(onChange, target);

    target.dispatchEvent(new Event("offline"));
    target.dispatchEvent(new Event("online"));
    expect(onChange.mock.calls).toEqual([[false], [true]]);

    unsubscribe();
    target.dispatchEvent(new Event("online"));
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("reads navigator.onLine, online when unknown", () => {
    vi.stubGlobal("navigator", { onLine: false });
    expect(isBrowserOnline()).toBe(false);
    vi.stubGlobal("navigator", { onLine: true });
    expect(isBrowserOnline()).toBe(true);
    vi.stubGlobal("navigator", {});
    expect(isBrowserOnline()).toBe(true);
    vi.unstubAllGlobals();
  });
});
