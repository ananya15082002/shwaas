import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
  if (month === 2 && day >= 15) festivalContext = "Holi period emissions possible.";

  let cropBurning = "";
  if (month === 9 || month === 10) cropBurning = "CRITICAL: Paddy stubble burning from Punjab/Haryana/UP.";
  if (month === 3 || month === 4) cropBurning = "Wheat stubble burning possible.";

  let weatherPattern = "";
  if (season === "winter") weatherPattern = "Temperature inversion trapping pollutants. Low winds. Fog/smog.";
  if (season === "monsoon") weatherPattern = "Rain washout reducing PM. High humidity affects O3.";
  if (season === "summer") weatherPattern = "High temps increasing O3. Dust storms possible from Rajasthan.";
  if (season === "post-monsoon") weatherPattern = "Temps dropping, inversion layers forming.";

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `Time: ${timeOfDay} (${hour}:00 IST), ${months[month]}, Season: ${season}. ${festivalContext} ${cropBurning} ${weatherPattern}`.trim();
}

function makeCacheKey(mode: string, ward: any, station: any, lang: string): string {
  const windowBucket = Math.floor(Date.now() / (1000 * 60 * 30));
  if (mode === "ward" && ward) return `ward_${ward.ward_no}_${windowBucket}_${lang}`;
  if (mode === "station" && station) return `station_${station.stationId || station.name}_${windowBucket}_${lang}`;
  if (mode === "city") return `city_${windowBucket}_${lang}`;
  if (mode === "compare") return `compare_${windowBucket}_${lang}`;
  return `unknown_${windowBucket}_${lang}`;
}

async function getFromCache(supabaseAdmin: any, cacheKey: string) {
  const { data } = await supabaseAdmin
    .from("ai_analysis_cache")
    .select("analysis, expires_at")
    .eq("cache_key", cacheKey)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  return data?.analysis ?? null;
}

async function saveToCache(supabaseAdmin: any, cacheKey: string, mode: string, ward: any, aqi: number, analysis: any) {
  await supabaseAdmin.from("ai_analysis_cache").upsert(
    {
      cache_key: cacheKey,
      mode,
      ward_no: ward?.ward_no ?? null,
      ward_name: ward?.ward_name ?? null,
      aqi_value: aqi,
      analysis,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    },
    { onConflict: "cache_key" },
  );
}

