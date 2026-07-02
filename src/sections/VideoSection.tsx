import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import siteData from "@/data/siteData";
import { assetUrl, resolveImage } from "@/lib/utils";
import { Play, X, ExternalLink } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function VideoSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [playingBvid, setPlayingBvid] = useState<string | null>(null);

  const videos = siteData?.videos ?? [];
  const videoList = videos.map(v => ({...v, thumbnailUrl: resolveImage(v.thumbnail || "images/mimi-hero.jpg")}));

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".video-card", { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 70%", toggleActions: "play none none none" },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const getEmbedUrl = (bvid: string) => `https://player.bilibili.com/player.html?bvid=${bvid}&autoplay=1`;
  const getBilibiliPageUrl = (bvid: string) => `https://www.bilibili.com/video/${bvid}`;

  return (
    <section id="videos" ref={sectionRef} style={{ paddingTop: "15vh", paddingBottom: "15vh" }}>
      <div className="px-8 md:px-16 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="serif-display" style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)", letterSpacing: "0.05em" }}>小剧场</h2>
            <p className="mt-3" style={{ fontSize: "13px", color: "#b1b1b1", letterSpacing: "0.1em" }}>米米的 B 站视频合集</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://www.bilibili.com" target="_blank" rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 text-xs transition-colors duration-300 hover:text-[#8d8d8d]" style={{ color: "#b1b1b1" }}>
              在 B 站查看更多 <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {videoList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videoList.map((video) => (
              <div key={video.id} className="video-card opacity-0 group cursor-pointer" onClick={() => setPlayingBvid(video.bvid)}>
                <div className="relative overflow-hidden" style={{ borderRadius: "4px", aspectRatio: "16/10" }}>
                  <img src={video.thumbnailUrl} alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy"
                    onError={(e) => { const img = e.target as HTMLImageElement; img.onerror = null; img.src = assetUrl("images/mimi-hero.jpg"); }} />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-400">
                    <div className="w-14 h-14 flex items-center justify-center rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
                      <Play size={24} className="text-white ml-1" />
                    </div>
                  </div>
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 40%)" }} />
                </div>
                <div className="mt-3">
                  <h3 className="text-sm tracking-wide transition-colors duration-300 group-hover:text-[#8d8d8d]" style={{ color: "#000" }}>{video.title}</h3>
                  {video.description && <p className="mt-1 text-xs" style={{ color: "#b1b1b1" }}>{video.description}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24" style={{ border: "1px dashed #e5e5e5", borderRadius: "4px" }}>
            <p className="text-sm" style={{ color: "#b1b1b1" }}>还没有添加视频</p>
          </div>
        )}
      </div>

      {playingBvid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12" style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={() => setPlayingBvid(null)}>
          <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPlayingBvid(null)} className="absolute -top-10 right-0 text-white transition-colors duration-300 hover:text-[#b1b1b1]"><X size={24} /></button>
            <div className="relative w-full overflow-hidden" style={{ borderRadius: "8px", aspectRatio: "16/9", backgroundColor: "#000" }}>
              <iframe src={getEmbedUrl(playingBvid)} className="absolute inset-0 w-full h-full" allowFullScreen allow="autoplay; fullscreen" style={{ border: "none" }} />
            </div>
            <div className="mt-4 flex justify-center">
              <a href={getBilibiliPageUrl(playingBvid)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-white/60 transition-colors duration-300 hover:text-white">
                在 B 站打开此视频 <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
