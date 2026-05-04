"use client";

import { useEffect, useRef } from "react";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4";
const FADE_DURATION = 0.5;

export function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.style.opacity = "0";

    const tick = () => {
      const v = videoRef.current;
      if (!v) return;
      const duration = v.duration;
      const current = v.currentTime;
      if (!isNaN(duration) && duration > 0) {
        let opacity = 1;
        if (current < FADE_DURATION) {
          opacity = current / FADE_DURATION;
        } else if (current > duration - FADE_DURATION) {
          opacity = Math.max(0, (duration - current) / FADE_DURATION);
        }
        v.style.opacity = String(Math.max(0, Math.min(1, opacity)));
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    const handleEnded = () => {
      const v = videoRef.current;
      if (!v) return;
      v.style.opacity = "0";
      setTimeout(() => {
        v.currentTime = 0;
        v.play().catch(() => {});
      }, 100);
    };

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
    video.addEventListener("ended", handleEnded);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        muted
        playsInline
        autoPlay
        preload="auto"
        className="absolute h-auto w-full object-cover transition-opacity"
        style={{
          top: "300px",
          inset: "auto 0 0 0",
          opacity: 0,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />
    </div>
  );
}