function buildWardPrompt(ward: any, liveIaqi: any, delhiContext: string, langInstruction: string): string {
  const iaqiStr = liveIaqi
    ? `PM2.5:${liveIaqi.pm25?.v ?? "N/A"}, PM10:${liveIaqi.pm10?.v ?? "N/A"}, NO2:${liveIaqi.no2?.v ?? "N/A"}, O3:${liveIaqi.o3?.v ?? "N/A"}, CO:${liveIaqi.co?.v ?? "N/A"}, SO2:${liveIaqi.so2?.v ?? "N/A"}, Temp:${liveIaqi.t?.v ?? "N/A"}°C, Humidity:${liveIaqi.h?.v ?? "N/A"}%, Wind:${liveIaqi.w?.v ?? "N/A"}m/s`
    : "No live data.";

  const visualKeys = `Allowed visual_key values (choose the single most fitting per card):
transport citizen: metro | carpool | wfh | cycling | ev_vehicle
transport govt: odd_even | truck_ban
construction: construction_shroud | water_spray | smog_gun | dust_netting
govt policy: factory_shutdown | school_closure | emergency_alert
trees: tree_peepal | tree_neem | tree_arjun | tree_ashoka
health: n95_mask | air_purifier | stay_indoors`;

  return `You are an ML-trained Delhi air quality prediction engine. Return ONLY valid JSON, no markdown.${langInstruction}
Context: ${delhiContext}
Ward: ${ward?.ward_name ?? "Unknown"} (No.${ward?.ward_no ?? "N/A"}), AC: ${ward?.ac_name ?? "N/A"}, Pop: ${ward?.total_pop?.toLocaleString?.() ?? "N/A"}, AQI: ${ward?.interpolated_aqi ?? "N/A"}, Nearest Station: ${ward?.nearest_station_dist ?? "N/A"}m
Live: ${iaqiStr}
Delhi hotspots: Industrial(Okhla,Wazirpur,Naraina,Bawana), Landfills(Ghazipur,Bhalswa,Okhla), Traffic(ITO,Ashram,Anand Vihar)
${visualKeys}
Advisory card generation rules:
1. Analyze the live pollutant values to identify the dominant source RIGHT NOW (high NO2+CO at rush hour = vehicular; high PM10 = construction/dust; high SO2 = industrial; low wind + high all = inversion)
2. Generate 5-7 cards that DIRECTLY address what the live data is showing — be specific (mention the pollutant value or time context in desc)
3. Mix: 2-3 citizen cards + 2-3 govt cards + 1 tree card always
4. Each card picks ONE visual_key from the allowed list above
5. title: max 4 words. desc: 1 sentence, actionable, situation-specific
6. target must be exactly "citizen" or "govt"
7. If Hindi lang: title and desc in Devanagari Hindi
Return JSON:
{"summary":"3-4 sentences with seasonal context","health_risk":"LOW|MODERATE|HIGH|SEVERE|CRITICAL","pollution_source":"specific 5-10 words","source_type":"vehicular|industrial|stubble_burning|construction|waste_burning|dust|weather_inversion|mixed","source_icon":"emoji","confidence":75,"trend":"RISING|STABLE|FALLING","trend_reason":"why","vulnerable_impact":"1-2 sentences","key_concerns":["c1","c2","c3"],"recommendations":["r1","r2","r3"],"admin_action":"1 specific action","citizen_tip":"1 tip for right now","local_insight":"ward-specific insight","seasonal_factor":"seasonal effect","anomaly":false,"anomaly_detail":"","pm25_status":"SAFE|ELEVATED|DANGEROUS","predicted_next_hours":"4-6hr forecast","advisory_cards":[{"visual_key":"metro","title":"Take Metro Today","desc":"NO2 at 68ppb — vehicular rush is the cause. Skip your car, take metro.","target":"citizen","category":"transport"}]}`;
}

function buildStationPrompt(station: any, delhiContext: string, langInstruction: string): string {
  return `Delhi air quality expert. Return ONLY valid JSON.${langInstruction}
Context: ${delhiContext}
Station: ${station?.name ?? "Unknown"} (${station?.area ?? "N/A"}), AQI: ${station?.aqi ?? "N/A"}, Dominant: ${station?.dominantPollutant ?? "N/A"}, Pollutants: ${JSON.stringify(station?.iaqi ?? {})}
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

function extractJsonFromText(text: string): any | null {
  const cleaned = text.replace(/^```json?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // continue
  }

  const start = cleaned.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let objectStart = -1;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === "{") {
      if (depth === 0) objectStart = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && objectStart !== -1) {
        const candidate = cleaned.slice(objectStart, i + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          // continue scan
        }
      }
    }
  }

  return null;
}

function classifyRisk(aqi: number) {
  if (aqi <= 50) return { risk: "LOW", trend: "STABLE", pm25Status: "SAFE" };
  if (aqi <= 100) return { risk: "MODERATE", trend: "STABLE", pm25Status: "ELEVATED" };
  if (aqi <= 200) return { risk: "HIGH", trend: "RISING", pm25Status: "ELEVATED" };
  if (aqi <= 300) return { risk: "SEVERE", trend: "RISING", pm25Status: "DANGEROUS" };
  return { risk: "CRITICAL", trend: "RISING", pm25Status: "DANGEROUS" };
}

function inferSource(liveIaqi: any) {
  const pm25 = liveIaqi?.pm25?.v ?? 0;
  const no2 = liveIaqi?.no2?.v ?? 0;
  const so2 = liveIaqi?.so2?.v ?? 0;
  const o3 = liveIaqi?.o3?.v ?? 0;

  if (no2 > pm25 * 0.25 && no2 > 25) return { type: "vehicular", icon: "🚗", source: "Vehicular traffic emissions" };
  if (so2 > 20) return { type: "industrial", icon: "🏭", source: "Industrial fuel combustion" };
  if (o3 > 50) return { type: "weather_inversion", icon: "☀️", source: "Sunlight-driven ozone formation" };
  if (pm25 > 150) return { type: "mixed", icon: "🌫️", source: "Regional smoke + dust mix" };
  return { type: "dust", icon: "💨", source: "Road and construction dust" };
}

