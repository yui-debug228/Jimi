import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import siteData from "@/data/siteData.json";

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const aboutPortrait = siteData.about.aboutPortrait;
  const aboutText = siteData.about.aboutText;
  const catName = siteData.about.catName;
  const catBreed = siteData.about.catBreed;
  const catAge = siteData.about.catAge;
  const catPersonality = siteData.about.catPersonality;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(imageRef.current, { opacity: 0, x: -40 }, {
        opacity: 1, x: 0, duration: 1.2, ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 70%", toggleActions: "play none none none" },
      });
      gsap.fromTo(textRef.current, { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 1.2, ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 60%", toggleActions: "play none none none" },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="relative" style={{ paddingTop: "20vh", paddingBottom: "15vh" }}>
      <div className="divider-line mb-16" />
      <div className="px-8 md:px-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center">
          <div ref={imageRef} className="relative opacity-0">
            <div className="overflow-hidden" style={{ borderRadius: "4px" }}>
              <img src={aboutPortrait} alt={`${catName}的肖像`} className="w-full h-auto object-cover transition-transform duration-700 hover:scale-105" style={{ aspectRatio: "3/4" }} />
            </div>
            <div className="absolute -bottom-4 -right-4 text-xs tracking-widest" style={{ color: "#b1b1b1", fontFamily: '"Cinzel", "Didot", serif' }}>
              {catName.toUpperCase()} · 2024
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <p ref={textRef} className="serif-display opacity-0" style={{ fontSize: "clamp(1.1rem, 1.8vw, 1.5rem)", lineHeight: 1.8, color: "#b1b1b1", fontWeight: 300 }}>
              {aboutText}
            </p>

            <div className="mt-12 flex flex-col gap-4">
              {[
                { label: "品种", value: catBreed },
                { label: "年龄", value: catAge },
                { label: "性格", value: catPersonality },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <span className="text-xs tracking-widest uppercase" style={{ color: "#b1b1b1", minWidth: "60px" }}>{item.label}</span>
                  <span className="text-sm" style={{ color: "#000" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
