export default function Footer() {
  return (
    <footer
      className="relative overflow-hidden"
      style={{
        paddingTop: "15vh",
        paddingBottom: "8vh",
        backgroundColor: "#f2f2f2",
      }}
    >
      <div className="px-8 md:px-16 max-w-7xl mx-auto">
        {/* Giant watermark */}
        <div
          className="text-center select-none"
          style={{
            fontSize: "clamp(4rem, 12vw, 10rem)",
            fontFamily: '"Cinzel", "Didot", "Noto Serif SC", serif',
            fontWeight: 300,
            color: "#e5e5e5",
            lineHeight: 1,
            letterSpacing: "0.2em",
          }}
        >
          米米
        </div>

        {/* Copyright */}
        <div className="mt-12 text-center">
          <p
            style={{
              fontSize: "11px",
              color: "#b1b1b1",
              letterSpacing: "0.1em",
              fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
            }}
          >
            © {new Date().getFullYear()} 米米的小世界. All rights reserved. Designed with love.
          </p>
        </div>
      </div>

      {/* Top divider */}
      <div
        className="absolute top-0 left-8 right-8 md:left-16 md:right-16"
        style={{ height: "1px", backgroundColor: "#e5e5e5" }}
      />
    </footer>
  );
}
