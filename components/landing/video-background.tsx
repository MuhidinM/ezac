"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

// Hot-linked from a third-party CDN until EZAC hosts its own compressed copy.
const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4";
const FADE_DURATION = 0.5;

const WIDE_SCREEN = "(min-width: 768px)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

type NetworkInformation = EventTarget & { saveData?: boolean };
const connection = () =>
  (navigator as Navigator & { connection?: NetworkInformation }).connection;

/**
 * The video is about 30 MB, so it only plays where it's welcome: md screens
 * and up, no reduced-motion preference, and no data-saver. Everyone else
 * keeps the plain background.
 */
function videoAllowed() {
  return (
    window.matchMedia(WIDE_SCREEN).matches &&
    !window.matchMedia(REDUCED_MOTION).matches &&
    !connection()?.saveData
  );
}

function subscribe(onChange: () => void) {
  const queries = [window.matchMedia(WIDE_SCREEN), window.matchMedia(REDUCED_MOTION)];
  queries.forEach((query) => query.addEventListener("change", onChange));
  connection()?.addEventListener?.("change", onChange);
  return () => {
    queries.forEach((query) => query.removeEventListener("change", onChange));
    connection()?.removeEventListener?.("change", onChange);
  };
}

export function VideoBackground() {
  // Server render and first paint have no video; the check runs in the browser.
  const allowed = useSyncExternalStore(subscribe, videoAllowed, () => false);

  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      {allowed ? <LoopingVideo /> : null}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />
    </div>
  );
}

function LoopingVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let frame: number | null = null;

    // Fade in at the start of each loop and out before the end, while playing only.
    const tick = () => {
      const { duration, currentTime } = video;
      if (!Number.isNaN(duration) && duration > 0) {
        let opacity = 1;
        if (currentTime < FADE_DURATION) {
          opacity = currentTime / FADE_DURATION;
        } else if (currentTime > duration - FADE_DURATION) {
          opacity = (duration - currentTime) / FADE_DURATION;
        }
        video.style.opacity = String(Math.max(0, Math.min(1, opacity)));
      }
      frame = requestAnimationFrame(tick);
    };
    const startFading = () => {
      if (frame === null) frame = requestAnimationFrame(tick);
    };
    const stopFading = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    };

    const play = () => {
      if (!document.hidden) video.play().catch(() => {});
    };
    // Pause while the tab is hidden; resume when it's back.
    const onVisibility = () => (document.hidden ? video.pause() : play());

    // Start after the page has loaded so the video doesn't compete with fonts and scripts.
    if (document.readyState === "complete") play();
    else window.addEventListener("load", play, { once: true });

    video.addEventListener("playing", startFading);
    video.addEventListener("pause", stopFading);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopFading();
      video.pause();
      window.removeEventListener("load", play);
      video.removeEventListener("playing", startFading);
      video.removeEventListener("pause", stopFading);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={VIDEO_SRC}
      muted
      playsInline
      loop
      preload="metadata"
      aria-hidden="true"
      className="absolute h-auto w-full object-cover transition-opacity"
      style={{
        top: "300px",
        inset: "auto 0 0 0",
        opacity: 0,
      }}
    />
  );
}
