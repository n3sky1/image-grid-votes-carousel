
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
    const { p_concept_id } = await req.json()
    
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

    // Determine which counter to decrement based on the vote type
    const updateData: Record<string, number> = {}
    if (userVote?.vote_type === 'like') updateData.votes_up = -1
    if (userVote?.vote_type === 'dislike') updateData.votes_down = -1
    if (userVote?.vote_type === 'love') updateData.hearts = -1

    // Update the concept's vote counts
    const { error } = await supabaseClient
      .from('concepts')
      .update({
        votes_up: userVote?.vote_type === 'like' ? supabaseClient.rpc('decrement', { row: 'votes_up' }) : undefined,
        votes_down: userVote?.vote_type === 'dislike' ? supabaseClient.rpc('decrement', { row: 'votes_down' }) : undefined,
        hearts: userVote?.vote_type === 'love' ? supabaseClient.rpc('decrement', { row: 'hearts' }) : undefined,
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
