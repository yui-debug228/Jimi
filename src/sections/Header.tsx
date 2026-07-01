import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, LogOut, User, Shield, Menu, X } from "lucide-react";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
    };
  }, []);

  const scrollToSection = (id: string) => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    if (!isHome) {
      navigate("/");
      scrollTimer.current = setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 400);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{ backgroundColor: scrolled ? "rgba(242, 242, 242, 0.9)" : "transparent", backdropFilter: scrolled ? "blur(12px)" : "none", height: "64px" }}>
      <div className="h-full flex items-center justify-between px-4 md:px-16">
        {/* Logo */}
        <button onClick={() => isHome ? window.scrollTo({ top: 0, behavior: "smooth" }) : navigate("/")}
          className="text-sm tracking-wide hover:opacity-60 transition-opacity duration-400 z-10"
          style={{ fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif' }}>
          米米的小世界
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {isHome && [
            { label: "相册", id: "gallery" },
            { label: "动态", id: "videos" },
            { label: "关于", id: "about" },
          ].map((item) => (
            <button key={item.id} onClick={() => scrollToSection(item.id)}
              className="text-sm tracking-wide transition-colors duration-400 hover:text-[#8d8d8d]">
              {item.label}
            </button>
          ))}

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {isAdmin && (
                <button onClick={() => navigate("/admin")}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 border transition-all hover:bg-black hover:text-white" style={{ borderRadius: "2px" }}>
                  <Shield size={12} /> 后台
                </button>
              )}
              <span className="text-xs flex items-center gap-1" style={{ color: "#8d8d8d" }}>
                <User size={12} /> {user?.name}
              </span>
              <button onClick={logout} className="flex items-center gap-1 text-xs px-3 py-1.5 border transition-all hover:bg-black hover:text-white" style={{ borderRadius: "2px" }}>
                <LogOut size={12} />
              </button>
            </div>
          ) : (
            <button onClick={() => navigate("/login")}
              className="flex items-center gap-1 text-xs px-4 py-1.5 border transition-all hover:bg-black hover:text-white" style={{ borderRadius: "2px" }}>
              <LogIn size={12} /> 登录
            </button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden z-10 w-8 h-8 flex items-center justify-center" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col items-center justify-center gap-8" style={{ backgroundColor: "rgba(242, 242, 242, 0.98)", backdropFilter: "blur(20px)" }}>
          {isHome && [
            { label: "相册", id: "gallery" },
            { label: "动态", id: "videos" },
            { label: "关于", id: "about" },
          ].map((item) => (
            <button key={item.id} onClick={() => scrollToSection(item.id)}
              className="text-lg tracking-wide transition-colors hover:text-[#8d8d8d]">
              {item.label}
            </button>
          ))}

          {isAuthenticated ? (
            <>
              {isAdmin && (
                <button onClick={() => { navigate("/admin"); setMenuOpen(false); }}
                  className="flex items-center gap-2 text-lg">
                  <Shield size={16} /> 管理后台
                </button>
              )}
              <span className="text-sm flex items-center gap-1" style={{ color: "#8d8d8d" }}>
                <User size={14} /> {user?.name}
              </span>
              <button onClick={() => { logout(); setMenuOpen(false); }} className="flex items-center gap-2 text-sm border px-4 py-2 transition-all hover:bg-black hover:text-white" style={{ borderRadius: "2px" }}>
                <LogOut size={14} /> 退出登录
              </button>
            </>
          ) : (
            <button onClick={() => { navigate("/login"); setMenuOpen(false); }}
              className="flex items-center gap-2 text-lg border px-6 py-2 transition-all hover:bg-black hover:text-white" style={{ borderRadius: "2px" }}>
              <LogIn size={16} /> 登录 / 注册
            </button>
          )}
        </div>
      )}
    </header>
  );
}
