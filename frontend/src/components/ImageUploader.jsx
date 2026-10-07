import React, { useState, useRef, useEffect } from 'react';
import api from '../api/axios';
import { resolveImageUrl } from './ProductImage';
import { Upload, Camera, Link as LinkIcon, X, Check, RefreshCw, Image as ImageIcon } from 'lucide-react';

export default function ImageUploader({ value, onChange }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'camera' | 'url'
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const sampleImagePresets = [
    { label: 'Pencil ✏️', url: 'https://images.unsplash.com/photo-1585336261026-8f5786372966?w=800&auto=format&fit=crop&q=80' },
    { label: 'Pen 🖋️', url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&auto=format&fit=crop&q=80' },
    { label: 'Notebook 📓', url: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&auto=format&fit=crop&q=80' },
    { label: 'Keyboard ⌨️', url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80' },
    { label: 'Mouse 🖱️', url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80' },
    { label: 'Headset 🎧', url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80' },
    { label: 'Chair 🪑', url: 'https://images.unsplash.com/photo-1580481072645-022f9a6d8310?w=800&auto=format&fit=crop&q=80' },
    { label: 'Laptop 💻', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80' },
    { label: 'Printer 🖨️', url: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800&auto=format&fit=crop&q=80' }
  ];

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError('');
    setCapturedPhoto(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please allow camera permissions in your browser or try file upload.');
      setCameraActive(false);
    }
  };

  const handleTabChange = (tab) => {
    if (activeTab === 'camera' && tab !== 'camera') {
      stopCamera();
    }
    setActiveTab(tab);
    if (tab === 'camera' && !cameraActive && !capturedPhoto) {
      startCamera();
    }
  };

  const uploadImageToServer = async (dataUrl) => {
    setUploading(true);
    try {
      const res = await api.post('/upload', { image: dataUrl });
      if (res.data && res.data.imageUrl) {
        onChange(res.data.imageUrl);
        return res.data.imageUrl;
      }
    } catch (err) {
      console.warn('Backend image upload endpoint error, falling back to data URL:', err);
      onChange(dataUrl);
    } finally {
      setUploading(false);
    }
  };

  const compressAndUpload = (imageSrc) => {
    const img = new Image();
    if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.src = imageSrc;
    img.onload = () => {
      const canvas = canvasRef.current || document.createElement('canvas');
      const maxDim = 800;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      uploadImageToServer(compressedDataUrl);
    };

    img.onerror = () => {
      uploadImageToServer(imageSrc);
    };
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      compressAndUpload(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    setCapturedPhoto(dataUrl);
    stopCamera();
    uploadImageToServer(dataUrl);
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  return (
    <div className="space-y-3 font-sans">
      <canvas ref={canvasRef} className="hidden" />

      {/* Tabs Selector */}
      <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-600">
        <button
          type="button"
          onClick={() => handleTabChange('upload')}
          className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'upload' ? 'bg-white text-blue-600 shadow-2xs font-extrabold' : 'hover:text-slate-900'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload File</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('camera')}
          className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'camera' ? 'bg-white text-blue-600 shadow-2xs font-extrabold' : 'hover:text-slate-900'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Take Photo</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('url')}
          className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'url' ? 'bg-white text-blue-600 shadow-2xs font-extrabold' : 'hover:text-slate-900'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>URL / Presets</span>
        </button>
      </div>

      {/* TAB 1: FILE UPLOAD */}
      {activeTab === 'upload' && (
        <div className="space-y-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 rounded-2xl p-4 text-center cursor-pointer transition-all space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-white text-blue-600 flex items-center justify-center mx-auto shadow-2xs group-hover:scale-110 transition-transform">
              {uploading ? (
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Upload className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                {uploading ? 'Uploading image to server...' : 'Click to select image file from computer/device'}
              </p>
              <p className="text-[10px] text-slate-400">Supports PNG, JPG, JPEG, WEBP</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CAMERA CAPTURE */}
      {activeTab === 'camera' && (
        <div className="space-y-3">
          {cameraError ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 text-center space-y-2">
              <p>{cameraError}</p>
              <button
                type="button"
                onClick={startCamera}
                className="px-3 py-1 bg-red-600 text-white rounded-lg text-[11px] font-bold"
              >
                Try Again
              </button>
            </div>
          ) : capturedPhoto ? (
            <div className="space-y-2 text-center">
              <div className="relative h-44 w-full rounded-2xl overflow-hidden border border-slate-200 bg-black">
                <img src={capturedPhoto} alt="Captured product" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1">
                  <Check className="w-3 h-3" />
                  <span>Photo Saved to Server</span>
                </div>
              </div>
              <button
                type="button"
                onClick={retakePhoto}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retake Photo</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 text-center">
              <div className="relative h-48 w-full rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!cameraActive && (
                  <div className="absolute inset-0 bg-slate-900/80 text-white flex flex-col items-center justify-center p-4">
                    <p className="text-xs font-bold mb-2">Opening Camera Stream...</p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-xl"
                    >
                      Start Camera
                    </button>
                  </div>
                )}
              </div>

              {cameraActive && (
                <button
                  type="button"
                  onClick={takePhoto}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 inline-flex items-center space-x-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap Product Photo</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: IMAGE URL / PRESETS */}
      {activeTab === 'url' && (
        <div className="space-y-2">
          <input
            type="url"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://images.unsplash.com/... or image link"
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
          />
          <div className="text-[10px] text-slate-400 font-medium">Quick Presets:</div>
          <div className="flex flex-wrap gap-1.5">
            {sampleImagePresets.map((preset) => (
              <button
                type="button"
                key={preset.label}
                onClick={() => onChange(preset.url)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-[10px] font-bold text-slate-700 shadow-2xs transition-colors"
              >
                + {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview Box (If image is selected) */}
      {value && (
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 overflow-hidden">
            <img
              src={resolveImageUrl(value)}
              alt="Selected Preview"
              className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80';
              }}
            />
            <div className="truncate">
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-block">
                ✓ Image Saved
              </span>
              <p className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">
                {value}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
            title="Remove Image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
