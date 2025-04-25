
import React from 'react';
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { OriginalImageSectionProps } from "@/types/props";
import ImageCard from "./ImageCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

interface ExtendedOriginalImageSectionProps extends OriginalImageSectionProps {
  totalReadyCount?: number;
  userCompletedCount?: number;
  remainingCount?: number;
  refreshStats?: () => void;
}

const OriginalImageSection = ({
  originalImage,
  promptText,
  onOriginalAction,
  onEditPrompt,
  onToggleDataSource,
  useTestData,
  totalReadyCount = 0,
  userCompletedCount = 0,
  remainingCount = 0,
  refreshStats,
}: ExtendedOriginalImageSectionProps) => {
  const handleProblemClick = async (problem: 'copyrighted' | 'no-design' | 'cant-design') => {
    if (!originalImage) return;
    
    const asin = originalImage.id.replace('original-', '');
    
    try {
      // First, ensure the user is authenticated
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        throw new Error("Authentication required");
      }
      
      // Try to update the tshirt with the review problem
      try {
        const { error: tshirtError } = await supabase
          .from('tshirts')
          .update({ 
            review_problem: problem,
            ready_for_voting: false 
          })
          .eq('asin', asin);

        if (tshirtError) {
          console.error("Error updating tshirt:", tshirtError);
        }
      } catch (updateError) {
        console.error("Update operation failed:", updateError);
      }

      // Always try to record completion regardless of tshirt update result
      try {
        const { error: completedError } = await supabase
          .from('completed_votings')
          .insert({ 
            asin: asin, 
            user_id: authData.user.id 
          });

        if (completedError && completedError.code !== '23505') { // Ignore duplicate key error
          console.error("Error recording completion:", completedError);
        } else {
          // Refresh the statistics when a completion is recorded
          if (refreshStats) {
            refreshStats();
          }
        }
      } catch (completionError) {
        console.error("Failed to record completion:", completionError);
      }

      toast.success('Problem reported', {
        description: 'This t-shirt has been marked for review.',
      });

      // Always call the original action handler to move to the next t-shirt
      onOriginalAction(problem);
    } catch (error) {
      console.error('Error reporting problem:', error);
      toast.error('Error reporting problem', {
        description: 'Please try again later.',
      });
      
      // Even in case of error, try to move on
      onOriginalAction(problem);
    }
  };

  // Determine the appropriate display text
  let displayText = "No designs available";
  
  if (originalImage) {
    if (remainingCount > 0) {
      displayText = `Design ${remainingCount} remaining`;
      console.log("Using remaining count for display:", remainingCount);
    } else if (totalReadyCount > 0) {
      // Only show position if we have actual data
      displayText = `All designs reviewed`;
    } else {
      displayText = "Design available for review";
    }
  } else if (totalReadyCount === 0) {
    displayText = "No designs available for review";
  } else if (remainingCount === 0) {
    displayText = "All designs reviewed";
  } else {
    displayText = `${remainingCount} designs remaining`;
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col space-y-4">
        {originalImage ? (
          <div className="relative rounded-lg overflow-hidden border border-gray-200 group transition">
            <AspectRatio ratio={1}>
              <ImageCard image={originalImage} className="w-full h-full object-cover" />
              <div className="absolute left-0 bottom-0 w-full flex justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent px-4 py-3 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 z-10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleProblemClick('copyrighted')}
                  className="text-xs pointer-events-auto"
                >
                  Copyrighted
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleProblemClick('no-design')}
                  className="text-xs pointer-events-auto"
                >
                  No Design
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleProblemClick('cant-design')}
                  className="text-xs pointer-events-auto"
                >
                  Can't Design
                </Button>
              </div>
            </AspectRatio>
          </div>
        ) : (
          <Card className="bg-gray-50 flex items-center justify-center h-[300px]">
            <CardContent className="text-center text-gray-500">
              <AlertCircle className="mx-auto mb-2" />
              No image available
            </CardContent>
          </Card>
        )}
      </div>
      <div className="w-full flex justify-center">
        <div className="bg-white border border-gray-200 text-gray-800 rounded-lg p-2 w-full text-center font-sans text-base">
          {displayText}
        </div>
      </div>
    </div>
  );
};

export default OriginalImageSection;
