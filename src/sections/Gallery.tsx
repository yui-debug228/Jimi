import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Upload, X, Loader2, Lock, Heart, Link2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import CropModal from "@/components/CropModal";

gsap.registerPlugin(ScrollTrigger);

// Preset images from public folder
const presetImages = [
  { id: "preset-hero", url: "/images/mimi-hero.jpg", title: "慵懒午后", description: "蜷缩在猫抓板窝里" },
  { id: "preset-portrait", url: "/images/mimi-portrait.jpg", title: "歪头杀", description: "好奇地看着镜头" },
  { id: "preset-play", url: "/images/mimi-play.jpg", title: "玩具时间", description: "专注地玩毛绒球" },
  { id: "preset-window", url: "/images/mimi-window.jpg", title: "窗台时光", description: "趴在窗边看风景" },
];

const bentoSpans = [
  "col-span-2 row-span-1", "col-span-1 row-span-2", "col-span-1 row-span-1",
  "col-span-1 row-span-1", "col-span-1 row-span-1", "col-span-1 row-span-1",
  "col-span-2 row-span-1", "col-span-1 row-span-1", "col-span-1 row-span-1",
];

export default function Gallery() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "link">("file");
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImage, setCropImage] = useState("");
  const [cropFileName, setCropFileName] = useState("");
  const { isAdmin } = useAdmin();
  const { isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: dbImages, isLoading: dbLoading } = trpc.image.list.useQuery();
  const { data: likeCounts } = trpc.like.counts.useQuery(
    dbImages?.map((i) => i.id) ?? [],
    { enabled: (dbImages?.length ?? 0) > 0 }
  );

  const createImage = trpc.image.create.useMutation({
    onSuccess: () => { utils.image.list.invalidate(); setUploadUrl(""); setUploadTitle(""); setUploadDesc(""); setShowUpload(false); setUploadingFile(false); },
    onError: (err) => { setUploadingFile(false); toast.error("添加失败: " + err.message); },
  });
  const deleteImage = trpc.image.delete.useMutation({
    onSuccess: () => utils.image.list.invalidate(),
    onError: (err) => toast.error("删除失败: " + err.message),
  });

  const presetList = presetImages.map((p) => ({ id: p.id, url: p.url, title: p.title, description: p.description }));
  const uploadedImages = (dbImages || []).map((img) => ({ id: img.id, url: img.url, title: img.title || "", description: img.description || "" }));
  const allImages = [...presetList, ...uploadedImages];

  // File upload with crop
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("请选择图片文件"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropImage(ev.target?.result as string);
      setCropFileName(file.name);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropped = async (croppedFile: File) => {
    setCropOpen(false);
    setUploadingFile(true);
    try {
      const token = localStorage.getItem("local_auth_token");
      if (!token) { toast.error("请先登录管理员账号"); setUploadingFile(false); return; }
      const formData = new FormData();
      formData.append("file", croppedFile);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "x-local-auth-token": token },
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        createImage.mutate({ url: data.url, title: uploadTitle || undefined, description: uploadDesc || undefined });
      } else {
        toast.error(data.error || "上传失败");
        setUploadingFile(false);
      }
    } catch (err) {
      toast.error("上传失败: " + String(err));
      setUploadingFile(false);
    }
  };

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
            <button onClick={() => setShowUpload(!showUpload)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm border transition-all duration-400 hover:bg-black hover:text-white"
              style={{ borderColor: "#b1b1b1", borderRadius: "2px", color: "#000", backgroundColor: "transparent" }}>
              <Upload size={14} />{showUpload ? "取消" : "添加图片"}
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "#b1b1b1" }}><Lock size={12} />管理员可编辑</div>
          )}
        </div>

        {isAdmin && showUpload && (
          <div className="mb-12 p-6" style={{ border: "1px solid #b1b1b1", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.6)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setUploadMode("file")} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 transition-all ${uploadMode === "file" ? "bg-black text-white" : "border"}`} style={{ borderRadius: "2px" }}><ImagePlus size={12} />本地上传</button>
                <button onClick={() => setUploadMode("link")} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 transition-all ${uploadMode === "link" ? "bg-black text-white" : "border"}`} style={{ borderRadius: "2px" }}><Link2 size={12} />链接添加</button>
              </div>
              <button onClick={() => setShowUpload(false)} className="transition-colors hover:text-[#8d8d8d]"><X size={16} /></button>
            </div>

            {uploadMode === "file" ? (
              <div>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFile || createImage.isPending}
                  className="w-full flex items-center justify-center gap-2 py-8 text-sm border border-dashed transition-all hover:bg-black hover:text-white hover:border-black disabled:opacity-40"
                  style={{ borderColor: "#e5e5e5", borderRadius: "4px", color: "#8d8d8d" }}>
                  {uploadingFile || createImage.isPending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {uploadingFile ? "上传中..." : createImage.isPending ? "保存中..." : "点击选择图片文件（支持裁剪）"}
                </button>
                <div className="flex gap-3 mt-3">
                  <input type="text" placeholder="标题 (可选)" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} className="flex-1 px-3 py-2 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px", backgroundColor: "#fff" }} />
                  <input type="text" placeholder="描述 (可选)" value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} className="flex-1 px-3 py-2 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px", backgroundColor: "#fff" }} />
                </div>
                <CropModal imageUrl={cropImage} fileName={cropFileName} aspect="free" open={cropOpen} onClose={() => setCropOpen(false)} onConfirm={handleCropped} />
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input type="text" placeholder="图片链接 (URL) *" value={uploadUrl} onChange={(e) => setUploadUrl(e.target.value)} className="px-4 py-2.5 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px", backgroundColor: "#fff" }} />
                  <input type="text" placeholder="标题 (可选)" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} className="px-4 py-2.5 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px", backgroundColor: "#fff" }} />
                  <input type="text" placeholder="描述 (可选)" value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} className="px-4 py-2.5 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px", backgroundColor: "#fff" }} />
                </div>
                <button onClick={() => { if (!uploadUrl.trim()) return; createImage.mutate({ url: uploadUrl.trim(), title: uploadTitle || undefined, description: uploadDesc || undefined }); }}
                  disabled={createImage.isPending || !uploadUrl.trim()} className="mt-4 px-6 py-2.5 text-sm text-white transition-all disabled:opacity-40" style={{ backgroundColor: "#000", borderRadius: "2px" }}>
                  {createImage.isPending ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" />添加中...</span> : "确认添加"}
                </button>
              </div>
            )}
          </div>
        )}

        <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-4 gap-2" style={{ transformStyle: "preserve-3d", transition: "transform 0.3s ease-out" }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
          {allImages.map((image, index) => {
            const spanClass = bentoSpans[index % bentoSpans.length];
            const isPreset = typeof image.id === "string" && image.id.startsWith("preset-");
            const likes = likeCounts?.[image.id] || 0;
            return (
              <div key={image.id} className={`gallery-item relative overflow-hidden opacity-0 group cursor-pointer ${spanClass}`} style={{ borderRadius: "4px" }}>
                <div className="relative w-full h-full" style={{ minHeight: "200px" }}>
                  <img src={image.url} alt={image.title || "米米的照片"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-4" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 50%)" }}>
                    {image.title && <p className="text-white text-sm tracking-wide">{image.title}</p>}
                    {image.description && <p className="text-white/70 text-xs mt-1">{image.description}</p>}
                  </div>
                </div>
                {isAdmin && !isPreset && (
                  <button onClick={(e) => { e.stopPropagation(); if (confirm("确定删除？")) deleteImage.mutate({ id: image.id }); }}
                    className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <X size={12} className="text-white" />
                  </button>
                )}
                {isAuthenticated && !isPreset && <LikeButton imageId={image.id} likeCount={likes} />}
                {!isAuthenticated && !isPreset && likes > 0 && (
                  <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <Heart size={12} className="text-red-400" /><span className="text-white text-xs">{likes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {dbLoading && <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: "#b1b1b1" }} /></div>}
      </div>
    </section>
  );
}

function LikeButton({ imageId, likeCount }: { imageId: number; likeCount: number }) {
  const utils = trpc.useUtils();
  const { data } = trpc.like.status.useQuery({ imageId });
  const toggle = trpc.like.toggle.useMutation({
    onSuccess: () => { utils.like.status.invalidate({ imageId }); utils.like.counts.invalidate(); },
  });
  const liked = data?.liked || false;

  return (
    <button onClick={(e) => { e.stopPropagation(); toggle.mutate({ imageId }); }} disabled={toggle.isPending}
      className="like-btn absolute bottom-2 left-2 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
      style={{ backgroundColor: liked ? "rgba(239,68,68,0.85)" : "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <Heart size={16} className={`transition-all ${liked ? "text-white fill-white" : "text-white"}`} />
      <span className="text-white text-xs font-medium">{likeCount}</span>
    </button>
  );
}
