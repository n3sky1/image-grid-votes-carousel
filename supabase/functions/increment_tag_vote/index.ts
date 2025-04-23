
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { p_tag_name, p_tshirt_asin } = await req.json()

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert or update the tag vote
    const { data, error } = await supabase
      .from('tag_votes')
      .upsert({
        tag_name: p_tag_name,
        tshirt_asin: p_tshirt_asin,
        votes: 1
      }, {
        onConflict: 'tag_name,tshirt_asin'
      })

    if (error) {
      console.error('Error upserting tag vote:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // If upsert was successful, now use RPC call with schema specified
    const { data: updateData, error: updateError } = await supabase.rpc(
      'increment_tag_vote_count',
      { p_tag_name, p_tshirt_asin },
      { schema: 'public' } // Explicitly specify the schema to fix mutable search path
    );

    if (updateError) {
      console.error('Error incrementing vote count:', updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Unexpected error occurred' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