function buildFallbackAdvisoryCards(sourceType: string, aqi: number, lang: string) {
  const hi = lang === "hi";
  const cards: any[] = [];

  if (sourceType === "vehicular" || aqi > 150) {
    cards.push(
      { visual_key: "metro", title: hi ? "मेट्रो लें" : "Take Metro", desc: hi ? "वाहन प्रदूषण अधिक है — आज मेट्रो या बस से जाएं" : "Vehicle emissions are high — use metro or DTC bus today", target: "citizen", category: "transport" },
      { visual_key: "carpool", title: hi ? "कारपूलिंग करें" : "Carpool Today", desc: hi ? "सहकर्मियों के साथ एक गाड़ी में जाएं, प्रदूषण घटाएं" : "Share a ride with colleagues to cut vehicle count on roads", target: "citizen", category: "transport" },
      { visual_key: "wfh", title: hi ? "घर से काम करें" : "Work From Home", desc: hi ? "आज ऑफिस आना-जाना टालें — WFH एक विकल्प है" : "Avoid the commute today if your work allows WFH", target: "citizen", category: "transport" },
      { visual_key: "odd_even", title: hi ? "ऑड-ईवन लागू करें" : "Odd-Even Scheme", desc: hi ? "प्रमुख सड़कों पर वाहन राशनिंग योजना सक्रिय करें" : "Activate odd-even vehicle rationing on major corridors today", target: "govt", category: "transport" },
    );
  }

  if (sourceType === "construction" || sourceType === "dust") {
    cards.push(
      { visual_key: "construction_shroud", title: hi ? "निर्माण ढकें" : "Shroud Construction", desc: hi ? "चीन जैसी तकनीक — सभी निर्माण स्थलों को जाली/कपड़े से ढकें" : "China-style technique — wrap all active construction sites in dust-suppression mesh", target: "govt", category: "construction" },
      { visual_key: "water_spray", title: hi ? "पानी छिड़कें" : "Deploy Water Spray", desc: hi ? "एंटी-स्मॉग गन से निर्माण स्थलों पर तुरंत पानी छिड़काव करें" : "Deploy anti-smog water sprinklers at all construction sites immediately", target: "govt", category: "construction" },
    );
  }

  if (aqi > 200) {
    cards.push(
      { visual_key: "truck_ban", title: hi ? "ट्रक प्रतिबंध" : "Ban Trucks", desc: hi ? "रात 10 बजे के बाद गैर-जरूरी ट्रकों का दिल्ली में प्रवेश बंद करें" : "Ban non-essential truck entry into Delhi after 10 PM tonight", target: "govt", category: "transport" },
    );
  }

  if (aqi > 300) {
    cards.push(
      { visual_key: "school_closure", title: hi ? "स्कूल बंद करें" : "Close Schools", desc: hi ? "AQI खतरनाक स्तर पर — सभी स्कूल तुरंत बंद करें" : "AQI at hazardous level — close all schools and outdoor venues immediately", target: "govt", category: "health" },
    );
  }

  // Always add tree cards
  cards.push(
    { visual_key: "tree_peepal", title: hi ? "पीपल लगाएं" : "Plant Peepal", desc: hi ? "दिल्ली का सबसे बड़ा CO₂ अवशोषक — कॉलोनी में लगाएं" : "Best CO₂ absorber for Delhi — plant in your colony or rooftop garden", target: "citizen", category: "trees" },
    { visual_key: "tree_neem", title: hi ? "नीम लगाएं" : "Plant Neem", desc: hi ? "प्राकृतिक वायु शोधक — धूल और PM कण कम करता है" : "Natural air purifier — absorbs dust particles and reduces PM levels", target: "citizen", category: "trees" },
  );

  return cards;
}

