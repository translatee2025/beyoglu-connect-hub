export const parsePhotos = (photos: any): string[] => {
  if (!photos) return [];
  if (Array.isArray(photos)) return photos.filter(Boolean);
  if (typeof photos === "string") {
    const cleaned = photos.replace(/^\{/, "").replace(/\}$/, "");
    if (!cleaned) return [];
    return cleaned
      .split(",")
      .map((s) => s.replace(/^"|"$/g, "").trim())
      .filter(Boolean);
  }
  return [];
};
