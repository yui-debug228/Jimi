import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import {
  ArrowLeft, Image, Play, Trash2, Loader2, Shield,
  Plus, Settings, Type, Cat, Save, X, Edit3,
  Users, Heart, BarChart3, TrendingUp, Upload,
  FileText, Activity, Bug,
} from "lucide-react";
import CropModal, { type CropAspect } from "@/components/CropModal";

/** Upload file via multipart/form-data, return URL */
async function uploadFileMultipart(file: File): Promise<string | null> {
  const token = localStorage.getItem("local_auth_token");
  if (!token) { toast.error("请先登录"); return null; }
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "x-local-auth-token": token },
    body: formData,
  });
  const data = await res.json();
  if (data.success && data.url) return data.url;
  toast.error(data.error || "上传失败");
  return null;
}

// ─── Image Input with Crop + Upload ───
function ImageInput({ value, onChange, placeholder, cropAspect = "free" }: { value: string; onChange: (url: string) => void; placeholder: string; cropAspect?: CropAspect }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImage, setCropImage] = useState("");
  const [cropFileName, setCropFileName] = useState("");

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
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleCropped = async (croppedFile: File) => {
    setUploading(true);
    const url = await uploadFileMultipart(croppedFile);
    if (url) onChange(url);
    setUploading(false);
    setCropImage("");
  };

  return (
    <>
      <div className="flex gap-2">
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px" }} placeholder={placeholder} />
        <input type="file" accept="image/*" ref={fileRef} onChange={handleFileSelect} className="hidden" />
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="shrink-0 px-3 py-2 text-xs border transition-all duration-300 hover:bg-black hover:text-white hover:border-black disabled:opacity-40"
          style={{ borderColor: "#e5e5e5", borderRadius: "2px" }}>
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
        </button>
        {value && <img src={value} alt="preview" className="w-16 h-10 object-cover rounded" style={{ border: "1px solid #e5e5e5" }} />}
      </div>
      <CropModal imageUrl={cropImage} fileName={cropFileName} aspect={cropAspect} open={cropOpen} onClose={() => setCropOpen(false)} onConfirm={handleCropped} />
    </>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState<"config" | "logs" | "debug">("config");

  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!isAuthenticated) navigate("/login");
      else if (!isAdmin) navigate("/");
    }
  }, [isAuthenticated, isAdmin, authLoading, adminLoading, navigate]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f2f2f2" }}>
        <Loader2 size={24} className="animate-spin" style={{ color: "#b1b1b1" }} />
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div style={{ backgroundColor: "#f2f2f2", minHeight: "100vh" }}>
      <header className="flex items-center justify-between px-8 md:px-16" style={{ height: "80px", borderBottom: "1px solid #e5e5e5" }}>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-sm transition-colors duration-300 hover:text-[#8d8d8d]">
            <ArrowLeft size={16} /> 返回首页
          </button>
          <div className="w-px h-4 bg-[#e5e5e5]" />
          <h1 className="serif-display" style={{ fontSize: "18px", letterSpacing: "0.05em" }}>管理后台</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 text-xs rounded-full" style={{ backgroundColor: isAuthenticated ? "#e8f5e9" : "#ffebee", color: isAuthenticated ? "#2e7d32" : "#c62828" }}>
            <Activity size={12} />
            {isAuthenticated ? `${user?.name} (${user?.role})` : "未认证"}
          </div>
          <Shield size={14} style={{ color: "#b1b1b1" }} />
          <span className="text-xs" style={{ color: "#b1b1b1" }}>{user?.name}</span>
        </div>
      </header>

      <div className="px-8 md:px-16 pt-6 pb-2">
        <div className="flex gap-2">
          {[
            { key: "config" as const, label: "配置管理", icon: Settings },
            { key: "logs" as const, label: "操作日志", icon: FileText },
            { key: "debug" as const, label: "认证调试", icon: Bug },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs transition-all ${activeTab === tab.key ? "bg-black text-white" : "border hover:bg-gray-100"}`}
              style={{ borderRadius: "2px" }}>
              <tab.icon size={12} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-8 md:px-16 py-8 max-w-5xl mx-auto">
        {activeTab === "config" && <ConfigTab />}
        {activeTab === "logs" && <LogsTab />}
        {activeTab === "debug" && <DebugTab />}
      </div>
    </div>
  );
}

// ─── Config Tab ───
function ConfigTab() {
  return (
    <div className="space-y-16">
      <StatsDashboard />
      <SiteConfigEditor />
      <PresetImageManager />
      <ImageManagement />
      <VideoManagement />
    </div>
  );
}

// ─── Stats Dashboard ───
function StatsDashboard() {
  const { data: stats, isLoading } = trpc.stats.dashboard.useQuery();
  if (isLoading) return <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin" style={{ color: "#b1b1b1" }} /></div>;

  const cards = [
    { label: "总用户", value: stats?.totalUsers || 0, icon: Users, color: "#000" },
    { label: "管理员", value: stats?.adminCount || 0, icon: Shield, color: "#8d8d8d" },
    { label: "普通用户", value: stats?.regularUserCount || 0, icon: Users, color: "#b1b1b1" },
    { label: "图片数", value: stats?.totalImages || 0, icon: Image, color: "#000" },
    { label: "视频数", value: stats?.totalVideos || 0, icon: Play, color: "#8d8d8d" },
    { label: "总点赞", value: stats?.totalLikes || 0, icon: Heart, color: "#ef4444" },
  ];

  return (
    <section>
      <h2 className="serif-display flex items-center gap-2 mb-6" style={{ fontSize: "20px", letterSpacing: "0.03em" }}>
        <BarChart3 size={18} /> 数据概览
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="p-5 flex items-center gap-4" style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px" }}>
            <div className="w-10 h-10 flex items-center justify-center rounded-full" style={{ backgroundColor: "#f2f2f2" }}>
              <card.icon size={18} style={{ color: card.color }} />
            </div>
            <div>
              <p className="text-2xl font-light" style={{ color: "#000" }}>{card.value}</p>
              <p className="text-xs mt-0.5" style={{ color: "#b1b1b1" }}>{card.label}</p>
            </div>
          </div>
        ))}
      </div>
      {stats?.likeDistribution && stats.likeDistribution.length > 0 && (
        <div className="mt-6 p-5" style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px" }}>
          <h3 className="flex items-center gap-1.5 text-sm mb-4" style={{ color: "#8d8d8d" }}>
            <TrendingUp size={14} /> 点赞排行
          </h3>
          <div className="space-y-2">
            {stats.likeDistribution.map((item) => {
              const maxCount = stats.likeDistribution[0]?.count || 1;
              const pct = (item.count / maxCount) * 100;
              return (
                <div key={item.imageId} className="flex items-center gap-3">
                  <span className="text-xs w-24 truncate" style={{ color: "#8d8d8d" }}>{item.imageId}</span>
                  <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ backgroundColor: "#f2f2f2" }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: "#ef4444" }} />
                  </div>
                  <span className="text-xs w-8 text-right">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Site Config Editor ───
function SiteConfigEditor() {
  const utils = trpc.useUtils();
  const { data: config, isLoading } = trpc.siteConfig.list.useQuery();
  const batchSet = trpc.siteConfig.batchSet.useMutation({
    onSuccess: () => { utils.siteConfig.list.invalidate(); setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });
  const [form, setForm] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (config) setForm(config); }, [config]);
  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSave = () => {
    const entries = Object.entries(form).map(([key, value]) => ({ key, value }));
    batchSet.mutate(entries);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin" style={{ color: "#b1b1b1" }} /></div>;

  return (
    <section>
      <h2 className="serif-display flex items-center gap-2 mb-6" style={{ fontSize: "20px", letterSpacing: "0.03em" }}>
        <Settings size={18} /> 网站配置
      </h2>
      <div className="p-6 space-y-5" style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px" }}>
        <div>
          <label className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: "#8d8d8d" }}><Image size={10} /> 头图 (16:9)</label>
          <ImageInput value={form.heroImage || ""} onChange={(v) => update("heroImage", v)} placeholder="图片 URL 或点击上传" cropAspect="16:9" />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: "#8d8d8d" }}><Type size={10} /> 头图标题（换行分隔）</label>
          <textarea value={form.heroTitle || ""} onChange={(e) => update("heroTitle", e.target.value)}
            className="w-full px-3 py-2 text-sm border outline-none focus:border-black resize-none" style={{ borderColor: "#e5e5e5", borderRadius: "2px", minHeight: "60px" }} />
        </div>
        <div>
          <label className="text-xs mb-1.5 block" style={{ color: "#8d8d8d" }}>副标题</label>
          <input type="text" value={form.heroSubtitle || ""} onChange={(e) => update("heroSubtitle", e.target.value)}
            className="w-full px-3 py-2 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px" }} />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: "#8d8d8d" }}><Image size={10} /> 肖像图 (3:4)</label>
          <ImageInput value={form.aboutPortrait || ""} onChange={(v) => update("aboutPortrait", v)} placeholder="图片 URL 或点击上传" cropAspect="3:4" />
        </div>
        <div>
          <label className="text-xs mb-1.5 block" style={{ color: "#8d8d8d" }}>介绍文字</label>
          <textarea value={form.aboutText || ""} onChange={(e) => update("aboutText", e.target.value)}
            className="w-full px-3 py-2 text-sm border outline-none focus:border-black resize-none" style={{ borderColor: "#e5e5e5", borderRadius: "2px", minHeight: "80px" }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[{ key: "catName", label: "名字" }, { key: "catBreed", label: "品种" }, { key: "catAge", label: "年龄" }, { key: "catPersonality", label: "性格" }].map((f) => (
            <div key={f.key}>
              <label className="flex items-center gap-1 text-xs mb-1.5" style={{ color: "#8d8d8d" }}><Cat size={10} /> {f.label}</label>
              <input type="text" value={form[f.key] || ""} onChange={(e) => update(f.key, e.target.value)}
                className="w-full px-3 py-2 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px" }} />
            </div>
          ))}
        </div>
        <button onClick={handleSave} disabled={batchSet.isPending}
          className="flex items-center gap-2 px-5 py-2.5 text-sm text-white transition-opacity disabled:opacity-40"
          style={{ backgroundColor: saved ? "#4caf50" : "#000", borderRadius: "2px" }}>
          {batchSet.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saved ? "已保存" : batchSet.isPending ? "保存中..." : "保存配置"}
        </button>
      </div>
    </section>
  );
}

// ─── Preset Image Manager ───
function PresetImageManager() {
  const utils = trpc.useUtils();
  const { data: presets, isLoading } = trpc.presetImage.list.useQuery();
  const update = trpc.presetImage.update.useMutation({ onSuccess: () => { utils.presetImage.list.invalidate(); setEditingSlot(null); } });
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ url: "", title: "", description: "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImage, setCropImage] = useState("");
  const [cropFileName, setCropFileName] = useState("");

  const slotLabels: Record<string, string> = { hero: "头图", portrait: "肖像照", play: "玩耍照", window: "窗台照" };
  const slotAspects: Record<string, CropAspect> = { hero: "16:9", portrait: "3:4", play: "1:1", window: "1:1" };

  const startEdit = (slot: string) => {
    const p = presets?.[slot];
    if (p) { setEditForm({ url: p.url, title: p.title || "", description: p.description || "" }); setEditingSlot(slot); }
  };

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
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleCropped = async (croppedFile: File) => {
    setUploading(true);
    const url = await uploadFileMultipart(croppedFile);
    if (url) setEditForm((p) => ({ ...p, url }));
    setUploading(false);
    setCropImage("");
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin" style={{ color: "#b1b1b1" }} /></div>;

  return (
    <section>
      <h2 className="serif-display flex items-center gap-2 mb-6" style={{ fontSize: "20px", letterSpacing: "0.03em" }}>
        <Image size={18} /> 预设图片管理
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {presets && Object.entries(presets).map(([slot, data]) => (
          <div key={slot} className="group relative" style={{ borderRadius: "4px", overflow: "hidden", border: "1px solid #e5e5e5" }}>
            <div style={{ aspectRatio: "1" }}><img src={data.url} alt={data.title || slot} className="w-full h-full object-cover" /></div>
            <div className="p-2.5" style={{ backgroundColor: "#fff" }}>
              <p className="text-xs font-medium">{slotLabels[slot] || slot}</p>
              <p className="text-xs mt-0.5" style={{ color: "#b1b1b1" }}>{data.title}</p>
            </div>
            <button onClick={() => startEdit(slot)}
              className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
              <Edit3 size={12} className="text-white" />
            </button>
          </div>
        ))}
      </div>
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setEditingSlot(null)}>
          <div className="w-full max-w-md p-6" style={{ backgroundColor: "#fff", borderRadius: "4px" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm">编辑 {slotLabels[editingSlot]}</h3>
              <button onClick={() => setEditingSlot(null)}><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs block mb-1" style={{ color: "#8d8d8d" }}>图片</label>
                <div className="flex gap-2">
                  <input type="text" value={editForm.url} onChange={(e) => setEditForm((p) => ({ ...p, url: e.target.value }))}
                    className="flex-1 px-3 py-2 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px" }} />
                  <input type="file" accept="image/*" ref={fileRef} onChange={handleFileSelect} className="hidden" />
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="shrink-0 px-3 py-2 text-xs border transition-all hover:bg-black hover:text-white disabled:opacity-40" style={{ borderColor: "#e5e5e5", borderRadius: "2px" }}>
                    {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                  </button>
                </div>
                {editForm.url && <img src={editForm.url} alt="preview" className="mt-2 w-full h-32 object-cover rounded" style={{ border: "1px solid #e5e5e5" }} />}
                {cropOpen && editingSlot && (
                  <CropModal imageUrl={cropImage} fileName={cropFileName} aspect={slotAspects[editingSlot] || "free"} open={cropOpen} onClose={() => setCropOpen(false)} onConfirm={handleCropped} />
                )}
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: "#8d8d8d" }}>标题</label>
                <input type="text" value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px" }} />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: "#8d8d8d" }}>描述</label>
                <input type="text" value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px" }} />
              </div>
            </div>
            <button onClick={() => { if (!editingSlot || !editForm.url.trim()) return; update.mutate({ slot: editingSlot, url: editForm.url.trim(), title: editForm.title || undefined, description: editForm.description || undefined }); }}
              disabled={update.isPending} className="mt-4 w-full py-2.5 text-sm text-white disabled:opacity-40" style={{ backgroundColor: "#000", borderRadius: "2px" }}>
              {update.isPending ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Image Management ───
function ImageManagement() {
  const utils = trpc.useUtils();
  const { data: images, isLoading } = trpc.image.list.useQuery();
  const [showAdd, setShowAdd] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const createImage = trpc.image.create.useMutation({
    onSuccess: () => { utils.image.list.invalidate(); setUrl(""); setTitle(""); setDesc(""); setShowAdd(false); },
    onError: (err) => {
      const msg = err.message || "";
      if (msg.includes("UNAUTHORIZED")) toast.error("请先登录管理员账号");
      else if (msg.includes("FORBIDDEN")) toast.error("需要管理员权限");
      else toast.error("添加失败: " + msg);
    },
  });
  const deleteImage = trpc.image.delete.useMutation({
    onSuccess: () => utils.image.list.invalidate(),
    onError: (err) => toast.error("删除失败: " + (err.message || "未知错误")),
  });

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="serif-display flex items-center gap-2" style={{ fontSize: "20px", letterSpacing: "0.03em" }}>
          <Image size={18} /> 图片管理
        </h2>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 text-xs px-4 py-2 transition-all duration-300 hover:bg-black hover:text-white" style={{ border: "1px solid #e5e5e5", borderRadius: "2px" }}>
          {showAdd ? "取消" : <><Plus size={12} /> 添加图片</>}
        </button>
      </div>
      {showAdd && (
        <div className="p-5 mb-6" style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px" }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input type="text" placeholder="图片链接 *" value={url} onChange={(e) => setUrl(e.target.value)}
              className="px-3 py-2 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px" }} />
            <input type="text" placeholder="标题" value={title} onChange={(e) => setTitle(e.target.value)}
              className="px-3 py-2 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px" }} />
            <input type="text" placeholder="描述" value={desc} onChange={(e) => setDesc(e.target.value)}
              className="px-3 py-2 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px" }} />
          </div>
          <button onClick={() => { if (!url.trim()) return; createImage.mutate({ url: url.trim(), title: title || undefined, description: desc || undefined }); }}
            disabled={createImage.isPending || !url.trim()} className="mt-3 px-5 py-2 text-xs text-white bg-black disabled:opacity-40" style={{ borderRadius: "2px" }}>
            {createImage.isPending ? "添加中..." : "确认添加"}
          </button>
        </div>
      )}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin" style={{ color: "#b1b1b1" }} /></div>
      ) : images && images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map((img) => (
            <div key={img.id} className="group relative overflow-hidden" style={{ borderRadius: "4px", aspectRatio: "1" }}>
              <img src={img.url} alt={img.title || ""} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 60%)" }}>
                <p className="text-white text-xs truncate">{img.title}</p>
                <button onClick={() => { if (confirm("删除？")) deleteImage.mutate({ id: img.id }); }}
                  className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                  <Trash2 size={10} className="text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex justify-center py-12 text-sm" style={{ color: "#b1b1b1", border: "1px dashed #e5e5e5", borderRadius: "4px" }}>暂无上传的图片</div>
      )}
    </section>
  );
}

// ─── Video Management ───
function VideoManagement() {
  const utils = trpc.useUtils();
  const { data: videos, isLoading } = trpc.bilibili.list.useQuery();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [thumbnail, setThumbnail] = useState("");

  const createVideo = trpc.bilibili.create.useMutation({
    onSuccess: () => { utils.bilibili.list.invalidate(); setUrl(""); setTitle(""); setDesc(""); setShowAdd(false); },
  });
  const updateVideo = trpc.bilibili.update.useMutation({
    onSuccess: () => { utils.bilibili.list.invalidate(); setEditId(null); },
  });
  const deleteVideo = trpc.bilibili.delete.useMutation({
    onSuccess: () => utils.bilibili.list.invalidate(),
  });

  const startEdit = (video: { id: number; title: string; description: string | null; thumbnail: string | null }) => {
    setEditId(video.id); setTitle(video.title); setDesc(video.description || ""); setThumbnail(video.thumbnail || "");
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="serif-display flex items-center gap-2" style={{ fontSize: "20px", letterSpacing: "0.03em" }}>
          <Play size={18} /> 视频管理
        </h2>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 text-xs px-4 py-2 transition-all duration-300 hover:bg-black hover:text-white" style={{ border: "1px solid #e5e5e5", borderRadius: "2px" }}>
          {showAdd ? "取消" : <><Plus size={12} /> 添加视频</>}
        </button>
      </div>
      {showAdd && (
        <div className="p-5 mb-6" style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px" }}>
          <div className="space-y-3">
            <input type="text" placeholder="B站视频链接 *" value={url} onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px" }} />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="视频标题 *" value={title} onChange={(e) => setTitle(e.target.value)}
                className="px-3 py-2 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px" }} />
              <input type="text" placeholder="描述" value={desc} onChange={(e) => setDesc(e.target.value)}
                className="px-3 py-2 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px" }} />
            </div>
          </div>
          <button onClick={() => { if (!url.trim() || !title.trim()) return; createVideo.mutate({ url: url.trim(), title: title.trim(), description: desc || undefined }); }}
            disabled={createVideo.isPending || !url.trim() || !title.trim()} className="mt-3 px-5 py-2 text-xs text-white bg-black disabled:opacity-40" style={{ borderRadius: "2px" }}>
            {createVideo.isPending ? "添加中..." : "确认添加"}
          </button>
        </div>
      )}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin" style={{ color: "#b1b1b1" }} /></div>
      ) : videos && videos.length > 0 ? (
        <div className="space-y-3">
          {videos.map((video) => (
            <div key={video.id} className="flex items-start gap-4 p-4" style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px" }}>
              <div className="shrink-0 overflow-hidden" style={{ width: "120px", height: "68px", borderRadius: "2px" }}>
                <img src={video.thumbnail || "/images/mimi-hero.jpg"} alt={video.title} className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/images/mimi-hero.jpg"; }} />
              </div>
              <div className="flex-1 min-w-0">
                {editId === video.id ? (
                  <div className="space-y-2">
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-2 py-1 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5" }} />
                    <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)}
                      className="w-full px-2 py-1 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5" }} placeholder="描述" />
                    <input type="text" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)}
                      className="w-full px-2 py-1 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5" }} placeholder="缩略图 URL" />
                    <div className="flex gap-2">
                      <button onClick={() => { if (!editId || !title.trim()) return; updateVideo.mutate({ id: editId, title: title.trim(), description: desc || undefined, thumbnail: thumbnail || undefined }); }}
                        disabled={updateVideo.isPending} className="px-3 py-1 text-xs text-white bg-black disabled:opacity-40" style={{ borderRadius: "2px" }}>保存</button>
                      <button onClick={() => setEditId(null)} className="px-3 py-1 text-xs" style={{ color: "#b1b1b1" }}>取消</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm">{video.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#b1b1b1" }}>BV: {video.bvid}</p>
                    {video.description && <p className="text-xs mt-0.5" style={{ color: "#b1b1b1" }}>{video.description}</p>}
                  </>
                )}
              </div>
              {editId !== video.id && (
                <div className="shrink-0 flex items-center gap-1">
                  <button onClick={() => startEdit(video)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                    <Edit3 size={14} style={{ color: "#8d8d8d" }} />
                  </button>
                  <button onClick={() => { if (confirm("删除？")) deleteVideo.mutate({ id: video.id }); }}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors">
                    <Trash2 size={14} style={{ color: "#c62828" }} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex justify-center py-12 text-sm" style={{ color: "#b1b1b1", border: "1px dashed #e5e5e5", borderRadius: "4px" }}>暂无视频</div>
      )}
    </section>
  );
}

// ─── Logs Tab ───
function LogsTab() {
  const { data: logs, isLoading } = trpc.audit.list.useQuery({ limit: 100 });

  const actionLabels: Record<string, string> = {
    create: "创建", delete: "删除", update: "修改", batchUpdate: "批量修改",
  };
  const targetLabels: Record<string, string> = {
    image: "图片", video: "视频", siteConfig: "网站配置", presetImage: "预设图片",
  };

  return (
    <section>
      <h2 className="serif-display flex items-center gap-2 mb-6" style={{ fontSize: "20px", letterSpacing: "0.03em" }}>
        <FileText size={18} /> 管理员操作日志
      </h2>
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin" style={{ color: "#b1b1b1" }} /></div>
      ) : logs && logs.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e5e5" }}>
                <th className="text-left py-2 px-3 text-xs font-normal" style={{ color: "#b1b1b1" }}>时间</th>
                <th className="text-left py-2 px-3 text-xs font-normal" style={{ color: "#b1b1b1" }}>管理员</th>
                <th className="text-left py-2 px-3 text-xs font-normal" style={{ color: "#b1b1b1" }}>操作</th>
                <th className="text-left py-2 px-3 text-xs font-normal" style={{ color: "#b1b1b1" }}>对象</th>
                <th className="text-left py-2 px-3 text-xs font-normal" style={{ color: "#b1b1b1" }}>详情</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white transition-colors" style={{ borderBottom: "1px solid #f2f2f2" }}>
                  <td className="py-2.5 px-3 text-xs whitespace-nowrap" style={{ color: "#8d8d8d" }}>
                    {new Date(log.createdAt).toLocaleString("zh-CN")}
                  </td>
                  <td className="py-2.5 px-3 text-xs">{log.userName ?? "-"}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                      backgroundColor: log.action === "delete" ? "#ffebee" : log.action === "create" ? "#e8f5e9" : "#f2f2f2",
                      color: log.action === "delete" ? "#c62828" : log.action === "create" ? "#2e7d32" : "#000",
                    }}>
                      {actionLabels[log.action] || log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-xs">{targetLabels[log.target] || log.target}{log.targetId ? ` #${log.targetId}` : ""}</td>
                  <td className="py-2.5 px-3 text-xs max-w-xs truncate" style={{ color: "#8d8d8d" }}>{log.details ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex justify-center py-12 text-sm" style={{ color: "#b1b1b1", border: "1px dashed #e5e5e5", borderRadius: "4px" }}>暂无操作记录</div>
      )}
    </section>
  );
}

// ─── Debug Tab ───
function DebugTab() {
  const { data: debugLogs, isLoading } = trpc.audit.authDebug.useQuery({ limit: 50 });

  return (
    <div className="space-y-8">
      <section>
        <h2 className="serif-display flex items-center gap-2 mb-4" style={{ fontSize: "20px", letterSpacing: "0.03em" }}>
          <Bug size={18} /> 认证调试日志
        </h2>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin" style={{ color: "#b1b1b1" }} /></div>
        ) : debugLogs && debugLogs.length > 0 ? (
          <div className="space-y-2">
            {debugLogs.map((log) => (
              <div key={log.id} className="p-3 text-xs" style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{log.event}</span>
                  <span style={{ color: "#b1b1b1" }}>{new Date(log.createdAt).toLocaleTimeString("zh-CN")}</span>
                </div>
                <p style={{ color: "#8d8d8d" }}>{log.details}</p>
                {log.headers && <p className="mt-1" style={{ color: "#b1b1b1" }}>Headers: {log.headers}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center py-12 text-sm" style={{ color: "#b1b1b1", border: "1px dashed #e5e5e5", borderRadius: "4px" }}>暂无调试日志</div>
        )}
      </section>
    </div>
  );
}
