
import React from "react";
import { Button } from "@/components/ui/button";
import { Mail, BookmarkX } from "lucide-react";

interface CandidateActionsProps {
  email: string;
  candidateId: string;
  onContact: (email: string) => void;
  onRemove: (id: string) => void;
  onClick?: (e: React.MouseEvent) => void;
}

export const CandidateActions = ({
  email,
  candidateId,
  onContact,
  onRemove,
  onClick,
}: CandidateActionsProps) => {
  return (
    <div className="flex justify-end gap-2" onClick={onClick}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onContact(email)}
        className="text-aptiv-gray-600 hover:text-aptiv hover:bg-aptiv/5"
      >
        <Mail className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(candidateId)}
        className="text-aptiv-gray-600 hover:text-aptiv hover:bg-aptiv/5"
      >
        <BookmarkX className="h-4 w-4" />
      </Button>
    </div>
  );
};
