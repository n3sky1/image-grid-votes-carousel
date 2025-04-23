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

    // Get the current vote counts and user's vote type first
    const { data: userVote, error: voteError } = await supabaseClient
      .from('user_votes')
      .select('vote_type')
      .eq('concept_id', p_concept_id)
      .maybeSingle()

    if (voteError) {
      return new Response(JSON.stringify({ error: voteError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Get the current vote counts
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

    // Update based on the vote type that's being removed
    const newVoteCounts = {
      votes_up: currentConcept.votes_up,
      votes_down: currentConcept.votes_down,
      hearts: currentConcept.hearts
    }

    // If p_vote_type is provided, use it (for switching votes)
    // Otherwise use the userVote.vote_type (for removing votes)
    const voteTypeToDecrement = p_vote_type || (userVote?.vote_type);
    
    if (voteTypeToDecrement === 'like') {
      newVoteCounts.votes_up = Math.max(0, (currentConcept.votes_up || 0) - 1)
    } else if (voteTypeToDecrement === 'dislike') {
      newVoteCounts.votes_down = Math.max(0, (currentConcept.votes_down || 0) - 1)
    } else if (voteTypeToDecrement === 'love') {
      newVoteCounts.hearts = Math.max(0, (currentConcept.hearts || 0) - 1)
    }

    // Update the concept's vote counts
    const { error } = await supabaseClient
      .from('concepts')
      .update(newVoteCounts)
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
