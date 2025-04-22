
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const { p_tag_name, p_tshirt_asin } = await req.json()

  // Insert or update the tag vote
  const { data, error } = await supabase
    .from('tag_votes')
    .upsert({
      tag_name: p_tag_name,
      tshirt_asin: p_tshirt_asin,
      votes: 1
    }, {
      onConflict: 'tag_name,tshirt_asin',
      count: 'exact'
    })

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
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
})
