import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoMapping {
  driveId: string;
  youtubeUrl: string;
}

interface MigrationResult {
  success: boolean;
  totalMappings: number;
  successfulUpdates: number;
  failedUpdates: number;
  notFoundDriveIds: string[];
  updatedSections: Array<{
    id: string;
    driveId: string;
    oldUrl: string;
    newUrl: string;
  }>;
  errors: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting video migration process...');

    // Authenticate using API key
    const authHeader = req.headers.get('Authorization');
    const adminApiKey = Deno.env.get('ADMIN_API_KEY');

    if (!authHeader || authHeader !== `Bearer ${adminApiKey}`) {
      console.error('Unauthorized: Invalid or missing API key');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body to get video mappings
    const { mappings } = await req.json() as { mappings: VideoMapping[] };

    if (!mappings || !Array.isArray(mappings) || mappings.length === 0) {
      throw new Error('No video mappings provided');
    }

    console.log(`Processing ${mappings.length} video mappings...`);

    const result: MigrationResult = {
      success: true,
      totalMappings: mappings.length,
      successfulUpdates: 0,
      failedUpdates: 0,
      notFoundDriveIds: [],
      updatedSections: [],
      errors: [],
    };

    // Process each mapping
    for (const mapping of mappings) {
      try {
        const { driveId, youtubeUrl } = mapping;
        
        if (!driveId || !youtubeUrl) {
          result.errors.push(`Invalid mapping: ${JSON.stringify(mapping)}`);
          result.failedUpdates++;
          continue;
        }

        console.log(`Processing Drive ID: ${driveId} -> ${youtubeUrl}`);

        // Find all task sections with this Drive ID
        const { data: sections, error: fetchError } = await supabase
          .from('discipline_task_sections')
          .select('id, data')
          .eq('section_type', 'video')
          .like('data->>video_url', `%${driveId}%`);

        if (fetchError) {
          console.error(`Error fetching sections for Drive ID ${driveId}:`, fetchError);
          result.errors.push(`Error fetching sections for Drive ID ${driveId}: ${fetchError.message}`);
          result.failedUpdates++;
          continue;
        }

        if (!sections || sections.length === 0) {
          console.warn(`No sections found for Drive ID: ${driveId}`);
          result.notFoundDriveIds.push(driveId);
          result.failedUpdates++;
          continue;
        }

        // Update each section
        for (const section of sections) {
          const currentData = section.data as Record<string, any>;
          const oldUrl = currentData.video_url;

          // Update the video_url while preserving other fields
          const updatedData = {
            ...currentData,
            video_url: youtubeUrl,
          };

          const { error: updateError } = await supabase
            .from('discipline_task_sections')
            .update({ data: updatedData })
            .eq('id', section.id);

          if (updateError) {
            console.error(`Error updating section ${section.id}:`, updateError);
            result.errors.push(`Error updating section ${section.id}: ${updateError.message}`);
            result.failedUpdates++;
          } else {
            console.log(`Successfully updated section ${section.id}`);
            result.successfulUpdates++;
            result.updatedSections.push({
              id: section.id,
              driveId,
              oldUrl,
              newUrl: youtubeUrl,
            });
          }
        }
      } catch (error) {
        console.error(`Error processing mapping ${mapping.driveId}:`, error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`Error processing ${mapping.driveId}: ${errorMsg}`);
        result.failedUpdates++;
      }
    }

    result.success = result.failedUpdates === 0;

    console.log('Migration completed:', {
      total: result.totalMappings,
      successful: result.successfulUpdates,
      failed: result.failedUpdates,
    });

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Migration error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMsg,
        totalMappings: 0,
        successfulUpdates: 0,
        failedUpdates: 0,
        notFoundDriveIds: [],
        updatedSections: [],
        errors: [errorMsg],
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
