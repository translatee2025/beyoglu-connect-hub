import { useState, useRef } from "react";
import { Camera, X, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

interface PetPhotoUploadProps {
  petId?: string;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

const PetPhotoUpload = ({ petId, photos, onPhotosChange, maxPhotos = 5 }: PetPhotoUploadProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!user) {
      toast({ title: "Please log in to upload photos", variant: "destructive" });
      return;
    }

    if (photos.length + files.length > maxPhotos) {
      toast({ title: `Maximum ${maxPhotos} photos allowed`, variant: "destructive" });
      return;
    }

    setUploading(true);
    const newPhotos: string[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: `${file.name} is too large (max 5MB)`, variant: "destructive" });
        continue;
      }

      if (!file.type.startsWith("image/")) {
        toast({ title: `${file.name} is not an image`, variant: "destructive" });
        continue;
      }

      try {
        // Resize for efficiency, then upload to Storage (instead of embedding a
        // multi-hundred-KB base64 blob into the pet_profiles row, which bloated
        // payloads and could break inserts).
        const blob = await resizeToBlob(file);
        const path = `${user.id}/pets/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
        const { error } = await supabase.storage
          .from("user-media")
          .upload(path, blob, { cacheControl: "3600", upsert: false, contentType: "image/jpeg" });
        if (error) throw error;
        const { data } = supabase.storage.from("user-media").getPublicUrl(path);
        if (data?.publicUrl) newPhotos.push(data.publicUrl);
      } catch (err: any) {
        toast({ title: `Upload failed: ${file.name}`, description: err?.message, variant: "destructive" });
      }
    }

    if (newPhotos.length) onPhotosChange([...photos, ...newPhotos]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const resizeToBlob = (file: File): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 800;
          let w = img.width, h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) { h = (h / w) * maxDim; w = maxDim; }
            else { w = (w / h) * maxDim; h = maxDim; }
          }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("Image processing failed"))),
            "image/jpeg",
            0.8,
          );
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  const setPrimary = (index: number) => {
    if (index === 0) return;
    const reordered = [...photos];
    const [moved] = reordered.splice(index, 1);
    reordered.unshift(moved);
    onPhotosChange(reordered);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
            <img src={photo} alt={`Pet photo ${i + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              <button
                type="button"
                onClick={() => setPrimary(i)}
                className={`p-1.5 rounded-full ${i === 0 ? "bg-yellow-500 text-white" : "bg-white/80 text-foreground hover:bg-white"}`}
                title={i === 0 ? "Primary photo" : "Set as primary"}
              >
                <Star className="w-3.5 h-3.5" fill={i === 0 ? "currentColor" : "none"} />
              </button>
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="p-1.5 rounded-full bg-white/80 text-destructive hover:bg-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {i === 0 && (
              <span className="absolute top-1 left-1 text-xs bg-yellow-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                Main
              </span>
            )}
          </div>
        ))}

        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <Camera className="w-5 h-5" />
            <span className="text-xs">{uploading ? "..." : "Add"}</span>
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-muted-foreground">
        {photos.length}/{maxPhotos} photos • First photo is the profile picture
      </p>
    </div>
  );
};

export default PetPhotoUpload;
