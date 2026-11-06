"use client";

import { useEffect, useRef } from "react";

import { useFastConnection, useIdleAfterLoad, useMediaQuery } from "./use-deferred-load";

// Hot-linked from a third-party CDN until EZAC hosts its own compressed copy.
const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4";
// Already on the page as the hero watermark, so the poster costs no extra request.
const POSTER_SRC = "/images/bg2.webp";
const FADE_DURATION = 0.5;

const LARGE_SCREEN = "(min-width: 1024px)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * The video is about 15 MB, so it is decoration only where it's cheap: large
 * screens, no reduced-motion preference, a fast connection without data
 * saver. Even then the <video> element (and its download) is only created
 * after the page has loaded and the browser is idle, so it never competes
 * with the page's own content. Everyone else keeps the plain background.
 */
export function VideoBackground() {
  const largeScreen = useMediaQuery(LARGE_SCREEN);
  const reducedMotion = useMediaQuery(REDUCED_MOTION);
  const fastConnection = useFastConnection();
  const allowed = largeScreen && !reducedMotion && fastConnection;
  const idle = useIdleAfterLoad(allowed);

  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      {allowed && idle ? <LoopingVideo /> : null}
      <div className="absolute inset-0 bg-linear-to-b from-white via-transparent to-white" />
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

    // preload="none": nothing downloads until play() asks for it.
    const play = () => {
      if (!document.hidden) video.play().catch(() => {});
    };
    // Pause while the tab is hidden; resume when it's back.
    const onVisibility = () => (document.hidden ? video.pause() : play());

    play();
    video.addEventListener("playing", startFading);
    video.addEventListener("pause", stopFading);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopFading();
      video.pause();
      video.removeEventListener("playing", startFading);
      video.removeEventListener("pause", stopFading);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={VIDEO_SRC}
      poster={POSTER_SRC}
      muted
      playsInline
      loop
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      className="absolute inset-x-0 bottom-0 h-auto w-full object-cover opacity-0 transition-opacity"
    />
  );
}
