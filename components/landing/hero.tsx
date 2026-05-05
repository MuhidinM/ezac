import { ArrowRightIcon } from "lucide-react";

export function Hero() {
  return (
    <section
      className="relative z-10 flex flex-col items-center px-6 pb-32 text-center"
      style={{
        paddingTop: "12rem",
        minHeight: "100vh",
      }}
    >
      <h1
        className="animate-fade-rise font-serif-display text-6xl font-normal sm:text-7xl md:text-8xl"
        style={{
          color: "#000000",
          lineHeight: 0.95,
          letterSpacing: "-2.46px",
        }}
      >
        <span className="italic" style={{ color: "#6F6F6F" }}>
          Trusted
        </span>{" "}
        Zakat.{" "}
        <span className="italic" style={{ color: "#6F6F6F" }}>
          Eternal
        </span>{" "}
        Waqf.
      </h1>

      <p
        className="animate-fade-rise-delay mt-8 max-w-2xl text-base leading-relaxed sm:text-lg"
        style={{
          color: "#6F6F6F",
          fontFamily: "Inter, sans-serif",
        }}
      >
        Ethiopia&apos;s trusted digital home for Zakat and Waqf. Calculate,
        give, and endow with mathematical precision and radical transparency —
        every birr traced from your hand to the families and futures it builds.
      </p>

      <div className="animate-fade-rise-delay-2 mt-12 flex flex-col items-center gap-4 sm:flex-row">
        <button
          className="inline-flex items-center gap-2 rounded-full px-10 py-5 text-base transition-transform duration-300 hover:scale-[1.03]"
          style={{
            backgroundColor: "#000000",
            color: "#FFFFFF",
          }}
        >
          Calculate Your Zakat
          <ArrowRightIcon className="h-4 w-4" />
        </button>

        <button
          className="group relative isolate overflow-hidden rounded-full border px-8 py-5 text-base"
          style={{
            borderColor: "#000000",
          }}
          type="button"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 -translate-x-full transition-transform duration-500 ease-out group-hover:translate-x-0"
            style={{
              backgroundColor: "#000000",
            }}
          />
          <span className="relative z-10 inline-flex items-center gap-2 text-black transition-colors duration-500 group-hover:text-white">
            View Live Dashboard
            <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">
              →
            </span>
          </span>
        </button>
      </div>
    </section>
  );
}
