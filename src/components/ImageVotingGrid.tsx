
import { useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown, Heart } from "lucide-react";
import { ImageData } from "@/types/image";
import ImageCard from "./ImageCard";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import VotingCompleted from "./VotingCompleted";
import VotingProgress from "./VotingProgress";
import VotingError from "./VotingError";
import VotingLoading from "./VotingLoading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      setError(null);

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
  }, [asin]);

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
      <div className="p-4 space-y-8">
        {/* Original Image Section */}
        <Card className="overflow-hidden shadow-lg border-0">
          <div className="flex flex-col md:flex-row">
            {/* Original Image Container */}
            <div className="md:w-1/3 bg-gradient-to-br from-purple-50 to-blue-50 p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Original Design</h2>
              {originalImage ? (
                <div className="rounded-lg overflow-hidden">
                  <ImageCard
                    image={originalImage}
                    className="w-full h-auto max-h-[350px] object-contain mx-auto shadow-sm"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center bg-gray-50 border rounded-lg p-8 h-[200px]">
                  <p className="text-gray-500">No original image available</p>
                </div>
              )}
            </div>

            {/* Controls and Info */}
            <div className="md:w-2/3 p-6 space-y-5">
              <div className="flex flex-wrap gap-3 mb-5">
                <Button
                  variant="outline"
                  onClick={() => handleOriginalAction("copyrighted")}
                  className="bg-white hover:bg-gray-50"
                >
                  Copyrighted
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOriginalAction("no-design")}
                  className="bg-white hover:bg-gray-50"
                >
                  No Design
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOriginalAction("cant-design")}
                  className="bg-white hover:bg-gray-50"
                >
                  Can't Design
                </Button>
                <Button
                  variant="outline"
                  onClick={handleEditPrompt}
                  className="bg-white hover:bg-gray-50"
                >
                  Edit Prompt
                </Button>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-5 shadow-sm border border-blue-100">
                <div className="text-base font-bold mb-2 text-gray-800">Generation Prompt</div>
                <div className="text-gray-700 max-h-[150px] overflow-y-auto text-sm">{promptText}</div>
              </div>

              <VotingProgress votedImages={votedImages} conceptImagesCount={conceptImages.length} />
            </div>
          </div>
        </Card>

        {/* New Designs Grid Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 px-2">New Design Options</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {conceptImages.map(image => (
              <Card key={image.id} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-4">
                  <div className="rounded-lg overflow-hidden mb-3">
                    <ImageCard 
                      image={image} 
                      className="aspect-square object-cover w-full" 
                    />
                  </div>
                  
                  {!votedImages[image.id] ? (
                    <div className="flex justify-between gap-2 mt-3">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleVote(image.id, 'dislike')}
                        className="flex-1 bg-white hover:bg-red-50 hover:text-red-600 border-gray-200"
                      >
                        <ThumbsDown size={16} className="mr-1" />
                        Dislike
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleVote(image.id, 'like')}
                        className="flex-1 bg-white hover:bg-green-50 hover:text-green-600 border-gray-200"
                      >
                        <ThumbsUp size={16} className="mr-1" />
                        Like
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleVote(image.id, 'love')}
                        className="flex-1 bg-white hover:bg-pink-50 hover:text-pink-600 border-gray-200"
                      >
                        <Heart size={16} className="mr-1" />
                        Love
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-center mt-3">
                      <Badge variant={
                        votedImages[image.id] === 'like' ? "secondary" :
                        votedImages[image.id] === 'dislike' ? "destructive" : "default"
                      } className={`py-2 px-3 ${
                        votedImages[image.id] === 'love' ? "bg-pink-500 hover:bg-pink-600" :
                        votedImages[image.id] === 'like' ? "bg-green-500 hover:bg-green-600" :
                        "bg-gray-400 hover:bg-gray-500"
                      }`}>
                        {getVoteIcon(votedImages[image.id])}
                        <span className="ml-1">
                          {votedImages[image.id] === 'like' ? 'Liked' : 
                           votedImages[image.id] === 'dislike' ? 'Disliked' : 'Loved'}
                        </span>
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageVotingGrid;
