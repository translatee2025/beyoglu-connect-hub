import { useState, useRef } from "react";
import { ImagePlus, X, Film, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface MediaUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  accept?: string;
  label?: string;
}

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm";

export function MediaUpload({
  value,
  onChange,
  maxFiles = 5,
  accept = ACCEPTED_TYPES,
  label = "Add Photos / Videos",
}: MediaUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    const remaining = maxFiles - value.length;
    if (remaining <= 0) {
      toast({ title: "Max files reached", variant: "destructive" });
      return;
    }

    setUploading(true);
    const newUrls: string[] = [];

    try {
      const filesToUpload = Array.from(files).slice(0, remaining);
      for (const file of filesToUpload) {
        if (file.size > 20 * 1024 * 1024) {
          toast({ title: `${file.name} is too large (max 20MB)`, variant: "destructive" });
          continue;
        }

        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error } = await supabase.storage.from("user-media").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

        if (error) {
          console.error("Upload error:", error);
          toast({ title: "Upload failed", description: error.message, variant: "destructive" });
          continue;
        }

        const { data: urlData } = supabase.storage.from("user-media").getPublicUrl(path);
        if (urlData?.publicUrl) {
          newUrls.push(urlData.publicUrl);
        }
      }

      if (newUrls.length > 0) {
        onChange([...value, ...newUrls]);
      }
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const isVideo = (url: string) => /\.(mp4|mov|webm)(\?|$)/i.test(url);

  return (
    <div className="space-y-2">
      {/* Preview grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((url, i) => (
            <div key={i} className="relative group rounded-lg overflow-hidden border border-border aspect-square bg-muted">
              {isVideo(url) ? (
                <video src={url} className="w-full h-full object-cover" muted />
              ) : (
                <img src={url} alt="" className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {isVideo(url) && (
                <div className="absolute bottom-1 left-1">
                  <Film className="w-4 h-4 text-primary-foreground drop-shadow" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {value.length < maxFiles && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 w-full border-dashed"
            disabled={uploading || !user}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
            ) : (
              <><ImagePlus className="w-4 h-4" /> {label}</>
            )}
          </Button>
          {!user && (
            <p className="text-xs text-muted-foreground mt-1 text-center">Log in to upload media</p>
          )}
        </div>
      )}
    </div>
  );
}
