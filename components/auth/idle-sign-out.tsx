"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SIGNED_OUT_KEY, leaveAfterSignOutElsewhere, signOut } from "@/lib/auth/client-session";

/** Sign out after this long without input; staff PCs at branches are shared. */
const IDLE_MS = 15 * 60 * 1000;
/** How long the warning stays up before the sign-out happens. */
const WARNING_MS = 60 * 1000;
/** Activity in any tab keeps every tab alive; shared through localStorage. */
const STORAGE_KEY = "ezac_last_activity";
/** Write the shared timestamp at most this often; pointermove fires constantly. */
const SHARE_EVERY_MS = 15 * 1000;

const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart"] as const;

function sharedActivity(): number {
  try {
    return Number(window.localStorage.getItem(STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function shareActivity(at: number) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(at));
  } catch {
    // Storage blocked: this tab still keeps its own timer.
  }
}

/**
 * Signs the staff member out after 15 minutes without pointer, keyboard or
 * touch input in any EZAC tab, with a one-minute warning first. Coming back
 * to a hidden tab is not counted as activity: the timer is checked then, so a
 * tab left in the background for an hour signs out as soon as it is shown.
 */
export function IdleSignOut() {
  const lastActivity = useRef(0);
  const lastShared = useRef(0);
  const warningOpen = useRef(false);
  const stayButton = useRef<HTMLButtonElement>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const markActive = useCallback((now = Date.now()) => {
    lastActivity.current = now;
    if (now - lastShared.current >= SHARE_EVERY_MS) {
      lastShared.current = now;
      shareActivity(now);
    }
  }, []);

  const stayActive = useCallback(() => {
    const now = Date.now();
    lastShared.current = 0;
    markActive(now);
    warningOpen.current = false;
    setSecondsLeft(null);
  }, [markActive]);

  useEffect(() => {
    markActive();

    function onActivity() {
      // While the warning is up, only "Stay signed in" counts, so a mouse
      // brushed by someone walking past doesn't cancel it.
      if (!warningOpen.current) markActive();
    }

    function check() {
      const now = Date.now();
      const latest = Math.max(lastActivity.current, sharedActivity());
      if (latest > lastActivity.current) lastActivity.current = latest;
      const idleFor = now - latest;

      if (idleFor >= IDLE_MS + WARNING_MS) {
        void signOut({ reason: "idle" });
        return;
      }
      if (idleFor >= IDLE_MS) {
        warningOpen.current = true;
        setSecondsLeft(Math.ceil((IDLE_MS + WARNING_MS - idleFor) / 1000));
        return;
      }
      if (warningOpen.current) {
        // Another tab saw activity.
        warningOpen.current = false;
        setSecondsLeft(null);
      }
    }

    function onVisibility() {
      if (document.visibilityState === "visible") check();
    }

    // Signed out in another tab (button, idle timer or an ended session):
    // don't leave this tab showing beneficiary data.
    function onStorage(event: StorageEvent) {
      if (event.key === SIGNED_OUT_KEY && event.newValue) leaveAfterSignOutElsewhere();
    }

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);
    // Cheap: two numbers and one storage read a second.
    const timer = window.setInterval(check, 1000);

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
      window.clearInterval(timer);
    };
  }, [markActive]);

  const open = secondsLeft !== null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Escape or the close button: the person is clearly here.
        if (!next) stayActive();
      }}
    >
      <DialogContent
        className="max-w-sm"
        onOpenAutoFocus={(event) => {
          // Put focus on the safe choice, not on "Sign out now".
          event.preventDefault();
          stayButton.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            You&apos;ll be signed out in {secondsLeft ?? 60} second{secondsLeft === 1 ? "" : "s"}
          </DialogTitle>
          <DialogDescription>
            There has been no activity for 15 minutes. To keep working, choose Stay signed in.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => void signOut()}>
            Sign out now
          </Button>
          <Button ref={stayButton} onClick={stayActive}>
            Stay signed in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
