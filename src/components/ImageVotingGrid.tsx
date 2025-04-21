import { useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown, Heart } from "lucide-react";
import { ImageData } from "@/types/image";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import VotingCompleted from "./VotingCompleted";
import VotingProgress from "./VotingProgress";
import VotingError from "./VotingError";
import VotingLoading from "./VotingLoading";
import { Card } from "@/components/ui/card";
import { sampleImages } from "@/data/sampleImages";
import OriginalImageSection from "./OriginalImageSection";
import ConceptImagesGrid from "./ConceptImagesGrid";

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
  const [promptText, setPromptText] = useState<string>("");
  const [useTestData, setUseTestData] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      setError(null);

      if (useTestData) {
        const original = sampleImages.find(img => img.isOriginal);
        setOriginalImage(original || null);
        setConceptImages(sampleImages.filter(img => !img.isOriginal));
        setPromptText("This is a sample prompt for demonstration purposes. It would normally contain the description used to generate the t-shirt designs.");
        setLoading(false);
        return;
      }

      try {
        const { data: existingTshirt, error: checkError } = await supabase
          .from("tshirts")
          .select("asin")
          .eq("asin", asin)
          .maybeSingle();

        if (checkError) {
          console.error("Error checking for tshirt:", checkError);
        }

        if (!existingTshirt) {
          console.log("Tshirt doesn't exist, initializing...");
          const { error: insertError } = await supabase
            .from("tshirts")
            .insert({
              asin: asin,
              original_image_url: "https://m.media-amazon.com/images/I/71zAlj7yDrL._AC_UL1500_.jpg",
              title: `Demo T-shirt (${asin})`
            });

          if (insertError) {
            console.error("Error initializing tshirt:", insertError);
            setError("Failed to initialize the database. Please try again.");
            setLoading(false);
            return;
          }

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

        const { data: tshirt, error: tshirtError } = await supabase
          .from("tshirts")
          .select("original_image_url, asin, generated_image_description")
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

        setOriginalImage({
          id: `original-${tshirt.asin}`,
          src: tshirt.original_image_url,
          alt: "Original T-shirt Design",
          isOriginal: true,
        });

        setPromptText(tshirt.generated_image_description || "No description available.");

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
  }, [asin, useTestData]);

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
    
    const voteText = vote === 'like' ? 'Liked' : vote === 'dislike' ? 'Disliked' : 'Loved';
    toast(voteText, {
      description: `You ${voteText.toLowerCase()} this image`,
      position: "bottom-right",
      icon: getVoteIcon(vote)
    });
  };

  const handleOriginalAction = (action: "copyrighted" | "no-design" | "cant-design") => {
    let toastMsg = "";
    switch (action) {
      case "copyrighted":
        toastMsg = "Marked as Copyrighted!";
        break;
      case "no-design":
        toastMsg = "Marked as No Design!";
        break;
      case "cant-design":
        toastMsg = "Marked as Can't Design!";
        break;
    }
    toast(toastMsg, {
      description: `You selected: ${toastMsg.replace("Marked as ", "")}`,
      position: "bottom-right",
    });
  };

  const handleEditPrompt = () => {
    toast("Edit Prompt clicked!", {
      description: "This feature is under development.",
      position: "bottom-right",
    });
  };

  const toggleDataSource = () => {
    setUseTestData(prev => !prev);
    setVotedImages({});
  };

  if (loading) return <VotingLoading />;
  if (error) return <VotingError error={error} />;
  if (allVoted) return <VotingCompleted votedImages={votedImages} />;

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="p-4 space-y-8">
        <Card className="overflow-hidden shadow-lg border-0">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 bg-gradient-to-br from-purple-50 to-blue-50 p-6 space-y-5">
              <VotingProgress 
                votedImages={votedImages} 
                conceptImagesCount={conceptImages.length} 
              />
              <OriginalImageSection
                originalImage={originalImage}
                promptText={promptText}
                onOriginalAction={handleOriginalAction}
                onEditPrompt={handleEditPrompt}
                onToggleDataSource={toggleDataSource}
                useTestData={useTestData}
              />
            </div>
            <div className="md:w-2/3 p-6">
              {/* Optional: If you want to keep anything here in the future */}
            </div>
          </div>
        </Card>
        <ConceptImagesGrid
          conceptImages={conceptImages}
          votedImages={votedImages}
          onVote={handleVote}
        />
      </div>
    </div>
  );
};

export default ImageVotingGrid;
