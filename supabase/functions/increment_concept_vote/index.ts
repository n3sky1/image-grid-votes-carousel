
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { p_concept_id, p_vote_type } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Update the appropriate counter based on vote type
    const updateData: Record<string, number> = {}
    if (p_vote_type === 'like') updateData.votes_up = 1
    if (p_vote_type === 'dislike') updateData.votes_down = 1
    if (p_vote_type === 'love') updateData.hearts = 1

    // Get the current vote counts first
    const { data: currentConcept, error: fetchError } = await supabaseClient
      .from('concepts')
      .select('votes_up, votes_down, hearts')
      .eq('concept_id', p_concept_id)
      .single()

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Increment the appropriate counter
    const { error } = await supabaseClient
      .from('concepts')
      .update({
        votes_up: p_vote_type === 'like' ? (currentConcept.votes_up || 0) + 1 : currentConcept.votes_up,
        votes_down: p_vote_type === 'dislike' ? (currentConcept.votes_down || 0) + 1 : currentConcept.votes_down,
        hearts: p_vote_type === 'love' ? (currentConcept.hearts || 0) + 1 : currentConcept.hearts,
      })
      .eq('concept_id', p_concept_id)

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