function buildHeuristicAnalysis(mode: string, ward: any, station: any, liveIaqi: any, lang: string) {
  const wardAqi = Number(ward?.interpolated_aqi ?? liveIaqi?.pm25?.v ?? 140);
  const stationAqi = Number(station?.aqi ?? wardAqi);
  const aqi = Number.isFinite(wardAqi) && mode === "ward" ? wardAqi : stationAqi;
  const { risk, trend, pm25Status } = classifyRisk(aqi);
  const source = inferSource(liveIaqi);

  if (mode === "ward") {
    if (lang === "hi") {
      return {
        summary: `${ward?.ward_name ?? "इस वार्ड"} में AQI ${aqi} है, वायु गुणवत्ता संवेदनशील लोगों के लिए हानिकारक हो सकती है।`,
        health_risk: risk,
        pollution_source: source.source,
        source_type: source.type,
        source_icon: source.icon,
        confidence: 68,
        trend,
        trend_reason: "मौजूदा समय और ट्रैफिक/मौसम पैटर्न के आधार पर अनुमान",
        vulnerable_impact: "बच्चों, बुजुर्गों और सांस के मरीजों को सावधानी रखनी चाहिए।",
        key_concerns: ["PM स्तर ऊँचा", "बाहर गतिविधि जोखिम", "संवेदनशील समूह प्रभावित"],
        recommendations: ["N95 मास्क पहनें", "सुबह/शाम बाहर कम जाएँ", "घर में वेंटिलेशन/प्यूरीफायर रखें"],
        admin_action: "मुख्य ट्रैफिक पॉइंट्स और धूल स्रोतों पर तत्काल नियंत्रण बढ़ाएँ",
        citizen_tip: "भीड़भाड़ समय में बाहरी गतिविधि कम रखें",
        local_insight: "वार्ड-स्तरीय AQI पैटर्न स्थिर/धीरे बढ़ता दिख रहा है",
        seasonal_factor: "मौसम और हवा की गति AQI को प्रभावित कर रही है",
        anomaly: false,
        anomaly_detail: "",
        pm25_status: pm25Status,
        predicted_next_hours: "अगले 4-6 घंटों में AQI समान या थोड़ा बढ़ सकता है",
        advisory_cards: buildFallbackAdvisoryCards(source.type, aqi, "hi"),
        _source: "heuristic_fallback",
      };
    }

    return {
      summary: `${ward?.ward_name ?? "This ward"} has AQI ${aqi}, indicating elevated air risk for sensitive groups.`,
      health_risk: risk,
      pollution_source: source.source,
      source_type: source.type,
      source_icon: source.icon,
      confidence: 68,
      trend,
      trend_reason: "Estimated from current AQI, time pattern and pollutant mix",
      vulnerable_impact: "Children, elderly, and respiratory patients may feel symptoms first.",
      key_concerns: ["Elevated particulate load", "Outdoor exposure risk", "Sensitive groups impact"],
      recommendations: ["Use N95 masks outdoors", "Avoid heavy activity during peak traffic hours", "Improve indoor air circulation/purification"],
      admin_action: "Increase local dust and traffic emission enforcement in hotspot corridors",
      citizen_tip: "Prefer short outdoor windows and avoid peak congestion hours",
      local_insight: "Ward-level AQI suggests mixed local + regional pollution influence",
      seasonal_factor: "Seasonal wind and temperature patterns are amplifying pollutant persistence",
      anomaly: false,
      anomaly_detail: "",
      pm25_status: pm25Status,
      predicted_next_hours: "AQI likely to remain stable to slightly worse in next 4-6 hours",
      advisory_cards: buildFallbackAdvisoryCards(source.type, aqi, "en"),
      _source: "heuristic_fallback",
    };
  }

  if (mode === "city") {
    return {
      city_summary: "City AQI pattern indicates widespread moderate-to-high exposure risk with local hotspots.",
      worst_areas: ["High-traffic corridors", "Industrial clusters"],
      best_areas: ["Peripheral green belts", "Lower-density sectors"],
      primary_pollutants: ["PM2.5", "PM10"],
      health_advisory: "Limit prolonged outdoor exposure for sensitive groups.",
      outlook: "Near-term AQI likely stable to slightly elevated.",
      dominant_source_type: source.type,
      dominant_source_icon: source.icon,
      _source: "heuristic_fallback",
    };
  }

  if (mode === "compare") {
    return {
      comparison_summary: "Station comparison shows clear hotspot disparity driven by traffic and local emissions.",
      patterns: ["Higher PM near dense corridors", "Better dispersion in lower-density pockets", "Evening deterioration trend"],
      hotspot_analysis: "Hotspots align with congestion and mixed emission activity.",
      disparity_index: "Moderate",
      _source: "heuristic_fallback",
    };
  }

  return {
    summary: `Station AQI is ${aqi}; risk is currently ${risk}.`,
    health_risk: risk,
    key_concerns: ["Particulate exposure", "Outdoor discomfort", "Sensitive user risk"],
    recommendations: ["Mask outdoors", "Reduce heavy activity", "Monitor AQI updates"],
    trend_analysis: "Short-term trend expected stable to slightly rising.",
    source_type: source.type,
    source_icon: source.icon,
    _source: "heuristic_fallback",
  };
}

