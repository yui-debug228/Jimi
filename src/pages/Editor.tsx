import { useState, useEffect, type ChangeEvent } from "react";
import siteData from "@/data/siteData.json";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Image, Video, Type, Download, RotateCcw, Trash2, Plus, Upload, Save, ArrowLeft, Shield } from "lucide-react";
import { useNavigate } from "react-router";

export default function Editor() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { isAdmin } = useAdmin();
  const [data, setData] = useState(() => {
    try {
      const stored = localStorage.getItem("siteData_override");
      return stored ? JSON.parse(stored) : siteData;
    } catch {
      return siteData;
    }
  });
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // 权限检查：只有管理员能访问编辑器
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (!isAdmin) {
      navigate("/");
    }
  }, [isAuthenticated, isAdmin, navigate]);

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f2f2f2" }}>
        <div className="text-center">
          <Shield size={32} style={{ color: "#b1b1b1" }} className="mx-auto mb-4" />
          <p style={{ color: "#8d8d8d" }}>请先以管理员身份登录</p>
        </div>
      </div>
    );
  }
    setData((prev: typeof siteData) => {
      const keys = path.split('.');
      const copy: Record<string, unknown> = { ...prev };
      let node = copy;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        node[key] = { ...(node[key] as Record<string, unknown>) };
        node = node[key] as Record<string, unknown>;
      }
      node[keys[keys.length - 1]] = value;
      return copy as typeof siteData;
    });
    setSaved(false);
    setExportUrl(null);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const newImage = {
        id: `upload-${Date.now()}`,
        url: base64,
        title: file.name.replace(/\.[^/.]+$/, ""),
        description: ""
      };
      setData((prev: typeof siteData) => ({
        ...prev,
        gallery: { ...prev.gallery, images: [...prev.gallery.images, newImage] }
      }));
      setSaved(false);
      setExportUrl(null);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const updateImage = (index: number, field: string, value: string) => {
    setData((prev: typeof siteData) => ({
      ...prev,
      gallery: {
        ...prev.gallery,
        images: prev.gallery.images.map((img, i) => i === index ? { ...img, [field]: value } : img)
      }
    }));
    setSaved(false);
    setExportUrl(null);
  };

  const removeImage = (index: number) => {
    setData((prev: typeof siteData) => ({
      ...prev,
      gallery: { ...prev.gallery, images: prev.gallery.images.filter((_, i) => i !== index) }
    }));
    setSaved(false);
    setExportUrl(null);
  };

  const addVideo = () => {
    setData((prev: typeof siteData) => ({
      ...prev,
      videos: [...prev.videos, { id: Date.now(), bvid: "", title: "新视频", description: "", thumbnail: "images/mimi-hero.jpg" }]
    }));
    setSaved(false);
    setExportUrl(null);
  };

  const updateVideo = (index: number, field: string, value: string) => {
    setData((prev: typeof siteData) => ({
      ...prev,
      videos: prev.videos.map((v, i) => i === index ? { ...v, [field]: value } : v)
    }));
    setSaved(false);
    setExportUrl(null);
  };

  const removeVideo = (index: number) => {
    setData((prev: typeof siteData) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));
    setSaved(false);
    setExportUrl(null);
  };

  const handleSave = () => {
    try {
      localStorage.setItem("siteData_override", JSON.stringify(data));
      setSaved(true);
      setExportUrl(null);
      alert("已保存！刷新页面即可看到新内容。");
    } catch {
      alert("保存失败，请导出 JSON。");
    }
  };

  const handleExport = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    setExportUrl(URL.createObjectURL(blob));
  };

  const handleReset = () => {
    if (confirm("确定重置？所有修改将丢失。")) {
      setData(siteData);
      localStorage.removeItem("siteData_override");
      setSaved(false);
      setExportUrl(null);
    }
  };

  return (
    <div style={{ backgroundColor: "#f2f2f2", minHeight: "100vh" }}>
      <header className="flex items-center justify-between px-8 md:px-16" style={{ height: "80px", borderBottom: "1px solid #e5e5e5" }}>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-sm transition-colors hover:text-[#8d8d8d]">
            <ArrowLeft size={16} /> 返回首页
          </button>
          <div className="w-px h-4 bg-[#e5e5e5]" />
          <h1 className="serif-display" style={{ fontSize: "18px", letterSpacing: "0.05em" }}>内容编辑器</h1>
        </div>
      </header>

      <div className="px-8 md:px-16 py-8 max-w-5xl mx-auto space-y-12">
        {saved && (
          <div className="p-4" style={{ backgroundColor: "#e8f5e9", borderRadius: "4px" }}>
            <p className="text-sm" style={{ color: "#2e7d32" }}>✅ 已保存到浏览器！刷新页面即可看到新内容。</p>
          </div>
        )}
        {exportUrl && (
          <div className="p-4" style={{ backgroundColor: "#e3f2fd", borderRadius: "4px" }}>
            <p className="text-sm mb-2" style={{ color: "#1565c0" }}>📥 点击下方链接下载 siteData.json</p>
            <a href={exportUrl} download="siteData.json" className="text-sm underline" style={{ color: "#1565c0" }}>下载 siteData.json</a>
            <p className="text-xs mt-2" style={{ color: "#78909C" }}>
              下载后打开 GitHub → 找到 src/data/siteData.json → 编辑 → 全选粘贴 → 提交
            </p>
          </div>
        )}

        <section>
          <h2 className="serif-display flex items-center gap-2 mb-6" style={{ fontSize: "20px" }}><Type size={18} /> 文字内容</h2>
          <div className="space-y-4 p-6" style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px" }}>
            <div>
              <label className="text-xs block mb-1" style={{ color: "#8d8d8d" }}>首页标题</label>
              <textarea value={data.hero.heroTitle} onChange={e => update("hero.heroTitle", e.target.value)} className="w-full px-3 py-2 text-sm" style={{ backgroundColor: "#f2f2f2", borderRadius: "2px", border: "none", resize: "vertical" }} rows={2} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: "#8d8d8d" }}>首页副标题</label>
              <input value={data.hero.heroSubtitle} onChange={e => update("hero.heroSubtitle", e.target.value)} className="w-full px-3 py-2 text-sm" style={{ backgroundColor: "#f2f2f2", borderRadius: "2px", border: "none" }} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: "#8d8d8d" }}>猫咪介绍</label>
              <textarea value={data.about.aboutText} onChange={e => update("about.aboutText", e.target.value)} className="w-full px-3 py-2 text-sm" style={{ backgroundColor: "#f2f2f2", borderRadius: "2px", border: "none", resize: "vertical" }} rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs block mb-1" style={{ color: "#8d8d8d" }}>猫咪名字</label><input value={data.about.catName} onChange={e => update("about.catName", e.target.value)} className="w-full px-3 py-2 text-sm" style={{ backgroundColor: "#f2f2f2", borderRadius: "2px", border: "none" }} /></div>
              <div><label className="text-xs block mb-1" style={{ color: "#8d8d8d" }}>品种</label><input value={data.about.catBreed} onChange={e => update("about.catBreed", e.target.value)} className="w-full px-3 py-2 text-sm" style={{ backgroundColor: "#f2f2f2", borderRadius: "2px", border: "none" }} /></div>
              <div><label className="text-xs block mb-1" style={{ color: "#8d8d8d" }}>年龄</label><input value={data.about.catAge} onChange={e => update("about.catAge", e.target.value)} className="w-full px-3 py-2 text-sm" style={{ backgroundColor: "#f2f2f2", borderRadius: "2px", border: "none" }} /></div>
              <div><label className="text-xs block mb-1" style={{ color: "#8d8d8d" }}>性格</label><input value={data.about.catPersonality} onChange={e => update("about.catPersonality", e.target.value)} className="w-full px-3 py-2 text-sm" style={{ backgroundColor: "#f2f2f2", borderRadius: "2px", border: "none" }} /></div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="serif-display flex items-center gap-2 mb-6" style={{ fontSize: "20px" }}><Image size={18} /> 相册图片</h2>
          <div className="space-y-4">
            {data.gallery.images.map((img: Record<string, string>, index: number) => (
              <div key={img.id} className="p-4 flex gap-4 items-start" style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px" }}>
                <img src={img.url} alt="" className="w-24 h-24 object-cover" style={{ borderRadius: "4px" }} />
                <div className="flex-1 space-y-2">
                  <input value={img.title} onChange={e => updateImage(index, "title", e.target.value)} className="w-full px-3 py-2 text-sm" style={{ backgroundColor: "#f2f2f2", borderRadius: "2px", border: "none" }} placeholder="标题" />
                  <input value={img.description} onChange={e => updateImage(index, "description", e.target.value)} className="w-full px-3 py-2 text-sm" style={{ backgroundColor: "#f2f2f2", borderRadius: "2px", border: "none" }} placeholder="描述" />
                </div>
                <button onClick={() => removeImage(index)} className="p-2" style={{ color: "#c62828" }}><Trash2 size={16} /></button>
              </div>
            ))}
            <label className="p-4 flex items-center justify-center gap-2 cursor-pointer" style={{ border: "1px dashed #e5e5e5", borderRadius: "4px" }}>
              <Upload size={16} style={{ color: "#8d8d8d" }} />
              <span className="text-sm" style={{ color: "#8d8d8d" }}>点击上传新图片</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
        </section>

        <section>
          <h2 className="serif-display flex items-center gap-2 mb-6" style={{ fontSize: "20px" }}><Video size={18} /> B站视频</h2>
          <div className="space-y-4">
            {data.videos.map((video: Record<string, unknown>, index: number) => (
              <div key={video.id as number} className="p-4 space-y-3" style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px" }}>
                <div className="flex gap-4">
                  <img src={video.thumbnail as string} alt="" className="w-32 h-20 object-cover" style={{ borderRadius: "4px" }} />
                  <div className="flex-1 space-y-2">
                    <input value={video.bvid as string} onChange={e => updateVideo(index, "bvid", e.target.value)} className="w-full px-3 py-2 text-sm" style={{ backgroundColor: "#f2f2f2", borderRadius: "2px", border: "none" }} placeholder="BV号" />
                    <input value={video.title as string} onChange={e => updateVideo(index, "title", e.target.value)} className="w-full px-3 py-2 text-sm" style={{ backgroundColor: "#f2f2f2", borderRadius: "2px", border: "none" }} placeholder="标题" />
                    <input value={video.description as string} onChange={e => updateVideo(index, "description", e.target.value)} className="w-full px-3 py-2 text-sm" style={{ backgroundColor: "#f2f2f2", borderRadius: "2px", border: "none" }} placeholder="描述" />
                  </div>
                  <button onClick={() => removeVideo(index)} className="p-2" style={{ color: "#c62828" }}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            <button onClick={addVideo} className="w-full p-4 flex items-center justify-center gap-2" style={{ border: "1px dashed #e5e5e5", borderRadius: "4px" }}><Plus size={16} /> 添加新视频</button>
          </div>
        </section>

        <div className="flex gap-3 flex-wrap">
          <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 text-sm text-white" style={{ backgroundColor: "#263238", borderRadius: "2px" }}><Save size={16} /> 保存到浏览器</button>
          <button onClick={handleExport} className="flex items-center gap-2 px-6 py-3 text-sm text-white" style={{ backgroundColor: "#263238", borderRadius: "2px" }}><Download size={16} /> 导出 JSON</button>
          <button onClick={handleReset} className="flex items-center gap-2 px-6 py-3 text-sm" style={{ border: "1px solid #e5e5e5", borderRadius: "2px" }}><RotateCcw size={16} /> 重置</button>
        </div>
      </div>
    </div>
  );
}
