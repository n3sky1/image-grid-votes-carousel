
import { useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown, Heart } from "lucide-react";
import { ImageData } from "@/types/image";
import ImageCard from "./ImageCard";
import ImageCarousel from "./ImageCarousel";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import VotingCompleted from "./VotingCompleted";
import VotingProgress from "./VotingProgress";
import VotingError from "./VotingError";
import VotingLoading from "./VotingLoading";

interface ImageVotingGridProps {
  asin: string;
}

const ImageVotingGrid = ({ asin }: ImageVotingGridProps) => {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [conceptImages, setConceptImages] = useState<ImageData[]>([]);
  const [votedImages, setVotedImages] = useState<Record<string, 'like' | 'dislike' | 'love'>>({});
  const [allVoted, setAllVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch original image and concept images from Supabase
  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if tshirt exists, if not create it
        const { data: existingTshirt, error: checkError } = await supabase
          .from("tshirts")
          .select("asin")
          .eq("asin", asin)
          .maybeSingle();
        
        if (checkError) {
          console.error("Error checking for tshirt:", checkError);
        }
        
        // Initialize tshirt if it doesn't exist
        if (!existingTshirt) {
          console.log("Tshirt doesn't exist, initializing...");
          const { error: insertError } = await supabase
            .from("tshirts")
            .insert({ 
              asin: asin, 
              original_image_url: "https://m.media-amazon.com/images/I/71zAlj7yDrL._AC_UL1500_.jpg", // Sample image URL
              title: `Demo T-shirt (${asin})`
            });
          
          if (insertError) {
            console.error("Error initializing tshirt:", insertError);
            setError("Failed to initialize the database. Please try again.");
            setLoading(false);
            return;
          }
          
          // Add some sample concepts
          const conceptUrls = [
            "https://m.media-amazon.com/images/I/61pDu-GrM6L._AC_UL1500_.jpg",
            "https://m.media-amazon.com/images/I/61HMbj5KySL._AC_UL1500_.jpg",
            "https://m.media-amazon.com/images/I/71nfRQUb3uL._AC_UL1500_.jpg"
          ];
          
          for (const url of conceptUrls) {
            await supabase
              .from("concepts")
              .insert({
                tshirt_asin: asin,
                concept_url: url
              });
          }
          
          console.log("Sample concepts added");
        }

        // Fetch tshirt data
        const { data: tshirt, error: tshirtError } = await supabase
          .from("tshirts")
          .select("original_image_url, asin")
          .eq("asin", asin)
          .maybeSingle();

        if (tshirtError) {
          console.error("Error fetching tshirt:", tshirtError);
          setError("Failed to load the original image for this ASIN.");
          setLoading(false);
          return;
        }

        if (!tshirt || !tshirt.original_image_url) {
          setError("No image found for this ASIN.");
          setLoading(false);
          return;
        }

        // Set the original image
        setOriginalImage({
          id: `original-${tshirt.asin}`,
          src: tshirt.original_image_url,
          alt: "Original T-shirt Design",
          isOriginal: true,
        });

        // Fetch concept images for this ASIN
        const { data: concepts, error: conceptError } = await supabase
          .from("concepts")
          .select("concept_id, concept_url")
          .eq("tshirt_asin", asin);

        if (conceptError) {
          console.error("Error fetching concepts:", conceptError);
          setError("Failed to load concept images.");
          setLoading(false);
          return;
        }

        // Map concept images to ImageData
        setConceptImages(
          (concepts || []).map((c: any) => ({
            id: c.concept_id,
            src: c.concept_url,
            alt: "Concept Design",
            isOriginal: false,
          }))
        );
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [asin]);

  // Check if all images have been voted
  useEffect(() => {
    const nonOriginalCount = conceptImages.length;
    const votedCount = Object.keys(votedImages).length;
    if (votedCount >= nonOriginalCount && nonOriginalCount > 0) {
      setAllVoted(true);
    }
  }, [votedImages, conceptImages]);

  const getVoteIcon = (vote: 'like' | 'dislike' | 'love') => {
    switch (vote) {
      case 'like':
        return <ThumbsUp size={16} className="text-green-500" />;
      case 'dislike':
        return <ThumbsDown size={16} className="text-gray-500" />;
      case 'love':
        return <Heart size={16} className="text-red-500" />;
    }
  };

  const handleVote = (id: string, vote: 'like' | 'dislike' | 'love') => {
    setVotedImages(prev => ({
      ...prev,
      [id]: vote
    }));
    setConceptImages(prev => prev.filter(img => img.id !== id));

    const voteText = vote === 'like' ? 'Liked' : vote === 'dislike' ? 'Disliked' : 'Loved';
    toast(voteText, {
      description: `You ${voteText.toLowerCase()} this image`,
      position: "bottom-right",
      icon: getVoteIcon(vote)
    });
  };

  if (loading) {
    return <VotingLoading />;
  }

  if (error) {
    return <VotingError error={error} />;
  }

  if (allVoted) {
    return <VotingCompleted votedImages={votedImages} />;
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {/* Original image */}
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold mb-3">Original Image</h2>
          {originalImage ? (
            <div className="flex-1 flex items-center justify-center bg-white rounded-lg p-4 shadow-md">
              <ImageCard image={originalImage} className="max-h-[500px] w-auto" />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 border rounded-lg p-8">
              <p className="text-gray-500">No original image available</p>
            </div>
          )}
        </div>

        {/* Comparison images carousel */}
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold mb-3">New Designs</h2>
          <div className="flex-1 flex items-start">
            <ImageCarousel images={conceptImages} onVote={handleVote} />
          </div>

          {/* Voting statistics */}
          <VotingProgress votedImages={votedImages} conceptImagesCount={conceptImages.length} />
        </div>
      </div>
    </div>
  );
};

export default ImageVotingGrid;
