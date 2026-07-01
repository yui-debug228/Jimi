import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Loader2, ArrowLeft, LogIn, UserPlus } from "lucide-react";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);
  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);
  return url.toString();
}

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");

  const loginMutation = trpc.localAuth.login.useMutation({
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem("local_auth_token", data.token);
        window.location.href = "/";
      }
    },
    onError: (err) => setError(err.message),
  });

  const registerMutation = trpc.localAuth.register.useMutation({
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem("local_auth_token", data.token);
        window.location.href = "/";
      }
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) { setError("请填写用户名和密码"); return; }
    if (mode === "login") {
      loginMutation.mutate({ username: username.trim(), password });
    } else {
      registerMutation.mutate({ username: username.trim(), password, inviteCode: inviteCode || undefined });
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

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
            {mode === "register" && (
              <div>
                <label className="text-xs block mb-1.5" style={{ color: "#8d8d8d" }}>邀请码（如需）</label>
                <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full px-3 py-2 text-sm border outline-none focus:border-black" style={{ borderColor: "#e5e5e5", borderRadius: "2px" }} />
              </div>
            )}
            {error && <p className="text-xs" style={{ color: "#c62828" }}>{error}</p>}
            <button type="submit" disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-white disabled:opacity-40 transition-opacity"
              style={{ backgroundColor: "#000", borderRadius: "2px" }}>
              {isPending ? <Loader2 size={14} className="animate-spin" /> : mode === "login" ? <LogIn size={14} /> : <UserPlus size={14} />}
              {isPending ? "处理中..." : mode === "login" ? "登录" : "注册"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              className="text-xs transition-colors hover:text-[#8d8d8d]" style={{ color: "#b1b1b1" }}>
              {mode === "login" ? "没有账号？点击注册" : "已有账号？点击登录"}
            </button>
          </div>

          <div className="mt-4 pt-4" style={{ borderTop: "1px solid #e5e5e5" }}>
            <button onClick={() => { window.location.href = getOAuthUrl(); }}
              className="w-full py-2.5 text-xs border transition-all hover:bg-black hover:text-white" style={{ borderColor: "#e5e5e5", borderRadius: "2px" }}>
              使用 Kimi OAuth 登录
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
