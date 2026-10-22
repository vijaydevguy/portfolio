"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import toast from "react-hot-toast";

export interface ImageItem {
  id: string; // unique key (timestamp or existing url)
  url: string; // remote URL or blob: preview URL
  file?: File; // present only for pending local uploads
  isPending?: boolean; // true if not yet uploaded to Cloudinary
}

interface MultiImageUploaderProps {
  label: string;
  items: ImageItem[];
  onChange: (items: ImageItem[]) => void;
  maxImages?: number; // default 10
  helperText?: string;
}

export default function MultiImageUploader({
  label,
  items = [],
  onChange,
  maxImages = 10,
  helperText,
}: MultiImageUploaderProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "manual">("upload");
  const [manualUrl, setManualUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up any revoked blob URLs on component unmount
  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.url.startsWith("blob:")) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, []);

  // Handle local file selection (single or multi-file)
  const handleFilesSelected = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileArray.length === 0) {
      toast.error("Please select valid image files (PNG, JPG, WebP, SVG).");
      return;
    }

    const availableSlots = maxImages - items.length;
    if (availableSlots <= 0) {
      toast.error(`Maximum limit of ${maxImages} screenshots reached. Please remove one first.`);
      return;
    }

    const filesToAdd = fileArray.slice(0, availableSlots);
    if (fileArray.length > availableSlots) {
      toast(`Added first ${availableSlots} images (Maximum limit ${maxImages}).`, { icon: "ℹ️" });
    }

    const newItems: ImageItem[] = filesToAdd.map((file) => ({
      id: `pending_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      url: URL.createObjectURL(file), // Instant client-side blob preview (no API call)
      file,
      isPending: true,
    }));

    onChange([...items, ...newItems]);
    toast.success(`${newItems.length} image(s) queued for upload!`);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Add a direct manual image URL
  const handleAddManualUrl = () => {
    const trimmed = manualUrl.trim();
    if (!trimmed) return;

    if (items.length >= maxImages) {
      toast.error(`Maximum limit of ${maxImages} screenshots reached.`);
      return;
    }

    const newItem: ImageItem = {
      id: `url_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      url: trimmed,
      isPending: false,
    };

    onChange([...items, newItem]);
    setManualUrl("");
    toast.success("Image URL added!");
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const itemToRemove = items[indexToRemove];
    if (itemToRemove?.url.startsWith("blob:")) {
      URL.revokeObjectURL(itemToRemove.url);
    }
    const updated = items.filter((_, i) => i !== indexToRemove);
    onChange(updated);
  };

  const handleMoveImage = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= items.length) return;
    const updated = [...items];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    onChange(updated);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  // Thumbnail Drag and Drop State for Reordering
  const [draggedThumbnailIdx, setDraggedThumbnailIdx] = useState<number | null>(null);
  const [dragOverThumbnailIdx, setDragOverThumbnailIdx] = useState<number | null>(null);

  const handleThumbnailDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";

    const target = e.currentTarget as HTMLElement;
    if (e.dataTransfer.setDragImage) {
      e.dataTransfer.setDragImage(target, target.offsetWidth / 2, target.offsetHeight / 2);
    }

    setTimeout(() => {
      setDraggedThumbnailIdx(index);
    }, 0);
  };

  const handleThumbnailDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (dragOverThumbnailIdx !== index) {
      setDragOverThumbnailIdx(index);
    }
  };

  const handleThumbnailDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceIndexStr = e.dataTransfer.getData("text/plain");
    const sourceIndex = sourceIndexStr ? parseInt(sourceIndexStr, 10) : draggedThumbnailIdx;

    if (sourceIndex !== null && !isNaN(sourceIndex) && sourceIndex !== targetIndex) {
      const updated = [...items];
      const [draggedItem] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, draggedItem);
      onChange(updated);
    }

    setDraggedThumbnailIdx(null);
    setDragOverThumbnailIdx(null);
  };

  const handleThumbnailDragEnd = () => {
    setDraggedThumbnailIdx(null);
    setDragOverThumbnailIdx(null);
  };

  const pendingCount = items.filter((i) => i.isPending).length;

  return (
    <div className="space-y-3.5 text-xs">
      <div className="flex items-center justify-between">
        <div>
          <label className="form-label font-semibold text-zinc-900 !mb-0">{label}</label>
          {helperText && <p className="text-[11px] text-slate-500 mt-0.5">{helperText}</p>}
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
              {pendingCount} pending upload
            </span>
          )}
          <span className="text-[11px] font-mono text-slate-500 bg-zinc-100 px-2.5 py-1 rounded-full border border-zinc-200">
            {items.length} / {maxImages} images
          </span>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-1 p-0.5 bg-zinc-100 rounded-lg w-fit border border-zinc-200">
        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
            activeTab === "upload"
              ? "bg-white text-zinc-900 shadow-2xs"
              : "text-slate-500 hover:text-zinc-800"
          }`}
        >
          Select Local Images
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("manual")}
          className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
            activeTab === "manual"
              ? "bg-white text-zinc-900 shadow-2xs"
              : "text-slate-500 hover:text-zinc-800"
          }`}
        >
          Paste Direct URL / CDN
        </button>
      </div>

      {/* Upload Zone or Direct URL Field */}
      {activeTab === "upload" ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed p-6 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-center ${
            isDragging
              ? "border-blue-500 bg-blue-50/80 scale-[1.005]"
              : "border-zinc-300 hover:border-zinc-400 bg-zinc-50/60 hover:bg-zinc-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple // Multi-file selection support
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFilesSelected(e.target.files);
              }
            }}
            className="hidden"
          />

          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center shadow-2xs">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-800">
              <span className="text-blue-600 underline">Select multiple images</span> or drag and drop
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              PNG, JPG, WebP, SVG • Instant client preview • Uploads to Cloudinary only when project is saved
            </p>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="url"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddManualUrl();
              }
            }}
            placeholder="https://images.unsplash.com/... or Cloudinary URL"
            className="form-input bg-white text-xs py-2 flex-1"
          />
          <button
            type="button"
            onClick={handleAddManualUrl}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl text-xs cursor-pointer shadow-xs whitespace-nowrap"
          >
            Add Image
          </button>
        </div>
      )}

      {/* Render Current Images Grid with Drag and Drop UI */}
      {items.length > 0 && (
        <div className="space-y-2.5 pt-3 border-t border-zinc-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-900 font-heading">
                Project Screenshots ({items.length} of {maxImages})
              </span>
              <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-medium border border-blue-100/80">
                1st is Primary Cover
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline-flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Drag cards to rearrange order
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 pt-1">
            {items.map((item, idx) => {
              const isBeingDragged = draggedThumbnailIdx === idx;
              const isOver = dragOverThumbnailIdx === idx && !isBeingDragged;

              return (
                <div
                  key={item.id || `${item.url}-${idx}`}
                  draggable
                  onDragStart={(e) => handleThumbnailDragStart(e, idx)}
                  onDragOver={(e) => handleThumbnailDragOver(e, idx)}
                  onDrop={(e) => handleThumbnailDrop(e, idx)}
                  onDragEnd={handleThumbnailDragEnd}
                  className={`group relative rounded-2xl border transition-all duration-200 select-none flex flex-col ${
                    isBeingDragged
                      ? "opacity-35 scale-95 border-2 border-dashed border-blue-500 bg-blue-50/40 shadow-inner rotate-1"
                      : isOver
                      ? "border-blue-600 ring-4 ring-blue-500/20 scale-[1.04] shadow-xl z-20 bg-white"
                      : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-lg hover:-translate-y-1"
                  }`}
                >
                  {/* Drop Destination Highlight Indicator */}
                  {isOver && (
                    <div className="absolute inset-x-0 -top-1 h-1.5 bg-blue-600 rounded-full z-30 shadow-md animate-pulse" />
                  )}

                  {/* Thumbnail Container */}
                  <div className="relative aspect-[16/10] w-full bg-zinc-100 overflow-hidden rounded-t-2xl">
                    <Image
                      src={item.url}
                      alt={`Screenshot ${idx + 1}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
                      unoptimized
                    />

                    {/* Gradient overlay on hover for visibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

                    {/* Top Row: Cover/Badge on Left & Delete Button on Right */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
                      {/* Number / Cover badge */}
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold backdrop-blur-md shadow-sm pointer-events-none ${
                          idx === 0
                            ? "bg-blue-600 text-white border border-blue-400/50"
                            : "bg-black/70 text-white font-mono border border-white/10"
                        }`}
                      >
                        {idx === 0 ? "Cover #1" : `#${idx + 1}`}
                      </span>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleRemoveImage(idx);
                        }}
                        title="Delete Image"
                        className="w-7 h-7 rounded-full bg-white/95 text-red-600 hover:bg-red-600 hover:text-white border border-red-300 shadow-md flex items-center justify-center transition-all duration-150 cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 scale-90 group-hover:scale-100 hover:scale-110"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Pending Upload Indicator Pill */}
                    {item.isPending && (
                      <div className="absolute bottom-2 left-2 z-10">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold bg-amber-500/90 text-white backdrop-blur-xs shadow-xs">
                          Pending Save
                        </span>
                      </div>
                    )}

                    {/* Center Drag Handle Indicator */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                      <div className="px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-xl border border-white/20 cursor-grab active:cursor-grabbing">
                        <svg className="w-3.5 h-3.5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-12a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                        </svg>
                        <span>Hold to Drag</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Grip Icon, Label, and Arrows */}
                  <div className="flex items-center justify-between px-2.5 py-2 bg-zinc-50/90 border-t border-zinc-100 rounded-b-2xl">
                    <div className="flex items-center gap-1.5 text-slate-500 cursor-grab active:cursor-grabbing">
                      <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-12a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                      </svg>
                      <span className="text-[10px] font-semibold text-zinc-700 truncate max-w-[85px]">
                        {idx === 0 ? "Cover Photo" : `Screen #${idx + 1}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveImage(idx, idx - 1);
                        }}
                        title="Move Earlier"
                        className="w-5 h-5 rounded-md bg-white border border-zinc-200 text-zinc-600 hover:text-blue-600 hover:border-blue-300 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                      >
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        disabled={idx === items.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveImage(idx, idx + 1);
                        }}
                        title="Move Later"
                        className="w-5 h-5 rounded-md bg-white border border-zinc-200 text-zinc-600 hover:text-blue-600 hover:border-blue-300 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                      >
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
