
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
}: ExtendedOriginalImageSectionProps) => {
  const handleProblemClick = async (problem: 'copyrighted' | 'no-design' | 'cant-design') => {
    if (!originalImage) return;
    
    const asin = originalImage.id.replace('original-', '');
    
    try {
      // Update the tshirts table with the review_problem
      const { error: tshirtError } = await supabase
        .from('tshirts')
        .update({ 
          review_problem: problem,
          ready_for_voting: false 
        })
        .eq('asin', asin);

      if (tshirtError) throw tshirtError;

      // Also insert into completed_votings to track that this user has completed this t-shirt
      const { error: completedError } = await supabase
        .from('completed_votings')
        .insert({ 
          asin: asin, 
          user_id: (await supabase.auth.getUser()).data.user?.id 
        });

      if (completedError) throw completedError;

      toast.success('Problem reported', {
        description: 'This t-shirt has been marked for review.',
      });

      // Call the original action handler with the problem type
      onOriginalAction(problem);
    } catch (error) {
      console.error('Error updating tshirt:', error);
      toast.error('Error reporting problem', {
        description: 'Please try again later.',
      });
    }
  };

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
          Design {userCompletedCount + 1} of {totalReadyCount} to Review
        </div>
      </div>
    </div>
  );
};

export default OriginalImageSection;
