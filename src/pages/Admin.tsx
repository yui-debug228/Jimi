import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import {
  ArrowLeft, Image, Play, Shield, Loader2,
  Settings, Type, Cat, Save, X, Edit3,
  Users, Heart, BarChart3, TrendingUp,
  FileText, Activity, Bug,
} from "lucide-react";
import siteData from "@/data/siteData.json";

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
      <ImageManagement />
      <VideoManagement />
    </div>
  );
}

// ─── Stats Dashboard ───
function StatsDashboard() {
  const stats = {
    totalUsers: 1,
    adminCount: 1,
    regularUserCount: 0,
    totalImages: siteData.gallery.images.length,
    totalVideos: siteData.videos.length,
    totalLikes: 42,
  };

  const cards = [
    { label: "总用户", value: stats.totalUsers, icon: Users, color: "#000" },
    { label: "管理员", value: stats.adminCount, icon: Shield, color: "#8d8d8d" },
    { label: "普通用户", value: stats.regularUserCount, icon: Users, color: "#b1b1b1" },
    { label: "图片数", value: stats.totalImages, icon: Image, color: "#000" },
    { label: "视频数", value: stats.totalVideos, icon: Play, color: "#8d8d8d" },
    { label: "总点赞", value: stats.totalLikes, icon: Heart, color: "#ef4444" },
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
    </section>
  );
}

// ─── Site Config Editor ───
function SiteConfigEditor() {
  const [form, setForm] = useState({
    heroImage: siteData.hero.heroImage,
    heroTitle: siteData.hero.heroTitle,
    heroSubtitle: siteData.hero.heroSubtitle,
    aboutPortrait: siteData.about.aboutPortrait,
    aboutText: siteData.about.aboutText,
    catName: siteData.about.catName,
    catBreed: siteData.about.catBreed,
    catAge: siteData.about.catAge,
    catPersonality: siteData.about.catPersonality,
  });
  const [saved, setSaved] = useState(false);

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSave = () => {
    // In static mode, this only updates local state (no backend)
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <section>
      <h2 className="serif-display flex items-center gap-2 mb-6" style={{ fontSize: "20px", letterSpacing: "0.03em" }}>
        <Settings size={18} /> 网站配置
      </h2>
      <div className="p-6 space-y-5" style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px" }}>
        <div>
          <label className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: "#8d8d8d" }}><Image size={10} /> 头图 (16:9)</label>
          <input type="text" value={form.heroImage} onChange={(e) => update("heroImage", e.target.value)}
            className="w-full px-3 py-2 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px" }} placeholder="图片 URL" />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: "#8d8d8d" }}><Type size={10} /> 头图标题（换行分隔）</label>
          <textarea value={form.heroTitle} onChange={(e) => update("heroTitle", e.target.value)}
            className="w-full px-3 py-2 text-sm border outline-none focus:border-black resize-none" style={{ borderColor: "#e5e5e5", borderRadius: "2px", minHeight: "60px" }} />
        </div>
        <div>
          <label className="text-xs mb-1.5 block" style={{ color: "#8d8d8d" }}>副标题</label>
          <input type="text" value={form.heroSubtitle} onChange={(e) => update("heroSubtitle", e.target.value)}
            className="w-full px-3 py-2 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px" }} />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: "#8d8d8d" }}><Image size={10} /> 肖像图 (3:4)</label>
          <input type="text" value={form.aboutPortrait} onChange={(e) => update("aboutPortrait", e.target.value)}
            className="w-full px-3 py-2 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px" }} placeholder="图片 URL" />
        </div>
        <div>
          <label className="text-xs mb-1.5 block" style={{ color: "#8d8d8d" }}>介绍文字</label>
          <textarea value={form.aboutText} onChange={(e) => update("aboutText", e.target.value)}
            className="w-full px-3 py-2 text-sm border outline-none focus:border-black resize-none" style={{ borderColor: "#e5e5e5", borderRadius: "2px", minHeight: "80px" }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[{ key: "catName", label: "名字" }, { key: "catBreed", label: "品种" }, { key: "catAge", label: "年龄" }, { key: "catPersonality", label: "性格" }].map((f) => (
            <div key={f.key}>
              <label className="flex items-center gap-1 text-xs mb-1.5" style={{ color: "#8d8d8d" }}><Cat size={10} /> {f.label}</label>
              <input type="text" value={form[f.key as keyof typeof form] || ""} onChange={(e) => update(f.key, e.target.value)}
                className="w-full px-3 py-2 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px" }} />
            </div>
          ))}
        </div>
        <button onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 text-sm text-white transition-opacity"
          style={{ backgroundColor: saved ? "#4caf50" : "#000", borderRadius: "2px" }}>
          <Save size={14} />
          {saved ? "已保存（仅本地）" : "保存配置"}
        </button>
      </div>
    </section>
  );
}

// ─── Image Management ───
function ImageManagement() {
  const images = siteData.gallery.images;
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="serif-display flex items-center gap-2" style={{ fontSize: "20px", letterSpacing: "0.03em" }}>
          <Image size={18} /> 图片管理
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {images.map((img) => (
          <div key={img.id} className="group relative overflow-hidden" style={{ borderRadius: "4px", aspectRatio: "1" }}>
            <img src={img.url} alt={img.title || ""} className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 60%)" }}>
              <p className="text-white text-xs truncate">{img.title}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Video Management ───
function VideoManagement() {
  const videos = siteData.videos;
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="serif-display flex items-center gap-2" style={{ fontSize: "20px", letterSpacing: "0.03em" }}>
          <Play size={18} /> 视频管理
        </h2>
      </div>
      {videos.length > 0 ? (
        <div className="space-y-3">
          {videos.map((video) => (
            <div key={video.id} className="flex items-start gap-4 p-4" style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px" }}>
              <div className="shrink-0 overflow-hidden" style={{ width: "120px", height: "68px", borderRadius: "2px" }}>
                <img src={video.thumbnail || "images/mimi-hero.jpg"} alt={video.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{video.title}</p>
                <p className="text-xs mt-0.5" style={{ color: "#b1b1b1" }}>BV: {video.bvid}</p>
                {video.description && <p className="text-xs mt-0.5" style={{ color: "#b1b1b1" }}>{video.description}</p>}
              </div>
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
  return (
    <section>
      <h2 className="serif-display flex items-center gap-2 mb-6" style={{ fontSize: "20px", letterSpacing: "0.03em" }}>
        <FileText size={18} /> 管理员操作日志
      </h2>
      <div className="flex justify-center py-12 text-sm" style={{ color: "#b1b1b1", border: "1px dashed #e5e5e5", borderRadius: "4px" }}>静态模式下无操作日志</div>
    </section>
  );
}

// ─── Debug Tab ───
function DebugTab() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="serif-display flex items-center gap-2 mb-4" style={{ fontSize: "20px", letterSpacing: "0.03em" }}>
          <Bug size={18} /> 认证调试日志
        </h2>
        <div className="flex justify-center py-12 text-sm" style={{ color: "#b1b1b1", border: "1px dashed #e5e5e5", borderRadius: "4px" }}>静态模式下无调试日志</div>
      </section>
    </div>
  );
}
