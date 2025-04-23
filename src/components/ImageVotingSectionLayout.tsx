
import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface ImageVotingSectionLayoutProps {
  left: ReactNode;
  right: ReactNode;
}

const ImageVotingSectionLayout = ({ left, right }: ImageVotingSectionLayoutProps) => (
  <Card className="overflow-hidden shadow-lg border-0">
    <div className="p-6">
      <div className="flex flex-col md:flex-row w-full">
        <div className="md:w-1/2 bg-gradient-to-br from-purple-50 to-blue-50">
          <div className="p-6">
            {left}
          </div>
        </div>
        <div className="md:w-1/2 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="p-6 space-y-6">
            {right}
          </div>
        </div>
      </div>
    </div>
  </Card>
);

export default ImageVotingSectionLayout;
