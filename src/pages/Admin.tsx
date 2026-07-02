import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { ArrowLeft, Shield, Activity, Settings, FileText, Bug, Image, Play, Users, BarChart3, TrendingUp, Heart, Loader2 } from "lucide-react";
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

  const stats = siteData.stats || {
    totalUsers: 0, adminCount: 0, regularUserCount: 0,
    totalImages: 0, totalVideos: 0, totalLikes: 0, likeDistribution: []
  };

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
        {activeTab === "config" && (
          <div className="space-y-16">
            <section>
              <h2 className="serif-display flex items-center gap-2 mb-6" style={{ fontSize: "20px", letterSpacing: "0.03em" }}>
                <BarChart3 size={18} /> 数据概览
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: "总用户", value: stats.totalUsers, icon: Users, color: "#000" },
                  { label: "管理员", value: stats.adminCount, icon: Shield, color: "#8d8d8d" },
                  { label: "普通用户", value: stats.regularUserCount, icon: Users, color: "#b1b1b1" },
                  { label: "图片数", value: stats.totalImages, icon: Image, color: "#000" },
                  { label: "视频数", value: stats.totalVideos, icon: Play, color: "#8d8d8d" },
                  { label: "总点赞", value: stats.totalLikes, icon: Heart, color: "#ef4444" },
                ].map((card) => (
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
              {stats.likeDistribution && stats.likeDistribution.length > 0 && (
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
                          <span className="text-xs w-24 truncate" style={{ color: "#8d8d8d" }}>图片 #{item.imageId}</span>
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

            <section>
              <h2 className="serif-display flex items-center gap-2 mb-6" style={{ fontSize: "20px", letterSpacing: "0.03em" }}>
                <Settings size={18} /> 网站配置
              </h2>
              <div className="p-6 space-y-5" style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px" }}>
                <p className="text-xs" style={{ color: "#b1b1b1" }}>当前为静态演示模式，配置数据来自 siteData.json</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(siteData.siteConfig || {}).map(([key, value]) => (
                    <div key={key}>
                      <label className="text-xs block mb-1" style={{ color: "#8d8d8d" }}>{key}</label>
                      <div className="px-3 py-2 text-sm break-all" style={{ backgroundColor: "#f2f2f2", borderRadius: "2px" }}>{String(value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "logs" && (
          <section>
            <h2 className="serif-display flex items-center gap-2 mb-6" style={{ fontSize: "20px", letterSpacing: "0.03em" }}>
              <FileText size={18} /> 管理员操作日志
            </h2>
            {siteData.logs && siteData.logs.length > 0 ? (
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
                    {siteData.logs.map((log) => (
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
                            {log.action === "create" ? "创建" : log.action === "delete" ? "删除" : log.action === "update" ? "修改" : log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-xs">{log.target}{log.targetId ? ` #${log.targetId}` : ""}</td>
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
        )}

        {activeTab === "debug" && (
          <div className="space-y-8">
            <section>
              <h2 className="serif-display flex items-center gap-2 mb-4" style={{ fontSize: "20px", letterSpacing: "0.03em" }}>
                <Bug size={18} /> 认证调试日志
              </h2>
              {siteData.debugLogs && siteData.debugLogs.length > 0 ? (
                <div className="space-y-2">
                  {siteData.debugLogs.map((log) => (
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
        )}
      </div>
    </div>
  );
}
