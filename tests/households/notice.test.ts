import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearNotices, leaveNotice, takeNotice } from "@/lib/backoffice/notice";

/** A minimal sessionStorage for Node. */
class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  setItem(key: string, value: string) {
    this.map.set(key, String(value));
  }
}

let storage: MemoryStorage;

beforeEach(() => {
  storage = new MemoryStorage();
  vi.stubGlobal("window", { sessionStorage: storage });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("one-time notices", () => {
  it("shows a notice once, on the record it was left for", () => {
    leaveNotice("beneficiary:42", "Abebe is registered.");
    expect(takeNotice("beneficiary:7")).toBeNull();
    expect(takeNotice("beneficiary:42")).toBe("Abebe is registered.");
    expect(takeNotice("beneficiary:42")).toBeNull();
  });

  it("clears every notice not yet shown, and nothing else", () => {
    storage.setItem("ezac_registration_session", "{}");
    leaveNotice("beneficiary:42", "Registered.");
    leaveNotice("assessment:8", "Submitted.");
    clearNotices();
    expect(takeNotice("beneficiary:42")).toBeNull();
    expect(takeNotice("assessment:8")).toBeNull();
    expect(storage.getItem("ezac_registration_session")).toBe("{}");
  });

  it("does nothing when storage is blocked", () => {
    vi.stubGlobal("window", {
      get sessionStorage(): Storage {
        throw new Error("blocked");
      },
    });
    expect(() => leaveNotice("beneficiary:1", "x")).not.toThrow();
    expect(takeNotice("beneficiary:1")).toBeNull();
  });
});