async function callAI(prompt: string): Promise<string> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (lovableKey) {
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: "You are a Delhi air quality ML engine. Return valid JSON only." },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content || "{}";
      }

      if (res.status === 402 || res.status === 429) {
        console.info(`Lovable AI ${res.status}, falling back...`);
      } else {
        console.error("Lovable AI error:", res.status, await res.text());
      }
    } catch (e) {
      console.error("Lovable AI fetch error:", e);
    }
  }

  const groqKey = Deno.env.get("GROQ_API_KEY");
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content || "{}";
      }
      console.error("Groq error:", res.status, await res.text());
    } catch (e) {
      console.error("Groq fetch error:", e);
    }
  }

  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (geminiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      }
      console.error("Gemini error:", res.status, await res.text());
    } catch (e) {
      console.error("Gemini fetch error:", e);
    }
  }

  throw new Error("All AI providers failed");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let payload: any = null;

  try {
    payload = await req.json();
    const { station, mode, ward, liveIaqi, language } = payload;
    const lang = language === "hi" ? "hi" : "en";
    const langInstruction = lang === "hi" ? "\nIMPORTANT: Respond ENTIRELY in Hindi (Devanagari)." : "";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const cacheKey = makeCacheKey(mode, ward, station, lang);
    const cached = await getFromCache(supabaseAdmin, cacheKey);
    if (cached) {
      console.info(`Cache HIT: ${cacheKey}`);
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.info(`Cache MISS: ${cacheKey}`);

    const delhiContext = getDelhiContext();
    let prompt = "";
    if (mode === "ward") prompt = buildWardPrompt(ward, liveIaqi, delhiContext, langInstruction);
    else if (mode === "station") prompt = buildStationPrompt(station, delhiContext, langInstruction);
    else if (mode === "city") prompt = buildCityPrompt(station, delhiContext, langInstruction);
    else if (mode === "compare") prompt = buildComparePrompt(station, delhiContext, langInstruction);

    const text = await callAI(prompt);
    let parsed = extractJsonFromText(text);

    if (!parsed) {
      console.warn("Model did not return valid JSON, using heuristic fallback");
      parsed = buildHeuristicAnalysis(mode, ward, station, liveIaqi, lang);
    }

    const aqi = ward?.interpolated_aqi ?? station?.aqi ?? 0;
    saveToCache(supabaseAdmin, cacheKey, mode, ward, aqi, parsed).catch((e) =>
      console.error("Cache save error:", e),
    );

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-station error:", error);
    const mode = payload?.mode ?? "ward";
    const ward = payload?.ward ?? null;
    const station = payload?.station ?? null;
    const liveIaqi = payload?.liveIaqi ?? null;
    const lang = payload?.language === "hi" ? "hi" : "en";

    const fallback = buildHeuristicAnalysis(mode, ward, station, liveIaqi, lang);
    return new Response(JSON.stringify({ ...fallback, _source: "hard_fallback" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
