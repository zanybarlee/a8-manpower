import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { normalizeSkills } from "@/utils/candidateUtils";
import { CandidateTable } from "./CandidateTable";

interface DatabaseResult {
  id: string;
  name: string | null;
  experience: number | null;
  location: string | null;
  skills: unknown;
}

interface Candidate {
  id: string;
  name: string;
  role: string;
  experience: string;
  location: string;
  skills: string[];
  availability: string;
}

export const SearchTab = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const searchCandidates = async () => {
    if (!searchTerm) {
      throw new Error("Please enter a search query");
    }

    console.log("Searching for:", searchTerm);

    const { data, error } = await supabase
      .from('cv_metadata')
      .select('id, name, experience, location, skills')
      .ilike('name', `%${searchTerm}%`)
      .limit(10);

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    console.log("Raw data from Supabase:", data);
    return (data || []) as DatabaseResult[];
  };

  const { data: searchResults, refetch, isLoading } = useQuery({
    queryKey: ['candidates', searchTerm],
    queryFn: searchCandidates,
    enabled: false,
    retry: false,
  });

  const handleTalentSearch = async () => {
    if (!searchTerm) {
      toast({
        title: "Error",
        description: "Please enter a search query",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      await refetch();
      toast({
        title: "Success",
        description: "Search completed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to search for talent",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const formattedResults = searchResults?.map((result): Candidate => ({
    id: result.id,
    name: result.name || 'Unknown',
    role: 'Not specified',
    experience: result.experience ? `${result.experience} years` : 'Not specified',
    location: result.location || 'Not specified',
    skills: normalizeSkills(result.skills),
    availability: 'Not specified'
  })) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-aptiv/20 text-aptiv-gray-700 placeholder:text-aptiv-gray-400"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-aptiv-gray-400" />
        </div>

        <Button 
          onClick={handleTalentSearch}
          disabled={isLoading || isSearching}
          className="bg-aptiv hover:bg-aptiv/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-base py-6"
        >
          {(isLoading || isSearching) ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Searching...
            </>
          ) : (
            <>
              <Search className="h-5 w-5 mr-2" />
              Search Talent
            </>
          )}
        </Button>
      </div>

      {formattedResults.length > 0 && (
        <>
          <div className="text-aptiv-gray-700 mb-4">
            Found {formattedResults.length} candidates
          </div>
          <CandidateTable candidates={formattedResults} />
        </>
      )}
    </div>
  );
};
