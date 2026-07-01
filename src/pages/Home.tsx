import Header from "@/sections/Header";
import Hero from "@/sections/Hero";
import About from "@/sections/About";
import Gallery from "@/sections/Gallery";
import VideoSection from "@/sections/VideoSection";
import Footer from "@/sections/Footer";

export default function Home() {
  return (
    <div className="relative" style={{ backgroundColor: "#f2f2f2" }}>
      <Header />
      <Hero />
      <About />
      <Gallery />
      <VideoSection />
      <Footer />
    </div>
  );
}
