
import { useShortlistsAuth } from "./shortlists/useShortlistsAuth";
import { useJobDescriptionData } from "./shortlists/useJobDescriptionData";
import { useMatchedCandidates } from "./shortlists/useMatchedCandidates";
import { useMatchingLogic } from "./shortlists/useMatchingLogic";
import { supabase } from "@/integrations/supabase/client";
// Import directly from the hooks file, not through the re-export
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export function useShortlists() {
  const { toast } = useToast();
  const { userId } = useShortlistsAuth();
  const { jobDescription, setJobDescription, jobDescriptions } = useJobDescriptionData(userId);
  const { matchedCandidates, refetchMatchedCandidates } = useMatchedCandidates(userId);
  const { 
    isMatching, 
    matchingResults, 
    selectedJobId,
    setSelectedJobId,
    handleMatch: handleMatchCore,
    handleClearMatches: handleClearMatchesCore
  } = useMatchingLogic(refetchMatchedCandidates);

  // Clear job description when component mounts
  useEffect(() => {
    setJobDescription("");
  }, [setJobDescription]);

  const handleMatch = async (jobDescriptionId?: string, jobRole?: string) => {
    console.log("useShortlists handleMatch - jobRole:", jobRole);
    console.log("useShortlists handleMatch - userId:", userId);
    console.log("useShortlists handleMatch - jobDescriptionId:", jobDescriptionId);
    await handleMatchCore(jobDescription, jobDescriptionId, jobRole, userId);
  };

  const handleClearMatches = async () => {
    try {
      let query = supabase.from('cv_match').delete();
      
      // If userId is available, only delete the user's matches
      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        query = query.not('id', 'is', null);
      }
      
      const { error } = await query;
      
      if (error) throw error;

      // Clear UI state
      handleClearMatchesCore();
      
      toast({
        title: "Matches cleared",
        description: "All your matches have been cleared from the table and database.",
      });
    } catch (error) {
      console.error('Error clearing matches:', error);
      toast({
        title: "Error",
        description: "Failed to clear matches. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    jobDescription,
    setJobDescription,
    isMatching,
    matchingResults,
    jobDescriptions,
    matchedCandidates,
    handleMatch,
    handleClearMatches,
    selectedJobId,
    setSelectedJobId,
    userId,
    refetchMatchedCandidates
  };
}
