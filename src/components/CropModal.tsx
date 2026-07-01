import { useState, useRef, useCallback, useEffect } from "react";
import { X, Check, RotateCcw } from "lucide-react";

export type CropAspect = "free" | "16:9" | "3:4" | "1:1";

const ASPECT_RATIOS: Record<CropAspect, number | null> = {
  "16:9": 16 / 9,
  "3:4": 3 / 4,
  "1:1": 1,
  free: null,
};

interface CropModalProps {
  imageUrl: string;
  fileName: string;
  aspect: CropAspect;
  open: boolean;
  onClose: () => void;
  onConfirm: (croppedFile: File) => void;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function CropModal({ imageUrl, fileName, aspect: defaultAspect, open, onClose, onConfirm }: CropModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [aspect, setAspect] = useState<CropAspect>(defaultAspect);
  const [crop, setCrop] = useState<Rect>({ x: 0, y: 0, w: 0, h: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, crop: crop });
  const [processing, setProcessing] = useState(false);

  // Reset crop when image loads
  const handleImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const container = containerRef.current;
    if (!container) return;

    const containerW = container.clientWidth;
    const containerH = container.clientHeight;
    const imgNaturalW = img.naturalWidth;
    const imgNaturalH = img.naturalHeight;

    // Calculate display size (fit inside container)
    const scale = Math.min(containerW / imgNaturalW, containerH / imgNaturalH, 1);
    const displayW = imgNaturalW * scale;
    const displayH = imgNaturalH * scale;

    setImgSize({ w: displayW, h: displayH });

    // Initialize crop rectangle
    const ratio = ASPECT_RATIOS[aspect];
    let cw: number, ch: number;
    if (ratio) {
      // Fit crop area within display size with the given aspect ratio
      if (displayW / displayH > ratio) {
        ch = displayH * 0.8;
        cw = ch * ratio;
      } else {
        cw = displayW * 0.8;
        ch = cw / ratio;
      }
    } else {
      // Free: use 80% of display
      cw = displayW * 0.8;
      ch = displayH * 0.8;
    }
    setCrop({
      x: (displayW - cw) / 2,
      y: (displayH - ch) / 2,
      w: cw,
      h: ch,
    });
  }, [aspect]);

  // Re-init crop when aspect changes
  useEffect(() => {
    if (open && imgSize.w > 0) {
      const ratio = ASPECT_RATIOS[aspect];
      let cw: number, ch: number;
      if (ratio) {
        if (imgSize.w / imgSize.h > ratio) {
          ch = imgSize.h * 0.8;
          cw = ch * ratio;
        } else {
          cw = imgSize.w * 0.8;
          ch = cw / ratio;
        }
      } else {
        cw = imgSize.w * 0.8;
        ch = imgSize.h * 0.8;
      }
      setCrop({
        x: (imgSize.w - cw) / 2,
        y: (imgSize.h - ch) / 2,
        w: cw,
        h: ch,
      });
    }
  }, [aspect, open, imgSize.w, imgSize.h]);

  // Mouse/Touch handlers for dragging
  const getPointerPos = (e: React.MouseEvent | React.TouchEvent) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getPointerPos(e);
    dragStart.current = { x: pos.x, y: pos.y, crop: { ...crop } };

    // Check if clicking on resize handle (bottom-right corner)
    const handleSize = 12;
    if (pos.x >= crop.x + crop.w - handleSize && pos.x <= crop.x + crop.w + handleSize &&
        pos.y >= crop.y + crop.h - handleSize && pos.y <= crop.y + crop.h + handleSize) {
      setResizing(true);
    } else if (pos.x >= crop.x && pos.x <= crop.x + crop.w && pos.y >= crop.y && pos.y <= crop.y + crop.h) {
      setDragging(true);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragging && !resizing) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    let cx: number, cy: number;
    if ("touches" in e) {
      cx = e.touches[0].clientX - rect.left;
      cy = e.touches[0].clientY - rect.top;
    } else {
      cx = e.clientX - rect.left;
      cy = e.clientY - rect.top;
    }

    const dx = cx - dragStart.current.x;
    const dy = cy - dragStart.current.y;

    if (dragging) {
      let nx = dragStart.current.crop.x + dx;
      let ny = dragStart.current.crop.y + dy;
      nx = Math.max(0, Math.min(nx, imgSize.w - crop.w));
      ny = Math.max(0, Math.min(ny, imgSize.h - crop.h));
      setCrop((prev) => ({ ...prev, x: nx, y: ny }));
    } else if (resizing) {
      const ratio = ASPECT_RATIOS[aspect];
      let nw = dragStart.current.crop.w + dx;
      let nh = dragStart.current.crop.h + dy;
      nw = Math.max(40, Math.min(nw, imgSize.w - dragStart.current.crop.x));
      nh = Math.max(40, Math.min(nh, imgSize.h - dragStart.current.crop.y));
      if (ratio) {
        if (nw / nh > ratio) nh = nw / ratio;
        else nw = nh * ratio;
        // Re-clamp after ratio adjustment
        if (dragStart.current.crop.x + nw > imgSize.w) {
          nw = imgSize.w - dragStart.current.crop.x;
          nh = ratio ? nw / ratio : nh;
        }
        if (dragStart.current.crop.y + nh > imgSize.h) {
          nh = imgSize.h - dragStart.current.crop.y;
          nw = ratio ? nh * ratio : nw;
        }
      }
      setCrop((prev) => ({ ...prev, w: nw, h: nh }));
    }
  }, [dragging, resizing, imgSize, aspect]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
    setResizing(false);
  }, []);

  useEffect(() => {
    if (dragging || resizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleMouseMove, { passive: false });
      window.addEventListener("touchend", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("touchmove", handleMouseMove);
        window.removeEventListener("touchend", handleMouseUp);
      };
    }
  }, [dragging, resizing, handleMouseMove, handleMouseUp]);

  // Perform crop using Canvas
  const handleConfirm = async () => {
    const img = imgRef.current;
    if (!img) return;
    setProcessing(true);

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No canvas context");

      // Calculate scale factor between display size and natural size
      const scaleX = img.naturalWidth / imgSize.w;
      const scaleY = img.naturalHeight / imgSize.h;

      const sx = Math.round(crop.x * scaleX);
      const sy = Math.round(crop.y * scaleY);
      const sw = Math.round(crop.w * scaleX);
      const sh = Math.round(crop.h * scaleY);

      canvas.width = sw;
      canvas.height = sh;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Canvas toBlob failed"));
        }, "image/jpeg", 0.92);
      });

      const ext = fileName.endsWith(".png") ? ".png" : ".jpg";
      const croppedFile = new File([blob], `cropped_${Date.now()}${ext}`, { type: `image/${ext === ".png" ? "png" : "jpeg"}` });
      onConfirm(croppedFile);
      onClose();
    } catch (err) {
      alert("裁剪失败: " + (err instanceof Error ? err.message : "未知错误"));
    } finally {
      setProcessing(false);
    }
  };

  if (!open) return null;

  const aspectButtons: { key: CropAspect; label: string }[] = [
    { key: "16:9", label: "16:9 宽屏" },
    { key: "3:4", label: "3:4 肖像" },
    { key: "1:1", label: "1:1 方形" },
    { key: "free", label: "自由裁剪" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="w-full max-w-2xl flex flex-col" style={{ backgroundColor: "#fff", borderRadius: "6px", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid #e5e5e5" }}>
          <h3 className="text-sm font-medium">裁剪图片</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Aspect ratio selector */}
        <div className="flex gap-1.5 px-5 py-3" style={{ borderBottom: "1px solid #f2f2f2" }}>
          {aspectButtons.map((btn) => (
            <button key={btn.key} onClick={() => setAspect(btn.key)}
              className={`px-3 py-1.5 text-xs rounded transition-all ${aspect === btn.key ? "bg-black text-white" : "border hover:bg-gray-50"}`}
              style={{ borderColor: aspect === btn.key ? "#000" : "#e5e5e5" }}>
              {btn.label}
            </button>
          ))}
        </div>

        {/* Image + Crop Area */}
        <div className="flex-1 flex items-center justify-center p-5 overflow-hidden" style={{ minHeight: "300px", backgroundColor: "#1a1a1a" }}
          ref={containerRef} onMouseDown={handleMouseDown} onTouchStart={handleMouseDown}>
          <img ref={(el) => { imgRef.current = el; }} src={imageUrl} alt="Crop" className="absolute pointer-events-none select-none"
            style={{ width: imgSize.w, height: imgSize.h, opacity: 0 }} onLoad={handleImageLoad} />

          {/* Show image with dark overlay */}
          <div className="relative" style={{ width: imgSize.w, height: imgSize.h }}>
            <img src={imageUrl} alt="Crop background" className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none" />
            {/* Dark overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.6 }}>
              <defs>
                <mask id="crop-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <rect x={crop.x} y={crop.y} width={crop.w} height={crop.h} fill="black" />
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="black" mask="url(#crop-mask)" />
            </svg>
            {/* Crop border */}
            <div className="absolute pointer-events-none" style={{
              left: crop.x, top: crop.y, width: crop.w, height: crop.h,
              border: "2px solid #fff", boxShadow: "0 0 0 1px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(0,0,0,0.1)",
            }}>
              {/* Grid lines */}
              <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.3 }}>
                <div className="absolute" style={{ left: "33.33%", top: 0, bottom: 0, width: "1px", backgroundColor: "#fff" }} />
                <div className="absolute" style={{ left: "66.66%", top: 0, bottom: 0, width: "1px", backgroundColor: "#fff" }} />
                <div className="absolute" style={{ top: "33.33%", left: 0, right: 0, height: "1px", backgroundColor: "#fff" }} />
                <div className="absolute" style={{ top: "66.66%", left: 0, right: 0, height: "1px", backgroundColor: "#fff" }} />
              </div>
              {/* Resize handle */}
              <div className="absolute pointer-events-auto cursor-nwse-resize" style={{
                right: -6, bottom: -6, width: 12, height: 12,
                backgroundColor: "#fff", border: "2px solid #000", borderRadius: "50%",
              }} />
            </div>
          </div>

          {/* Hint text */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white text-xs pointer-events-none" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
            拖动移动裁剪区域，拖拽右下角调整大小
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ borderTop: "1px solid #e5e5e5" }}>
          <button onClick={onClose} className="px-4 py-2 text-xs border transition-colors hover:bg-gray-50" style={{ borderColor: "#e5e5e5", borderRadius: "2px" }}>
            取消
          </button>
          <button onClick={handleConfirm} disabled={processing}
            className="flex items-center gap-1.5 px-4 py-2 text-xs text-white bg-black disabled:opacity-40 transition-colors hover:bg-gray-800" style={{ borderRadius: "2px" }}>
            {processing ? <RotateCcw size={12} className="animate-spin" /> : <Check size={12} />}
            {processing ? "处理中..." : "确认裁剪"}
          </button>
        </div>
      </div>
    </div>
  );
}
