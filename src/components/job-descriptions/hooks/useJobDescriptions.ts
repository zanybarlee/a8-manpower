
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { JobDescription } from "../types";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export const useJobDescriptions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  // Get the current user's ID when the component mounts
  useEffect(() => {
    const fetchUserId = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching user session:', error);
        return;
      }
      
      if (data.session) {
        setUserId(data.session.user.id);
      }
    };
    
    fetchUserId();
  }, []);

  const { data: jobDescriptions = [], isLoading, isError } = useQuery({
    queryKey: ['jobDescriptions', userId],
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      const { data, error } = await supabase
        .from('job_descriptions')
        .select(`
          *,
          employer_profiles:employer_profile_id (
            company_name,
            contact_person,
            email,
            phone
          )
        `)
        .eq('user_id', userId) // Filter by the current user's ID
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched job descriptions for user:', userId, data); // Debug log
      
      // Transform the data to match the JobDescription type
      const transformedData: JobDescription[] = data.map((item: any) => ({
        ...item,
        // Ensure required fields from JobDescription interface are present
        employer_profile_id: item.employer_profile_id,
        agent_id: item.agent_id
      }));
      
      return transformedData;
    },
    enabled: !!userId, // Only run the query when we have a userId
  });

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job description?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('job_descriptions')
        .delete()
        .eq('id', jobId);

      if (error) {
        console.error('Delete error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete job description",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Job description deleted successfully",
      });

      await queryClient.invalidateQueries({ queryKey: ['jobDescriptions'] });
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete job description",
      });
      return false;
    }
  };

  const handleUpdate = async (jobDescription: JobDescription) => {
    console.log('Updating job description:', jobDescription); // Debug log
    try {
      const updateData = {
        job_title: jobDescription.job_title,
        company_name: jobDescription.company_name,
        location: jobDescription.location,
        original_text: jobDescription.original_text,
        job_requirements: jobDescription.job_requirements,
        benefits: jobDescription.benefits,
      };
      console.log('Update data:', updateData); // Debug log

      const { data, error } = await supabase
        .from('job_descriptions')
        .update(updateData)
        .eq('id', jobDescription.id)
        .select();

      console.log('Update response:', { data, error }); // Debug log

      if (error) {
        console.error('Update error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update job description",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Job description updated successfully",
      });

      await queryClient.invalidateQueries({ queryKey: ['jobDescriptions'] });
      return true;
    } catch (error) {
      console.error('Update error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update job description",
      });
      return false;
    }
  };

  return {
    jobDescriptions,
    isLoading,
    isError,
    handleDelete,
    handleUpdate,
  };
};
