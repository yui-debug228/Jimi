import { useState, useRef, useCallback, useEffect } from "react";
import { X, Check } from "lucide-react";

interface CropModalProps {
  imageUrl: string;
  aspectRatio: number; // 宽/高，如 16/9=1.777, 3/4=0.75, 1=1
  onConfirm: (croppedBase64: string) => void;
  onCancel: () => void;
}

export default function CropModal({ imageUrl, aspectRatio, onConfirm, onCancel }: CropModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, cropX: 0, cropY: 0 });

  // 图片加载完成后初始化裁剪框
  const handleImageLoad = useCallback(() => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    // 计算图片在容器中的实际显示尺寸（object-contain 模式）
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const containerRatio = containerWidth / containerHeight;

    let displayWidth: number, displayHeight: number, offsetX: number, offsetY: number;

    if (imgRatio > containerRatio) {
      // 图片更宽，按宽度缩放
      displayWidth = containerWidth;
      displayHeight = containerWidth / imgRatio;
      offsetX = 0;
      offsetY = (containerHeight - displayHeight) / 2;
    } else {
      // 图片更高或等比，按高度缩放
      displayHeight = containerHeight;
      displayWidth = containerHeight * imgRatio;
      offsetX = (containerWidth - displayWidth) / 2;
      offsetY = 0;
    }

    setImgSize({ width: displayWidth, height: displayHeight });

    // 初始化裁剪框（居中，占图片 70%）
    let cropWidth: number, cropHeight: number;
    if (aspectRatio >= 1) {
      // 宽比例，宽度占 70%
      cropWidth = displayWidth * 0.7;
      cropHeight = cropWidth / aspectRatio;
      if (cropHeight > displayHeight * 0.7) {
        cropHeight = displayHeight * 0.7;
        cropWidth = cropHeight * aspectRatio;
      }
    } else {
      // 高比例，高度占 70%
      cropHeight = displayHeight * 0.7;
      cropWidth = cropHeight * aspectRatio;
      if (cropWidth > displayWidth * 0.7) {
        cropWidth = displayWidth * 0.7;
        cropHeight = cropWidth / aspectRatio;
      }
    }

    const x = offsetX + (displayWidth - cropWidth) / 2;
    const y = offsetY + (displayHeight - cropHeight) / 2;

    setCropBox({ x, y, width: cropWidth, height: cropHeight });
  }, [aspectRatio]);

  // 鼠标拖拽开始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      cropX: cropBox.x,
      cropY: cropBox.y,
    };
  }, [cropBox.x, cropBox.y]);

  // 鼠标拖拽移动
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;

      let newX = dragStart.current.cropX + dx;
      let newY = dragStart.current.cropY + dy;

      // 限制在图片区域内
      const img = imgRef.current;
      const container = containerRef.current;
      if (img && container) {
        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const containerRatio = containerWidth / containerHeight;

        let offsetX = 0, offsetY = 0, displayWidth = 0, displayHeight = 0;
        if (imgRatio > containerRatio) {
          displayWidth = containerWidth;
          displayHeight = containerWidth / imgRatio;
          offsetX = 0;
          offsetY = (containerHeight - displayHeight) / 2;
        } else {
          displayHeight = containerHeight;
          displayWidth = containerHeight * imgRatio;
          offsetX = (containerWidth - displayWidth) / 2;
          offsetY = 0;
        }

        const minX = offsetX;
        const minY = offsetY;
        const maxX = offsetX + displayWidth - cropBox.width;
        const maxY = offsetY + displayHeight - cropBox.height;

        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.max(minY, Math.min(maxY, newY));
      }

      setCropBox(prev => ({ ...prev, x: newX, y: newY }));
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
  }, [dragging, cropBox.width, cropBox.height]);

  // 执行裁剪
  const handleCrop = useCallback(() => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const containerRatio = containerWidth / containerHeight;

    let displayWidth: number, displayHeight: number, offsetX: number, offsetY: number;
    if (imgRatio > containerRatio) {
      displayWidth = containerWidth;
      displayHeight = containerWidth / imgRatio;
      offsetX = 0;
      offsetY = (containerHeight - displayHeight) / 2;
    } else {
      displayHeight = containerHeight;
      displayWidth = containerHeight * imgRatio;
      offsetX = (containerWidth - displayWidth) / 2;
      offsetY = 0;
    }

    // 计算缩放比例
    const scaleX = img.naturalWidth / displayWidth;
    const scaleY = img.naturalHeight / displayHeight;

    // 裁剪框在图片原始坐标系中的位置
    const sourceX = (cropBox.x - offsetX) * scaleX;
    const sourceY = (cropBox.y - offsetY) * scaleY;
    const sourceWidth = cropBox.width * scaleX;
    const sourceHeight = cropBox.height * scaleY;

    // 创建 Canvas 并绘制
    const canvas = document.createElement("canvas");
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);

    const base64 = canvas.toDataURL("image/jpeg", 0.92);
    onConfirm(base64);
  }, [cropBox, onConfirm]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
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
            style={{ width: "100%", height: "400px", backgroundColor: "#000" }}
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt="待裁剪"
              className="absolute inset-0 w-full h-full object-contain"
              onLoad={handleImageLoad}
              draggable={false}
            />
            {/* 暗色遮罩 */}
            <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} />
            {/* 裁剪框 */}
            {cropBox.width > 0 && (
              <div
                className="absolute cursor-move"
                style={{
                  left: cropBox.x,
                  top: cropBox.y,
                  width: cropBox.width,
                  height: cropBox.height,
                  border: "2px solid #fff",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                }}
                onMouseDown={handleMouseDown}
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
          <p className="text-xs text-center mt-3" style={{ color: "#888" }}>拖动方框选择裁剪区域</p>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: "1px solid #333" }}>
          <button onClick={onCancel} className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">取消</button>
          <button onClick={handleCrop} className="flex items-center gap-2 px-4 py-2 text-sm text-white" style={{ backgroundColor: "#263238", borderRadius: "4px" }}>
            <Check size={14} /> 确认裁剪
          </button>
        </div>
      </div>
    </div>
  );
}
