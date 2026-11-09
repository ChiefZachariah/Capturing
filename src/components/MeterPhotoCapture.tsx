import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, RotateCcw, Check, Image as ImageIcon, Sparkles } from 'lucide-react';

interface MeterPhotoCaptureProps {
  value?: string;
  onChange: (photoDataUrl: string) => void;
  onRemove: () => void;
  meterNumber?: string;
  customerName?: string;
}

export function MeterPhotoCapture({
  value,
  onChange,
  onRemove,
  meterNumber,
  customerName,
}: MeterPhotoCaptureProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        stopCamera();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraActive(true);

      // Give React a tick to mount video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => {
            console.error('Video play error:', err);
          });
        }
      }, 50);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not access device camera';
      setCameraError(`Camera access denied or unavailable: ${msg}. You can upload an image file instead.`);
      setIsCameraActive(false);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    stopCamera();
    setTimeout(() => {
      startCamera();
    }, 200);
  };

  const captureFrameFromVideo = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    // Overlay utility watermark onto the captured photo
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(0, height - 36, width, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px "JetBrains Mono", monospace';
    const stampText = `VOLTGRID · MTR: ${meterNumber || 'UNASSIGNED'} · ${new Date().toISOString().replace('T', ' ').substring(0, 19)}`;
    ctx.fillText(stampText, 14, height - 14);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    onChange(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onChange(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Generate a realistic SVG meter faceplate graphic if user wants quick simulation
  const generateSampleMeterPhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background housing
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 640, 480);

    // Meter body bezel
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(80, 40, 480, 400, 24);
    ctx.fill();
    ctx.stroke();

    // LCD screen
    ctx.fillStyle = '#022c22';
    ctx.beginPath();
    ctx.roundRect(140, 90, 360, 90, 8);
    ctx.fill();

    // LCD Digits
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 36px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    const randKwh = (Math.random() * 8000 + 1200).toFixed(1);
    ctx.fillText(`${randKwh} kWh`, 470, 150);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#6ee7b7';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText('STATUS: NORMAL · TAMPER: 0', 160, 120);

    // Barcode area
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`METER NO: ${meterNumber || '02194881729'}`, 140, 230);
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`CUSTOMER: ${customerName || 'Field Installation'}`, 140, 255);

    // Realistic Barcode lines
    ctx.fillStyle = '#0f172a';
    const startX = 140;
    for (let x = 0; x < 360; x += 6) {
      if ((x % 18 !== 0) && Math.random() > 0.2) {
        ctx.fillRect(startX + x, 280, (x % 12 === 0 ? 3 : 2), 50);
      }
    }
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`*${meterNumber || '02194881729'}*`, 320, 345);

    // Anti-tamper seal tag
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.roundRect(140, 370, 180, 35, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SEAL: #TK-9921 INTACT', 230, 392);

    // Timestamp stamp
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 444, 640, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`VOLTGRID FIELD AUDIT CAPTURE · ${new Date().toISOString()}`, 14, 466);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    onChange(dataUrl);
  };

  return (
    <div className="space-y-3">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden file input supporting mobile camera direct capture */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Live Camera Viewfinder Overlay */}
      {isCameraActive && (
        <div className="relative rounded-lg overflow-hidden bg-black border-2 border-emerald-500 shadow-md">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 object-cover"
          />

          {/* Viewfinder Target Reticle */}
          <div className="absolute inset-8 border border-white/40 pointer-events-none rounded-md flex items-center justify-center">
            <span className="text-[11px] font-mono text-white/80 bg-black/50 px-2 py-0.5 rounded">
              Align Meter Faceplate & Barcode
            </span>
          </div>

          {/* Camera Controls Overlay */}
          <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-4 px-4">
            <button
              type="button"
              onClick={toggleFacingMode}
              className="p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 transition-colors"
              title="Switch Camera (Front/Back)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={captureFrameFromVideo}
              className="px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95"
            >
              <Camera className="w-4 h-4" />
              Capture Photo
            </button>

            <button
              type="button"
              onClick={stopCamera}
              className="p-2 rounded-full bg-red-600/80 text-white hover:bg-red-700 transition-colors"
              title="Close Camera"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {cameraError && (
        <div className="p-2.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-xs">
          {cameraError}
        </div>
      )}

      {/* Captured Photo Preview / Empty Upload State */}
      {value ? (
        <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="relative group shrink-0">
            <img
              src={value}
              alt="Installed Meter Faceplate"
              className="w-28 h-28 object-cover rounded-md border border-slate-300 shadow-xs"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
              <span className="text-[10px] text-white font-mono">Photo Attached</span>
            </div>
          </div>

          <div className="flex-1 space-y-1.5 text-xs text-left w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <Check className="w-4 h-4" />
              <span>Meter Installation Photo Locked</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Visual asset will be embedded into the official Commissioning Certificate and saved with the record.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={startCamera}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-xs font-medium transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                Retake
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-xs font-medium transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload New
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 rounded text-xs font-medium transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        !isCameraActive && (
          <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-lg p-4 text-center bg-slate-50/50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <Camera className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">
              Meter Installation Photo & Seal Inspection
            </h4>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5 mb-3">
              Capture the physical meter faceplate, barcode, dial reading, or tamper seal using your camera or upload an image file.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={startCamera}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                Open Live Camera
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-medium transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                Upload Photo File
              </button>

              <button
                type="button"
                onClick={generateSampleMeterPhoto}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-emerald-700 hover:text-emerald-800 text-xs font-medium transition-colors"
                title="Generate realistic meter faceplate for test verification"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Sample Photo
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
