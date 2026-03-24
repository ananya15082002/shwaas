import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ---------- Delhi seasonal context ----------
function getDelhiContext(): string {
  const now = new Date();
  const month = now.getUTCMonth();
  const hour = (now.getUTCHours() + 5) % 24;
  const day = now.getUTCDate();

  let season = "summer";
  if (month >= 10 || month <= 1) season = "winter";
  else if (month >= 6 && month <= 8) season = "monsoon";
  else if (month >= 2 && month <= 4) season = "spring";
  else if (month === 5) season = "pre-monsoon";
  else if (month === 9) season = "post-monsoon";

  let timeOfDay = "night";
  if (hour >= 5 && hour < 8) timeOfDay = "early morning";
  else if (hour >= 8 && hour < 12) timeOfDay = "morning";
  else if (hour >= 12 && hour < 16) timeOfDay = "afternoon";
  else if (hour >= 16 && hour < 19) timeOfDay = "evening";
  else if (hour >= 19 && hour < 22) timeOfDay = "late evening";

  let festivalContext = "";
  if (month === 9 && day >= 15) festivalContext = "Dussehra period - Ravana effigy burning increases PM.";
  if (month === 10 && day <= 15) festivalContext = "Diwali season - firecracker pollution expected.";
  if (month === 10 && day >= 20) festivalContext = "Post-Diwali haze - stubble burning peaks.";
  if (month === 0) festivalContext = "Lohri/Makar Sankranti bonfires may increase PM.";
  if (month === 2 && day >= 15) festivalContext = "Holi - Holika Dahan emissions.";

  let cropBurning = "";
  if (month === 9 || month === 10) cropBurning = "CRITICAL: Paddy stubble burning from Punjab/Haryana/UP.";
  if (month === 3 || month === 4) cropBurning = "Wheat stubble burning possible.";

  let weatherPattern = "";
  if (season === "winter") weatherPattern = "Temperature inversion trapping pollutants. Low winds. Fog/smog.";
  if (season === "monsoon") weatherPattern = "Rain washout reducing PM. High humidity affects O3.";
  if (season === "summer") weatherPattern = "High temps increasing O3. Dust storms possible from Rajasthan.";
  if (season === "post-monsoon") weatherPattern = "Temps dropping, inversion layers forming.";

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `Time: ${timeOfDay} (${hour}:00 IST), ${months[month]}, Season: ${season}. ${festivalContext} ${cropBurning} ${weatherPattern}`.trim();
}

// ---------- Cache helpers ----------
function makeCacheKey(mode: string, ward: any, station: any, lang: string): string {
  const hour = Math.floor(Date.now() / (1000 * 60 * 30)); // 30-min buckets
  if (mode === 'ward' && ward) return `ward_${ward.ward_no}_${hour}_${lang}`;
  if (mode === 'station' && station) return `station_${station.stationId || station.name}_${hour}_${lang}`;
  if (mode === 'city') return `city_${hour}_${lang}`;
  if (mode === 'compare') return `compare_${hour}_${lang}`;
  return `unknown_${hour}_${lang}`;
}

async function getFromCache(supabaseAdmin: any, cacheKey: string) {
  const { data } = await supabaseAdmin
    .from('ai_analysis_cache')
    .select('analysis, expires_at')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  return data?.analysis ?? null;
}

async function saveToCache(supabaseAdmin: any, cacheKey: string, mode: string, ward: any, aqi: number, analysis: any) {
  await supabaseAdmin
    .from('ai_analysis_cache')
    .upsert({
      cache_key: cacheKey,
      mode,
      ward_no: ward?.ward_no ?? null,
      ward_name: ward?.ward_name ?? null,
      aqi_value: aqi,
      analysis,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }, { onConflict: 'cache_key' });
}

// ---------- Prompt builders ----------
function buildWardPrompt(ward: any, liveIaqi: any, delhiContext: string, langInstruction: string): string {
  const iaqiStr = liveIaqi ? `PM2.5:${liveIaqi.pm25?.v??'N/A'}, PM10:${liveIaqi.pm10?.v??'N/A'}, NO2:${liveIaqi.no2?.v??'N/A'}, O3:${liveIaqi.o3?.v??'N/A'}, CO:${liveIaqi.co?.v??'N/A'}, SO2:${liveIaqi.so2?.v??'N/A'}, Temp:${liveIaqi.t?.v??'N/A'}°C, Humidity:${liveIaqi.h?.v??'N/A'}%, Wind:${liveIaqi.w?.v??'N/A'}m/s` : 'No live data.';

  return `You are an ML-trained Delhi air quality prediction engine. Return ONLY valid JSON, no markdown.${langInstruction}

Context: ${delhiContext}
Ward: ${ward.ward_name} (No.${ward.ward_no}), AC: ${ward.ac_name}, Pop: ${ward.total_pop?.toLocaleString()}, AQI: ${ward.interpolated_aqi}, Nearest Station: ${ward.nearest_station_dist}m
Live: ${iaqiStr}

Delhi pollution hotspots: Industrial(Okhla,Wazirpur,Naraina,Bawana), Landfills(Ghazipur,Bhalswa,Okhla), Traffic(ITO,Ashram,Anand Vihar)

Return JSON:
{"summary":"3-4 sentences with seasonal context","health_risk":"LOW|MODERATE|HIGH|SEVERE|CRITICAL","pollution_source":"specific 5-10 words","source_type":"vehicular|industrial|stubble_burning|construction|waste_burning|dust|weather_inversion|mixed","source_icon":"emoji","confidence":75,"trend":"RISING|STABLE|FALLING","trend_reason":"why","vulnerable_impact":"1-2 sentences","key_concerns":["c1","c2","c3"],"recommendations":["r1","r2","r3"],"admin_action":"1 specific action","citizen_tip":"1 tip for right now","local_insight":"ward-specific insight","seasonal_factor":"seasonal effect","anomaly":false,"anomaly_detail":"","pm25_status":"SAFE|ELEVATED|DANGEROUS","predicted_next_hours":"4-6hr forecast"}`;
}

