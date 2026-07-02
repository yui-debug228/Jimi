import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Heart, Lock } from "lucide-react";
import siteData from "@/data/siteData.json";
import { assetUrl } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

const presetImages = [
  { id: "preset-hero", url: assetUrl("images/mimi-hero.jpg"), title: "慵懒午后", description: "蜷缩在猫抓板窝里" },
  { id: "preset-portrait", url: assetUrl("images/mimi-portrait.jpg"), title: "歪头杀", description: "好奇地看着镜头" },
  { id: "preset-play", url: assetUrl("images/mimi-play.jpg"), title: "玩具时间", description: "专注地玩毛绒球" },
  { id: "preset-window", url: assetUrl("images/mimi-window.jpg"), title: "窗台时光", description: "趴在窗边看风景" },
];

const bentoSpans = [
  "col-span-2 row-span-1", "col-span-1 row-span-2", "col-span-1 row-span-1",
  "col-span-1 row-span-1", "col-span-1 row-span-1", "col-span-1 row-span-1",
  "col-span-2 row-span-1", "col-span-1 row-span-1", "col-span-1 row-span-1",
];

export default function Gallery() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = useAdmin();
  const { isAuthenticated } = useAuth();

  const uploadedImages = siteData.galleryImages.map((img) => ({
    id: img.id,
    url: img.url,
    title: img.title || "",
    description: img.description || "",
  }));

  const allImages = [...presetImages, ...uploadedImages];

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const maxTilt = 3;
    const deltaX = ((rect.top + rect.height / 2 - e.clientY) / (rect.height / 2)) * maxTilt;
    const deltaY = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * -maxTilt;
    gridRef.current.style.transform = `perspective(1000px) rotateX(${deltaX}deg) rotateY(${deltaY}deg)`;
  }, []);
  const handleMouseLeave = useCallback(() => {
    if (gridRef.current) gridRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".gallery-item", { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 70%", toggleActions: "play none none none" },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [allImages.length]);

  return (
    <section id="gallery" ref={sectionRef} style={{ paddingTop: "15vh", paddingBottom: "15vh" }}>
      <div className="px-8 md:px-16 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="serif-display" style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)", letterSpacing: "0.05em" }}>米米的相册</h2>
            <p className="mt-3" style={{ fontSize: "13px", color: "#b1b1b1", letterSpacing: "0.1em" }}>记录每一个可爱的瞬间</p>
          </div>
          {isAdmin ? (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "#b1b1b1" }}><Lock size={12} />演示模式</div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "#b1b1b1" }}><Lock size={12} />管理员可编辑</div>
          )}
        </div>

        <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-4 gap-2" style={{ transformStyle: "preserve-3d", transition: "transform 0.3s ease-out" }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
          {allImages.map((image, index) => {
            const spanClass = bentoSpans[index % bentoSpans.length];
            const isPreset = typeof image.id === "string" && String(image.id).startsWith("preset-");
            return (
              <div key={image.id} className={`gallery-item relative overflow-hidden opacity-0 group cursor-pointer ${spanClass}`} style={{ borderRadius: "4px" }}>
                <div className="relative w-full h-full" style={{ minHeight: "200px" }}>
                  <img src={image.url} alt={image.title || "米米的照片"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-4" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 50%)" }}>
                    {image.title && <p className="text-white text-sm tracking-wide">{image.title}</p>}
                    {image.description && <p className="text-white/70 text-xs mt-1">{image.description}</p>}
                  </div>
                </div>
                {isAuthenticated && !isPreset && <LikeButton />}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LikeButton() {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);

  return (
    <button onClick={(e) => { e.stopPropagation(); setLiked(!liked); setCount(c => liked ? Math.max(0, c - 1) : c + 1); }}
      className="like-btn absolute bottom-2 left-2 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
      style={{ backgroundColor: liked ? "rgba(239,68,68,0.85)" : "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <Heart size={16} className={`transition-all ${liked ? "text-white fill-white" : "text-white"}`} />
      <span className="text-white text-xs font-medium">{count}</span>
    </button>
  );
}
