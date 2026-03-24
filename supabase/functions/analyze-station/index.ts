const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Delhi seasonal & contextual intelligence
function getDelhiContext(): string {
  const now = new Date();
  const month = now.getUTCMonth(); // 0-11
  const hour = (now.getUTCHours() + 5) % 24; // IST
  const day = now.getUTCDate();

  // Season
  let season = "summer";
  if (month >= 10 || month <= 1) season = "winter";
  else if (month >= 6 && month <= 8) season = "monsoon";
  else if (month >= 2 && month <= 4) season = "spring";
  else if (month === 5) season = "pre-monsoon";
  else if (month === 9) season = "post-monsoon";

  // Time of day
  let timeOfDay = "night";
  if (hour >= 5 && hour < 8) timeOfDay = "early morning";
  else if (hour >= 8 && hour < 12) timeOfDay = "morning";
  else if (hour >= 12 && hour < 16) timeOfDay = "afternoon";
  else if (hour >= 16 && hour < 19) timeOfDay = "evening";
  else if (hour >= 19 && hour < 22) timeOfDay = "late evening";

  // Festival/event context (approximate dates)
  let festivalContext = "";
  if (month === 9 && day >= 15) festivalContext = "Dussehra period - Ravana effigy burning increases PM levels.";
  if (month === 10 && day <= 15) festivalContext = "Diwali season - heavy firecracker pollution expected.";
  if (month === 10 && day >= 20) festivalContext = "Post-Diwali haze period - stubble burning from Punjab/Haryana peaks.";
  if (month === 0) festivalContext = "Lohri/Makar Sankranti bonfires may increase local PM.";
  if (month === 2 && day >= 15 && day <= 31) festivalContext = "Holi preparations - bonfire (Holika Dahan) emissions possible.";
  if (month === 11) festivalContext = "Christmas/New Year - mild celebratory emissions.";

  // Crop burning context
  let cropBurning = "";
  if (month === 9 || month === 10) cropBurning = "CRITICAL: Paddy stubble burning season in Punjab, Haryana, UP - major contributor to Delhi smog.";
  if (month === 3 || month === 4) cropBurning = "Wheat stubble burning possible in neighboring states.";

  // Weather patterns
  let weatherPattern = "";
  if (season === "winter") weatherPattern = "Temperature inversion likely trapping pollutants near ground. Low wind speeds expected. Fog/smog conditions probable.";
  if (season === "monsoon") weatherPattern = "Rain washout effect should reduce PM levels. High humidity may affect O3.";
  if (season === "summer") weatherPattern = "High temperatures may increase O3 formation. Dust storms possible from Rajasthan.";
  if (season === "post-monsoon") weatherPattern = "Transition period - temperatures dropping, inversion layers forming.";

  return `
CONTEXTUAL INTELLIGENCE (use this to improve analysis):
- Current IST Time: ${timeOfDay} (${hour}:00 IST)
- Month: ${['January','February','March','April','May','June','July','August','September','October','November','December'][month]}
- Season: ${season}
${festivalContext ? `- Festival Alert: ${festivalContext}` : ''}
${cropBurning ? `- Crop Burning: ${cropBurning}` : ''}
- Weather Pattern: ${weatherPattern}
- Known Delhi patterns: Early morning (5-8 AM) sees peak pollution from overnight inversion + morning traffic. Rush hours (8-10 AM, 5-8 PM) have elevated vehicular emissions. Afternoon (12-4 PM) usually has better dispersion. Construction activity peaks 9 AM - 5 PM.`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { station, mode, ward, liveIaqi, language } = await req.json();
    const lang = language === 'hi' ? 'hi' : 'en';
    const langInstruction = lang === 'hi'
      ? '\n\nIMPORTANT: Respond ENTIRELY in Hindi (Devanagari script). All text values in the JSON must be in Hindi.'
      : '';

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      // Fallback to GROQ if available
      const groqKey = Deno.env.get('GROQ_API_KEY');
      if (!groqKey) {
        return new Response(JSON.stringify({ error: 'No AI API key configured' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      // Use Groq as fallback
      return await handleWithGroq(groqKey, station, mode, ward, liveIaqi, langInstruction, lang);
    }

    const delhiContext = getDelhiContext();
    let prompt = '';

    if (mode === 'ward') {
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
- Wind: ${liveIaqi.w?.v ?? 'N/A'} m/s` : 'No live pollutant breakdown available.';

      prompt = `You are an ML-trained air quality prediction engine for Delhi, India. You analyze ward-level AQI with contextual intelligence including seasonal patterns, festival impacts, crop burning cycles, weather inversions, and time-of-day traffic patterns.
Return ONLY valid JSON, no markdown or code fences.${langInstruction}

${delhiContext}

Ward: ${ward.ward_name}, Ward No: ${ward.ward_no}
Assembly Constituency: ${ward.ac_name}
Population: ${ward.total_pop?.toLocaleString()}
SC Population: ${ward.sc_pop?.toLocaleString()}
Interpolated AQI: ${ward.interpolated_aqi}
Nearest Station Distance: ${ward.nearest_station_dist}m
${iaqiStr}

KNOWN POLLUTION SOURCES NEAR DELHI WARDS:
- Industrial: Okhla, Wazirpur, Naraina, Mayapuri, Bawana, Patparganj, GT Karnal Road, Lawrence Road, Jhilmil, Badli
- Landfills: Ghazipur (East), Bhalswa (North), Okhla (South)
- Traffic Hotspots: ITO, Ashram Chowk, Anand Vihar ISBT, Karol Bagh Ring Road
- Power: Badarpur (decommissioned), Rajghat
- Construction: Dwarka Expressway, Pragati Maidan redevelopment

Based on the ward location, time, season, and pollutant levels, determine the MOST LIKELY primary pollution source.

Return this exact JSON structure:
{
  "summary": "3-4 sentence intelligent briefing incorporating seasonal context, time patterns, and ward-specific analysis",
  "health_risk": "LOW or MODERATE or HIGH or SEVERE or CRITICAL",
  "pollution_source": "specific source in 5-10 words (e.g. 'Stubble burning smoke from Punjab')",
  "source_type": "vehicular or industrial or stubble_burning or construction or waste_burning or dust or weather_inversion or mixed",
  "source_icon": "single emoji representing the primary source",
  "confidence": 75,
  "trend": "RISING or STABLE or FALLING",
  "trend_reason": "why AQI is trending this way, using seasonal/time context",
  "vulnerable_impact": "1-2 sentences about impact on children, elderly, outdoor workers",
  "key_concerns": ["concern1", "concern2", "concern3"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "admin_action": "1 specific action MCD/DPCC should take RIGHT NOW",
  "citizen_tip": "1 specific tip for residents right now based on time of day",
  "local_insight": "Brief insight about pollution pattern based on ward location + season + time",
  "seasonal_factor": "How current season/month affects this ward's AQI",
  "anomaly": false,
  "anomaly_detail": "",
  "pm25_status": "SAFE or ELEVATED or DANGEROUS",
  "predicted_next_hours": "Will AQI likely improve or worsen in next 4-6 hours and why"
}`;
    } else if (mode === 'station') {
      prompt = `You are an ML-trained air quality expert for Delhi.${langInstruction}

${delhiContext}

Station: ${station.name} (${station.area})
AQI: ${station.aqi}
Dominant Pollutant: ${station.dominantPollutant}
Individual Pollutants: ${JSON.stringify(station.iaqi)}
Time: ${station.time?.s || 'N/A'}

Return ONLY valid JSON:
{
  "summary": "2-3 sentence executive summary with seasonal context",
  "health_risk": "LOW/MODERATE/HIGH/SEVERE/CRITICAL",
  "key_concerns": ["concern1", "concern2", "concern3"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "trend_analysis": "Brief analysis incorporating seasonal patterns",
  "source_type": "vehicular or industrial or stubble_burning or construction or waste_burning or dust or weather_inversion or mixed",
  "source_icon": "single emoji"
}`;
    } else if (mode === 'city') {
      prompt = `You are an ML-trained air quality expert. Analyze city-wide Delhi data.${langInstruction}

${delhiContext}

Stations data: ${JSON.stringify(station)}

Return ONLY valid JSON:
{
  "city_summary": "3-4 sentence overview with seasonal context",
  "worst_areas": ["area1", "area2"],
  "best_areas": ["area1", "area2"],
  "primary_pollutants": ["pollutant1", "pollutant2"],
  "health_advisory": "Comprehensive health advisory considering season",
  "outlook": "Short-term outlook based on current season and patterns",
  "dominant_source_type": "main source type for the city right now",
  "dominant_source_icon": "emoji"
}`;
    } else if (mode === 'compare') {
      prompt = `You are an ML-trained air quality expert. Compare Delhi monitoring stations.${langInstruction}

${delhiContext}

Stations: ${JSON.stringify(station)}

Return ONLY valid JSON:
{
  "comparison_summary": "2-3 sentence comparison with seasonal context",
  "patterns": ["pattern1", "pattern2", "pattern3"],
  "hotspot_analysis": "Which areas are worst and why (seasonal factors)",
  "disparity_index": "How much variation exists"
}`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a specialized ML-trained Delhi air quality prediction engine. Always return valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (response.status === 429) {
      // Try Groq fallback on rate limit
      const groqKey = Deno.env.get('GROQ_API_KEY');
      if (groqKey) {
        console.log('Lovable AI rate limited, falling back to Groq');
        return await handleWithGroq(groqKey, station, mode, ward, liveIaqi, langInstruction, lang);
      }
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (response.status === 402) {
      // Try Groq fallback on credits exhausted
      const groqKey = Deno.env.get('GROQ_API_KEY');
      if (groqKey) {
        console.log('Lovable AI credits exhausted, falling back to Groq');
        return await handleWithGroq(groqKey, station, mode, ward, liveIaqi, langInstruction, lang);
      }
      return new Response(JSON.stringify({ error: 'AI credits exhausted. Analysis temporarily unavailable.' }), {
        status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    
    if (!response.ok) {
      console.error('AI gateway error:', response.status, JSON.stringify(data));
      return new Response(JSON.stringify({ error: data.error?.message || 'AI analysis error' }), {
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

// Fallback to Groq API
async function handleWithGroq(apiKey: string, station: any, mode: string, ward: any, liveIaqi: any, langInstruction: string, lang: string) {
  const hour = new Date().getUTCHours() + 5;
  const adjustedHour = hour >= 24 ? hour - 24 : hour;
  const timeOfDay = adjustedHour < 6 ? 'early morning' : adjustedHour < 12 ? 'morning' : adjustedHour < 17 ? 'afternoon' : adjustedHour < 20 ? 'evening' : 'night';

  let prompt = '';
  if (mode === 'ward') {
    const iaqiStr = liveIaqi ? `Live: PM2.5:${liveIaqi.pm25?.v ?? 'N/A'}, PM10:${liveIaqi.pm10?.v ?? 'N/A'}, NO2:${liveIaqi.no2?.v ?? 'N/A'}` : '';
    prompt = `Air quality analysis for ward ${ward.ward_name} (AQI: ${ward.interpolated_aqi}). Time: ${timeOfDay}. ${iaqiStr}${langInstruction}
Return JSON: {"summary":"...","health_risk":"...","pollution_source":"...","source_type":"vehicular","source_icon":"🚗","confidence":75,"trend":"STABLE","trend_reason":"...","vulnerable_impact":"...","key_concerns":[],"recommendations":[],"admin_action":"...","citizen_tip":"...","local_insight":"...","seasonal_factor":"...","anomaly":false,"anomaly_detail":"","pm25_status":"ELEVATED","predicted_next_hours":"..."}`;
  } else {
    prompt = `Analyze ${mode} data: ${JSON.stringify(station).slice(0, 2000)}${langInstruction}. Return valid JSON only.`;
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 1024, temperature: 0.7 }),
  });

  if (response.status === 429) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const data = await response.json();
  if (!response.ok) {
    return new Response(JSON.stringify({ error: data.error?.message || 'API error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const text = data.choices?.[0]?.message?.content || '{}';
  const cleaned = text.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  let parsed;
  try { parsed = JSON.parse(cleaned); } catch { parsed = { raw: text }; }

  return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
