import { useEffect, useRef } from "react";
import gsap from "gsap";
import siteData from "@/data/siteData.json";
import { assetUrl } from "@/lib/utils";

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  const heroImage = siteData.hero?.heroImage ?? "";
  const heroTitle = siteData.hero?.heroTitle ?? "";
  const heroSubtitle = siteData.hero?.heroSubtitle ?? "";
  const titleLines = heroTitle.split("\n").filter(Boolean);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        imageRef.current,
        { opacity: 0, scale: 1.1 },
        { opacity: 1, scale: 1, duration: 1.5 }
      )
        .fromTo(
          ".hero-title-line",
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 1.2, stagger: 0.15 },
          "-=0.8"
        )
        .fromTo(
          ".hero-subtitle",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8 },
          "-=0.5"
        );
    }, containerRef);

    return () => ctx.revert();
  }, [titleLines.length]);

  return (
    <section ref={containerRef} className="relative w-full overflow-hidden" style={{ height: "100vh" }}>
      <div ref={imageRef} className="absolute inset-0 opacity-0" style={{ willChange: "transform" }}>
        <img src={assetUrl(heroImage)} alt="米米" className="w-full h-full object-cover" style={{ filter: "brightness(0.95)" }} />
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to bottom, rgba(242,242,242,0.3) 0%, rgba(242,242,242,0) 40%, rgba(242,242,242,0) 60%, rgba(242,242,242,0.95) 100%)",
        }} />
      </div>

      <div ref={titleRef} className="absolute bottom-16 left-8 md:left-16 z-10">
        <h1 className="serif-display text-black">
          {titleLines.map((line, i) => (
            <span key={i} className="hero-title-line block opacity-0 mt-1" style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", lineHeight: 1.3, letterSpacing: "0.05em" }}>
              {line}
            </span>
          ))}
        </h1>
        <p className="hero-subtitle opacity-0 mt-6" style={{ fontSize: "13px", color: "#8d8d8d", letterSpacing: "0.15em" }}>
          {heroSubtitle}
        </p>
      </div>
    </section>
  );
}
