
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { EmployerProfile } from "./types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const profileSchema = z.object({
  company_name: z.string().min(2, "Company name must be at least 2 characters"),
  registration_number: z.string().min(1, "Registration number is required"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  industry: z.string().min(1, "Industry is required"),
  sub_industry: z.string().min(1, "Sub-industry is required"),
  sub_sub_industry: z.string().min(1, "Sub-sub-industry is required"),
  contact_person: z.string().min(2, "Contact person name is required"),
  designation: z.string().min(2, "Designation is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Invalid phone number"),
  alternate_contact: z.object({
    name: z.string().optional(),
    designation: z.string().optional(),
    email: z.string().email("Invalid email address").optional(),
    phone: z.string().min(10, "Invalid phone number").optional(),
  }).optional(),
});

interface ProfileFormProps {
  profile: EmployerProfile | null;
  isEditing: boolean;
  onCancel: () => void;
}

export const ProfileForm = ({ profile, isEditing, onCancel }: ProfileFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile || {
      company_name: "",
      registration_number: "",
      country: "",
      state: "",
      industry: "",
      sub_industry: "",
      sub_sub_industry: "",
      contact_person: "",
      designation: "",
      email: "",
      phone: "",
      alternate_contact: {
        name: "",
        designation: "",
        email: "",
        phone: "",
      },
    },
  });

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    console.log("Form submission started", { values });
    
    try {
      const timestamp = new Date().toISOString();
      
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Error getting user:", userError);
        throw userError;
      }
      
      if (!user) {
        console.error("No user found");
        throw new Error("No authenticated user found");
      }

      console.log("Current user:", user.id);

      // Prepare the data object with all required fields
      const profileData = {
        company_name: values.company_name,
        registration_number: values.registration_number,
        country: values.country,
        state: values.state,
        industry: values.industry,
        sub_industry: values.sub_industry,
        sub_sub_industry: values.sub_sub_industry,
        contact_person: values.contact_person,
        designation: values.designation,
        email: values.email,
        phone: values.phone,
        alternate_contact: values.alternate_contact,
        user_id: user.id,
      };

      console.log("Prepared profile data:", profileData);

      if (profile?.id) {
        console.log("Updating existing profile:", profile.id);
        const { data: updateData, error: updateError } = await supabase
          .from('employer_profiles')
          .update({
            ...profileData,
            updated_at: timestamp,
          })
          .eq('id', profile.id);

        if (updateError) {
          console.error('Update error:', updateError);
          throw updateError;
        }
        console.log("Update successful:", updateData);
      } else {
        console.log("Creating new profile");
        const { data: insertData, error: insertError } = await supabase
          .from('employer_profiles')
          .insert({
            ...profileData,
            created_at: timestamp,
            updated_at: timestamp,
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }
        console.log("Insert successful:", insertData);
      }

      console.log("Invalidating queries");
      await queryClient.invalidateQueries({ queryKey: ['employerProfiles'] });

      toast({
        title: "Success",
        description: profile?.id ? "Profile updated successfully" : "Profile created successfully",
      });
      
      console.log("Form submission completed successfully");
      onCancel();
    } catch (error) {
      console.error('Detailed error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save profile. Please try again.",
      });
    }
  };

  if (!isEditing && !profile) {
    return (
      <div className="bg-white rounded-lg p-6 border border-aptiv/10 text-center">
        <p className="text-aptiv-gray-500">
          Click 'Edit Profile' to start creating your employer profile.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white rounded-lg p-6 border border-aptiv/10">
          <h2 className="text-lg font-semibold text-aptiv-gray-700 mb-6">
            Company Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="registration_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter registration number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sg">Singapore</SelectItem>
                      <SelectItem value="my">Malaysia</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State/Region</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="central">Central Region</SelectItem>
                      <SelectItem value="east">East Region</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-aptiv/10">
          <h2 className="text-lg font-semibold text-aptiv-gray-700 mb-6">
            Industry Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="tech">Technology</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sub_industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub-Industry</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sub-industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="hardware">Hardware</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sub_sub_industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub-Sub-Industry</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sub-sub-industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="web">Web Development</SelectItem>
                      <SelectItem value="mobile">Mobile Development</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-aptiv/10">
          <h2 className="text-lg font-semibold text-aptiv-gray-700 mb-6">
            Contact Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="contact_person"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Contact Person</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Designation</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter job title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={onCancel} type="button">
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
};
