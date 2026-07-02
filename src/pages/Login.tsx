import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ArrowLeft, LogIn, UserPlus } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) { setError("请填写用户名和密码"); return; }
    // 密码经过编码存储，避免被直接看到。请将仓库设为私有以获得最佳安全性。
    const encodedAdminPassword = "WGN6MjAwNTEyMjQ="; // base64 of Xcz20051224
    let decodedPassword = "";
    try { decodedPassword = atob(encodedAdminPassword); } catch {}
    const isAdmin = username.trim() === "admin" && password.trim() === decodedPassword;
    if (username.trim() === "admin" && !isAdmin) { setError("密码错误"); return; }
    const role = isAdmin ? "admin" : "user";
    login(username.trim(), role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f2f2f2" }}>
      <div className="w-full max-w-sm">
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-sm mb-6 transition-colors hover:text-[#8d8d8d]">
          <ArrowLeft size={16} /> 返回首页
        </button>

        <div className="p-6" style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px" }}>
          <h1 className="serif-display text-center mb-6" style={{ fontSize: "20px", letterSpacing: "0.05em" }}>
            {mode === "login" ? "登录" : "注册"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs block mb-1.5" style={{ color: "#8d8d8d" }}>用户名</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px" }} />
            </div>
            <div>
              <label className="text-xs block mb-1.5" style={{ color: "#8d8d8d" }}>密码</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px" }} />
            </div>
            {error && <p className="text-xs" style={{ color: "#c62828" }}>{error}</p>}
            <button type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-white transition-opacity"
              style={{ backgroundColor: "#000", borderRadius: "2px" }}>
              <LogIn size={14} /> {mode === "login" ? "登录" : "注册"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              className="text-xs transition-colors hover:text-[#8d8d8d]" style={{ color: "#b1b1b1" }}>
              {mode === "login" ? "没有账号？点击注册" : "已有账号？点击登录"}
            </button>
          </div>

          <div className="mt-4 pt-4" style={{ borderTop: "1px solid #e5e5e5" }}>
            <p className="text-xs text-center" style={{ color: "#b1b1b1" }}>
              提示：用户名 admin 会自动获得管理员权限
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
