const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { station, mode, ward, liveIaqi } = await req.json();
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let prompt = '';
    if (mode === 'ward') {
      const hour = new Date().getUTCHours() + 5; // IST offset
      const adjustedHour = hour >= 24 ? hour - 24 : hour;
      const timeOfDay = adjustedHour < 6 ? 'early morning' : adjustedHour < 12 ? 'morning' : adjustedHour < 17 ? 'afternoon' : adjustedHour < 20 ? 'evening' : 'night';

      const iaqiStr = liveIaqi ? `
Live Pollutant Data:
- PM2.5: ${liveIaqi.pm25?.v ?? 'N/A'} µg/m³
- PM10: ${liveIaqi.pm10?.v ?? 'N/A'} µg/m³
- NO2: ${liveIaqi.no2?.v ?? 'N/A'} ppb
- O3: ${liveIaqi.o3?.v ?? 'N/A'} ppb
- CO: ${liveIaqi.co?.v ?? 'N/A'} ppm
- SO2: ${liveIaqi.so2?.v ?? 'N/A'} ppb
- Temperature: ${liveIaqi.t?.v ?? 'N/A'}°C
- Humidity: ${liveIaqi.h?.v ?? 'N/A'}%
- Wind: ${liveIaqi.w?.v ?? 'N/A'} m/s` : 'No live pollutant breakdown available (using interpolated AQI only).';

      prompt = `You are an expert air quality analyst for Delhi, India. Analyze ward-level AQI data and provide intelligent, actionable insights.
Return ONLY valid JSON, no markdown or code fences.
Be specific about pollution sources based on ward location and time of day.
Use Indian context (autos, DTC buses, construction sites, crop burning, etc).

Ward: ${ward.ward_name}, Ward No: ${ward.ward_no}
Assembly Constituency: ${ward.ac_name}
Population: ${ward.total_pop?.toLocaleString()}
SC Population: ${ward.sc_pop?.toLocaleString()}
Current Time of Day: ${timeOfDay}
Interpolated AQI: ${ward.interpolated_aqi}
Nearest Station Distance: ${ward.nearest_station_dist}m
${iaqiStr}

Return this exact JSON structure:
{
  "summary": "2-3 sentence intelligent briefing mentioning ward name, time of day, AQI level, and likely causes",
  "health_risk": "LOW or MODERATE or HIGH or SEVERE or CRITICAL",
  "pollution_source": "main pollution source in 5-8 words",
  "source_icon": "single emoji representing the source",
  "confidence": 75,
  "trend": "RISING or STABLE or FALLING",
  "trend_reason": "why AQI is trending this way in 1 sentence",
  "vulnerable_impact": "1-2 sentences about impact on children, elderly, SC community in this ward",
  "key_concerns": ["concern1", "concern2", "concern3"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "admin_action": "1 specific action Delhi MCD/DPCC should take for this ward RIGHT NOW",
  "citizen_tip": "1 specific tip for residents of this ward right now",
  "local_insight": "Brief insight about likely pollution pattern based on ward location",
  "anomaly": false,
  "anomaly_detail": "",
  "pm25_status": "SAFE or ELEVATED or DANGEROUS"
}`;
    } else if (mode === 'station') {
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

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }), {
        status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    
    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'AI Gateway error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const text = data.choices?.[0]?.message?.content || '{}';
    const cleaned = text.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
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
