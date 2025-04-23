
import { sampleImages } from "@/data/sampleImages";
import { ImageData } from "@/types/image";
import { isValidUUID, generateUUID } from "@/hooks/useImageVoting.utils";

export const fetchSampleImages = () => {
  const original = sampleImages.find(img => img.isOriginal);
  const sampleConceptImages = sampleImages
    .filter(img => !img.isOriginal)
    .map(img => ({
      ...img,
      id: isValidUUID(img.id) ? img.id : generateUUID(),
    }));
  return {
    originalImage: original || null,
    conceptImages: sampleConceptImages,
    promptText: "This is a sample prompt for demonstration purposes. It would normally contain the description used to generate the t-shirt designs.",
  };
};