function buildStationPrompt(station: any, delhiContext: string, langInstruction: string): string {
  return `Delhi air quality expert. Return ONLY valid JSON.${langInstruction}
Context: ${delhiContext}
Station: ${station.name} (${station.area}), AQI: ${station.aqi}, Dominant: ${station.dominantPollutant}, Pollutants: ${JSON.stringify(station.iaqi)}
Return JSON: {"summary":"2-3 sentences","health_risk":"LOW|MODERATE|HIGH|SEVERE|CRITICAL","key_concerns":["c1","c2","c3"],"recommendations":["r1","r2","r3"],"trend_analysis":"brief","source_type":"vehicular|industrial|stubble_burning|construction|waste_burning|dust|weather_inversion|mixed","source_icon":"emoji"}`;
}

function buildCityPrompt(station: any, delhiContext: string, langInstruction: string): string {
  return `Delhi city-wide air quality expert. Return ONLY valid JSON.${langInstruction}
Context: ${delhiContext}
Stations: ${JSON.stringify(station).slice(0, 3000)}
Return JSON: {"city_summary":"3-4 sentences","worst_areas":["a1","a2"],"best_areas":["a1","a2"],"primary_pollutants":["p1","p2"],"health_advisory":"comprehensive","outlook":"short-term","dominant_source_type":"main source","dominant_source_icon":"emoji"}`;
}

function buildComparePrompt(station: any, delhiContext: string, langInstruction: string): string {
  return `Delhi station comparison expert. Return ONLY valid JSON.${langInstruction}
Context: ${delhiContext}
Stations: ${JSON.stringify(station).slice(0, 3000)}
Return JSON: {"comparison_summary":"2-3 sentences","patterns":["p1","p2","p3"],"hotspot_analysis":"worst areas and why","disparity_index":"variation level"}`;
}

// ---------- AI call with multi-provider fallback ----------
async function callAI(prompt: string): Promise<string> {
  // Try Lovable AI first
  const lovableKey = Deno.env.get('LOVABLE_API_KEY');
  if (lovableKey) {
    try {
      const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${lovableKey}` },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite',
          messages: [
            { role: 'system', content: 'You are a Delhi air quality ML engine. Return valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content || '{}';
      }
      if (res.status !== 402 && res.status !== 429) {
        const t = await res.text();
        console.error('Lovable AI error:', res.status, t);
      } else {
        console.info(`Lovable AI ${res.status}, falling back...`);
      }
    } catch (e) {
      console.error('Lovable AI fetch error:', e);
    }
  }

  // Try Groq
  const groqKey = Deno.env.get('GROQ_API_KEY');
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content || '{}';
      }
      console.error('Groq error:', res.status, await res.text());
    } catch (e) {
      console.error('Groq fetch error:', e);
    }
  }

  // Try Gemini direct
  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  if (geminiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      }
      console.error('Gemini error:', res.status, await res.text());
    } catch (e) {
      console.error('Gemini fetch error:', e);
    }
  }

  throw new Error('All AI providers failed');
}

// ---------- Main handler ----------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { station, mode, ward, liveIaqi, language } = await req.json();
    const lang = language === 'hi' ? 'hi' : 'en';
    const langInstruction = lang === 'hi'
      ? '\nIMPORTANT: Respond ENTIRELY in Hindi (Devanagari). All JSON values in Hindi.'
      : '';

    // Init Supabase admin for cache
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const cacheKey = makeCacheKey(mode, ward, station, lang);
    const cached = await getFromCache(supabaseAdmin, cacheKey);
    if (cached) {
      console.info(`Cache HIT: ${cacheKey}`);
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    console.info(`Cache MISS: ${cacheKey}`);

    // Build prompt
    const delhiContext = getDelhiContext();
    let prompt = '';
    if (mode === 'ward') prompt = buildWardPrompt(ward, liveIaqi, delhiContext, langInstruction);
    else if (mode === 'station') prompt = buildStationPrompt(station, delhiContext, langInstruction);
    else if (mode === 'city') prompt = buildCityPrompt(station, delhiContext, langInstruction);
    else if (mode === 'compare') prompt = buildComparePrompt(station, delhiContext, langInstruction);

    // Call AI with multi-provider fallback
    const text = await callAI(prompt);
    const cleaned = text.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

    let parsed;
    try { parsed = JSON.parse(cleaned); } catch { parsed = { raw: text }; }

    // Save to cache (don't await - fire and forget)
    const aqi = ward?.interpolated_aqi ?? station?.aqi ?? 0;
    saveToCache(supabaseAdmin, cacheKey, mode, ward, aqi, parsed).catch(e => console.error('Cache save error:', e));

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('analyze-station error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
