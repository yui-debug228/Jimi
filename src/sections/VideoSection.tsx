import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { trpc } from "@/providers/trpc";
import { useAdmin } from "@/hooks/useAdmin";
import { Play, Plus, X, Loader2, ExternalLink, Lock } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function VideoSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDesc, setVideoDesc] = useState("");
  const [playingBvid, setPlayingBvid] = useState<string | null>(null);
  const { isAdmin } = useAdmin();

  const utils = trpc.useUtils();
  const { data: videos, isLoading } = trpc.bilibili.list.useQuery();
  const createVideo = trpc.bilibili.create.useMutation({
    onSuccess: () => { utils.bilibili.list.invalidate(); setVideoUrl(""); setVideoTitle(""); setVideoDesc(""); setShowAddForm(false); },
    onError: (err) => alert("添加失败: " + err.message),
  });
  const deleteVideo = trpc.bilibili.delete.useMutation({
    onSuccess: () => utils.bilibili.list.invalidate(),
    onError: (err) => alert("删除失败: " + err.message),
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".video-card", { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 70%", toggleActions: "play none none none" },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [videos?.length]);

  const handleAddVideo = () => {
    if (!videoUrl.trim() || !videoTitle.trim()) return;
    createVideo.mutate({ url: videoUrl.trim(), title: videoTitle.trim(), description: videoDesc || undefined });
  };

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
            {isAdmin ? (
              <button onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm border transition-all duration-400 hover:bg-black hover:text-white"
                style={{ borderColor: "#b1b1b1", borderRadius: "2px", color: "#000", backgroundColor: "transparent" }}>
                <Plus size={14} />{showAddForm ? "取消" : "添加视频"}
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "#b1b1b1" }}><Lock size={12} />管理员可编辑</div>
            )}
          </div>
        </div>

        {isAdmin && showAddForm && (
          <div className="mb-12 p-6" style={{ border: "1px solid #b1b1b1", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.6)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm tracking-wide" style={{ color: "#8d8d8d" }}>添加 B 站视频</h3>
              <button onClick={() => setShowAddForm(false)} className="transition-colors duration-300 hover:text-[#8d8d8d]"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="B 站视频链接 *" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px", backgroundColor: "#fff" }} />
              <input type="text" placeholder="视频标题 *" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px", backgroundColor: "#fff" }} />
              <input type="text" placeholder="描述 (可选)" value={videoDesc} onChange={(e) => setVideoDesc(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px", backgroundColor: "#fff" }} />
            </div>
            <button onClick={handleAddVideo} disabled={createVideo.isPending || !videoUrl.trim() || !videoTitle.trim()}
              className="mt-4 px-6 py-2.5 text-sm text-white transition-all disabled:opacity-40" style={{ backgroundColor: "#000", borderRadius: "2px" }}>
              {createVideo.isPending ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" />添加中...</span> : "确认添加"}
            </button>
          </div>
        )}

        {videos && videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <div key={video.id} className="video-card opacity-0 group cursor-pointer" onClick={() => setPlayingBvid(video.bvid)}>
                <div className="relative overflow-hidden" style={{ borderRadius: "4px", aspectRatio: "16/10" }}>
                  <img src={video.thumbnail || `/images/mimi-hero.jpg`} alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/images/mimi-hero.jpg"; }} />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-400">
                    <div className="w-14 h-14 flex items-center justify-center rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
                      <Play size={24} className="text-white ml-1" />
                    </div>
                  </div>
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 40%)" }} />
                  {isAdmin && (
                    <button onClick={(e) => { e.stopPropagation(); if (confirm("确定要删除这个视频吗？")) deleteVideo.mutate({ id: video.id }); }}
                      className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                      <X size={12} className="text-white" />
                    </button>
                  )}
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

        {isLoading && <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: "#b1b1b1" }} /></div>}
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
