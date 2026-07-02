import { useState, useRef, useCallback, useEffect } from "react";
import { X, Check, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface CropModalProps {
  imageUrl: string;
  aspectRatio: number;
  onConfirm: (croppedBase64: string) => void;
  onCancel: () => void;
}

interface DisplayInfo {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  naturalWidth: number;
  naturalHeight: number;
  containerWidth: number;
  containerHeight: number;
}

export default function CropModal({ imageUrl, aspectRatio, onConfirm, onCancel }: CropModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayInfo, setDisplayInfo] = useState<DisplayInfo>({
    width: 0, height: 0, offsetX: 0, offsetY: 0,
    naturalWidth: 0, naturalHeight: 0, containerWidth: 0, containerHeight: 0
  });
  const [zoom, setZoom] = useState(1);
  const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 });
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, imgX: 0, imgY: 0 });
  const [isReady, setIsReady] = useState(false);

  // 初始化：加载图片，计算显示尺寸和裁剪框
  useEffect(() => {
    // 每次打开新图片时重置所有状态
    setZoom(1);
    setImgOffset({ x: 0, y: 0 });
    setCropBox({ x: 0, y: 0, width: 0, height: 0 });
    setDisplayInfo({
      width: 0, height: 0, offsetX: 0, offsetY: 0,
      naturalWidth: 0, naturalHeight: 0, containerWidth: 0, containerHeight: 0
    });
    setIsReady(false);

    let cancelled = false;

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      if (cancelled) return;

      const container = containerRef.current;
      if (!container) return;

      const cw = container.clientWidth;
      const ch = container.clientHeight;
      if (cw === 0 || ch === 0) return;

      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      const imgRatio = nw / nh;
      const containerRatio = cw / ch;

      let displayWidth: number, displayHeight: number, offsetX: number, offsetY: number;

      if (imgRatio > containerRatio) {
        displayWidth = cw;
        displayHeight = cw / imgRatio;
        offsetX = 0;
        offsetY = (ch - displayHeight) / 2;
      } else {
        displayHeight = ch;
        displayWidth = ch * imgRatio;
        offsetX = (cw - displayWidth) / 2;
        offsetY = 0;
      }

      setDisplayInfo({
        width: displayWidth, height: displayHeight,
        offsetX, offsetY,
        naturalWidth: nw, naturalHeight: nh,
        containerWidth: cw, containerHeight: ch
      });

      // 初始化裁剪框（居中，占容器 70%）
      let cropWidth: number, cropHeight: number;
      if (aspectRatio >= 1) {
        cropWidth = cw * 0.7;
        cropHeight = cropWidth / aspectRatio;
        if (cropHeight > ch * 0.7) {
          cropHeight = ch * 0.7;
          cropWidth = cropHeight * aspectRatio;
        }
      } else {
        cropHeight = ch * 0.7;
        cropWidth = cropHeight * aspectRatio;
        if (cropWidth > cw * 0.7) {
          cropWidth = cw * 0.7;
          cropHeight = cropWidth / aspectRatio;
        }
      }

      const cropX = (cw - cropWidth) / 2;
      const cropY = (ch - cropHeight) / 2;

      setCropBox({ x: cropX, y: cropY, width: cropWidth, height: cropHeight });
      setIsReady(true);
    };

    return () => { cancelled = true; };
  }, [imageUrl, aspectRatio]);

  // 滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom(prev => {
      const next = Math.max(0.3, Math.min(5, prev + delta));
      return Math.round(next * 100) / 100;
    });
  }, []);

  // 拖拽图片
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, imgX: imgOffset.x, imgY: imgOffset.y };
  }, [imgOffset.x, imgOffset.y]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setImgOffset({ x: dragStart.current.imgX + dx, y: dragStart.current.imgY + dy });
    };
    const handleMouseUp = () => setDragging(false);

    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging]);

  // 执行裁剪
  const handleCrop = useCallback(() => {
    if (!isReady || displayInfo.width === 0) return;

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      const scaleFactor = displayInfo.naturalWidth / displayInfo.width;
      const scaledWidth = displayInfo.width * zoom;
      const scaledHeight = displayInfo.height * zoom;
      const centerX = displayInfo.offsetX + displayInfo.width / 2;
      const centerY = displayInfo.offsetY + displayInfo.height / 2;
      const actualLeft = centerX - scaledWidth / 2 + imgOffset.x;
      const actualTop = centerY - scaledHeight / 2 + imgOffset.y;

      const sourceX = (cropBox.x - actualLeft) * scaleFactor / zoom;
      const sourceY = (cropBox.y - actualTop) * scaleFactor / zoom;
      const sourceWidth = cropBox.width * scaleFactor / zoom;
      const sourceHeight = cropBox.height * scaleFactor / zoom;

      const clampedX = Math.max(0, Math.min(displayInfo.naturalWidth - sourceWidth, sourceX));
      const clampedY = Math.max(0, Math.min(displayInfo.naturalHeight - sourceHeight, sourceY));
      const clampedWidth = Math.max(1, Math.min(sourceWidth, displayInfo.naturalWidth - clampedX));
      const clampedHeight = Math.max(1, Math.min(sourceHeight, displayInfo.naturalHeight - clampedY));

      const canvas = document.createElement("canvas");
      canvas.width = clampedWidth;
      canvas.height = clampedHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, clampedX, clampedY, clampedWidth, clampedHeight, 0, 0, clampedWidth, clampedHeight);

      const base64 = canvas.toDataURL("image/jpeg", 0.92);
      onConfirm(base64);
    };
  }, [isReady, displayInfo, cropBox, imgOffset, zoom, imageUrl, onConfirm]);

  // 计算图片样式
  const scaledWidth = displayInfo.width * zoom;
  const scaledHeight = displayInfo.height * zoom;
  const centerX = displayInfo.offsetX + displayInfo.width / 2;
  const centerY = displayInfo.offsetY + displayInfo.height / 2;
  const actualLeft = centerX - scaledWidth / 2 + imgOffset.x;
  const actualTop = centerY - scaledHeight / 2 + imgOffset.y;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.85)" }}>
      <div className="w-full max-w-3xl" style={{ backgroundColor: "#1a1a1a", borderRadius: "8px" }}>
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #333" }}>
          <h3 className="text-sm text-white">裁剪图片</h3>
          <button onClick={onCancel} className="text-white/60 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        {/* 裁剪区域 */}
        <div className="p-6">
          <div
            ref={containerRef}
            className="relative mx-auto overflow-hidden"
            style={{ width: "100%", height: "400px", backgroundColor: "#000", cursor: dragging ? "grabbing" : "grab" }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
          >
            {/* 图片：在缩放后 width 为 0 时，隐藏以避免显示原始大图片 */}
            {isReady && scaledWidth > 0 && scaledHeight > 0 && (
              <img
                src={imageUrl}
                alt="待裁剪"
                className="absolute"
                style={{
                  width: `${scaledWidth}px`,
                  height: `${scaledHeight}px`,
                  left: `${actualLeft}px`,
                  top: `${actualTop}px`,
                  userSelect: "none",
                  pointerEvents: "none",
                }}
                draggable={false}
              />
            )}
            {/* 加载提示 */}
            {!isReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm" style={{ color: "#888" }}>加载中...</span>
              </div>
            )}
            {/* 裁剪框 */}
            {isReady && cropBox.width > 0 && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: cropBox.x,
                  top: cropBox.y,
                  width: cropBox.width,
                  height: cropBox.height,
                  border: "2px solid #fff",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                }}
              >
                {/* 网格线 */}
                <div className="absolute inset-0" style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)
                  `,
                  backgroundSize: "33.33% 33.33%",
                }} />
              </div>
            )}
          </div>

          {/* 缩放控制 */}
          <div className="flex items-center justify-center gap-3 mt-3">
            <button
              onClick={() => setZoom(z => Math.max(0.3, Math.round((z - 0.2) * 100) / 100))}
              className="p-2 text-white/70 hover:text-white transition-colors"
              style={{ backgroundColor: "#333", borderRadius: "4px" }}
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-xs text-white/60 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(5, Math.round((z + 0.2) * 100) / 100))}
              className="p-2 text-white/70 hover:text-white transition-colors"
              style={{ backgroundColor: "#333", borderRadius: "4px" }}
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => { setZoom(1); setImgOffset({ x: 0, y: 0 }); }}
              className="p-2 text-white/70 hover:text-white transition-colors"
              style={{ backgroundColor: "#333", borderRadius: "4px" }}
              title="重置"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          <p className="text-xs text-center mt-2" style={{ color: "#888" }}>滚轮缩放图片，拖拽移动图片，裁剪框固定</p>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: "1px solid #333" }}>
          <button onClick={onCancel} className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">取消</button>
          <button
            onClick={handleCrop}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white"
            style={{ backgroundColor: "#263238", borderRadius: "4px" }}
            disabled={!isReady}
          >
            <Check size={14} /> 确认裁剪
          </button>
        </div>
      </div>
    </div>
  );
}
