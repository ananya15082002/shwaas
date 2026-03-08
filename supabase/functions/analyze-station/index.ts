const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { station, mode } = await req.json();
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let prompt = '';
    if (mode === 'station') {
      prompt = `You are an air quality expert AI for Delhi, India. Analyze this monitoring station data and provide a concise, actionable intelligence briefing.

Station: ${station.name} (${station.area})
AQI: ${station.aqi}
Dominant Pollutant: ${station.dominantPollutant}
Individual Pollutants: ${JSON.stringify(station.iaqi)}
Time: ${station.time?.s || 'N/A'}

Provide your analysis in this JSON format:
{
  "summary": "2-3 sentence executive summary of current conditions",
  "health_risk": "LOW/MODERATE/HIGH/SEVERE/CRITICAL",
  "key_concerns": ["concern1", "concern2", "concern3"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "trend_analysis": "Brief analysis of what the pollutant levels suggest about sources"
}

Return ONLY valid JSON, no markdown.`;
    } else if (mode === 'city') {
      prompt = `You are an air quality expert AI. Analyze this city-wide data for Delhi and provide a comprehensive overview.

Stations data: ${JSON.stringify(station)}

Provide your analysis in this JSON format:
{
  "city_summary": "3-4 sentence overview of Delhi's current air quality",
  "worst_areas": ["area1", "area2"],
  "best_areas": ["area1", "area2"],
  "primary_pollutants": ["pollutant1", "pollutant2"],
  "health_advisory": "Comprehensive health advisory for Delhi residents",
  "outlook": "Short-term outlook based on current patterns"
}

Return ONLY valid JSON, no markdown.`;
    } else if (mode === 'compare') {
      prompt = `You are an air quality expert AI. Compare these Delhi monitoring stations and identify patterns.

Stations: ${JSON.stringify(station)}

Provide your analysis in this JSON format:
{
  "comparison_summary": "2-3 sentence comparison overview",
  "patterns": ["pattern1", "pattern2", "pattern3"],
  "hotspot_analysis": "Which areas are worst and why",
  "disparity_index": "How much variation exists across the city"
}

Return ONLY valid JSON, no markdown.`;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'Claude API error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const text = data.content?.[0]?.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
