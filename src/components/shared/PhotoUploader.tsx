import { useState, useRef } from "react";
import { ImagePlus, X, Loader2, RotateCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";

interface PhotoUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  storageBucket?: string;
  pathPrefix?: string;
}

type UploadState = "idle" | "uploading" | "done" | "error";

interface Thumbnail {
  id: string;
  url: string;
  state: UploadState;
  file?: File;
}

export function PhotoUploader({
  value,
  onChange,
  maxFiles = 5,
  storageBucket = "user-media",
  pathPrefix = "uploads",
}: PhotoUploaderProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>(
    value.map((url) => ({ id: url, url, state: "done" as UploadState }))
  );

  const isMaxReached = thumbnails.length >= maxFiles;

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${pathPrefix}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(storageBucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from(storageBucket).getPublicUrl(path);
    return data?.publicUrl || null;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    const remaining = maxFiles - thumbnails.length;
    if (remaining <= 0) return;

    const filesToUpload = Array.from(files).slice(0, remaining);
    const newThumbnails: Thumbnail[] = filesToUpload.map((file) => ({
      id: `pending-${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
      state: "uploading" as UploadState,
      file,
    }));

    const updated = [...thumbnails, ...newThumbnails];
    setThumbnails(updated);

    // Upload each file
    const results = await Promise.allSettled(
      newThumbnails.map(async (thumb) => {
        try {
          const publicUrl = await uploadFile(thumb.file!);
          if (!publicUrl) throw new Error("No URL returned");
          return { id: thumb.id, url: publicUrl, state: "done" as UploadState };
        } catch {
          return { id: thumb.id, url: thumb.url, state: "error" as UploadState, file: thumb.file };
        }
      })
    );

    setThumbnails((prev) => {
      const next = prev.map((t) => {
        const result = results.find((r) => r.status === "fulfilled" && (r as any).value.id === t.id);
        if (result && result.status === "fulfilled") return result.value;
        const rejected = results.find((r) => r.status === "rejected");
        if (rejected) return { ...t, state: "error" as UploadState };
        return t;
      });
      const urls = next.filter((t) => t.state === "done").map((t) => t.url);
      // Use setTimeout to avoid setState during render
      setTimeout(() => onChange(urls), 0);
      return next;
    });

    if (inputRef.current) inputRef.current.value = "";
  };

  const retryUpload = async (thumbId: string) => {
    const thumb = thumbnails.find((t) => t.id === thumbId);
    if (!thumb || !thumb.file) return;

    setThumbnails((prev) =>
      prev.map((t) => (t.id === thumbId ? { ...t, state: "uploading" as UploadState } : t))
    );

    try {
      const publicUrl = await uploadFile(thumb.file);
      if (!publicUrl) throw new Error("No URL");
      setThumbnails((prev) => {
        const next = prev.map((t) =>
          t.id === thumbId ? { id: thumbId, url: publicUrl, state: "done" as UploadState } : t
        );
        setTimeout(() => onChange(next.filter((t) => t.state === "done").map((t) => t.url)), 0);
        return next;
      });
    } catch {
      setThumbnails((prev) =>
        prev.map((t) => (t.id === thumbId ? { ...t, state: "error" as UploadState } : t))
      );
    }
  };

  const remove = (thumbId: string) => {
    setThumbnails((prev) => {
      const next = prev.filter((t) => t.id !== thumbId);
      setTimeout(() => onChange(next.filter((t) => t.state === "done").map((t) => t.url)), 0);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {thumbnails.map((thumb) => (
          <div
            key={thumb.id}
            className="relative"
            style={{
              width: 80,
              height: 80,
              borderRadius: 8,
              overflow: "hidden",
              border: thumb.state === "error" ? "2px solid #EF4444" : "1px solid #E2EBFC",
            }}
          >
            <img
              src={thumb.url}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />

            {/* Loading overlay */}
            {thumb.state === "uploading" && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
              >
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}

            {/* Error overlay with retry */}
            {thumb.state === "error" && (
              <div
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
                onClick={() => retryUpload(thumb.id)}
              >
                <RotateCw className="w-5 h-5 text-white" />
              </div>
            )}

            {/* Remove button */}
            <button
              type="button"
              onClick={() => remove(thumb.id)}
              className="absolute flex items-center justify-center"
              style={{
                top: 2,
                right: 2,
                width: 18,
                height: 18,
                borderRadius: "50%",
                backgroundColor: "rgba(0,0,0,0.6)",
                color: "white",
                fontSize: 12,
                lineHeight: 1,
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isMaxReached || !user}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{
          border: "1px dashed #64748B",
          backgroundColor: isMaxReached ? "#F1F5F9" : "white",
          color: isMaxReached ? "#64748B" : "#1E3A5F",
          cursor: isMaxReached || !user ? "default" : "pointer",
          opacity: isMaxReached || !user ? 0.6 : 1,
          width: "100%",
          justifyContent: "center",
        }}
      >
        <ImagePlus className="w-4 h-4" />
        {isMaxReached
          ? t("common.max_photos_reached", `Max ${maxFiles} photos`)
          : t("common.add_photo", "Add Photo")}
      </button>
    </div>
  );
}
