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

  // Comprehensive festival calendar (approximate windows — dates shift yearly)
  const festivals: string[] = [];

  // January
  if (month === 0 && day <= 15) festivals.push("Lohri/Makar Sankranti — bonfires may increase PM locally.");
  if (month === 0 && day === 26) festivals.push("Republic Day — parade area traffic diversions, low vehicular pollution in central Delhi.");

  // February-March: Basant Panchami, Maha Shivratri, Holi
  if (month === 1 && day >= 1 && day <= 10) festivals.push("Basant Panchami season.");
  if (month === 1 && day >= 20 || (month === 2 && day <= 5)) festivals.push("Maha Shivratri — night temple gatherings, incense/dhoop increases local PM.");
  if (month === 2 && day >= 10 && day <= 20) festivals.push("Holi period — bonfire (Holika Dahan) and color powder can spike PM10 temporarily.");

  // March-April: Navratri (Chaitra), Ram Navami, Eid-ul-Fitr (shifts yearly)
  if (month === 2 && day >= 22 || (month === 3 && day <= 10)) festivals.push("Chaitra Navratri — yagna/havan smoke may increase localized PM.");
  if (month === 3 && day >= 1 && day <= 20) festivals.push("Ram Navami / possible Eid-ul-Fitr window — mixed traffic patterns, cooking emissions from gatherings.");

  // May-June: Eid-ul-Fitr / Eid-ul-Adha window (shifts yearly)
  if (month === 4 || month === 5) festivals.push("Possible Eid period — community cooking, traffic surges near mosques.");

  // July-August: Eid-ul-Adha, Raksha Bandhan, Independence Day, Janmashtami
  if (month === 6 && day >= 10) festivals.push("Possible Eid-ul-Adha — community gatherings, cooking emissions.");
  if (month === 7 && day <= 5) festivals.push("Possible Eid-ul-Adha window.");
  if (month === 7 && day >= 10 && day <= 20) festivals.push("Raksha Bandhan — increased market traffic and vehicle movement.");
  if (month === 7 && day === 15) festivals.push("Independence Day — Red Fort area traffic diversions.");
  if (month === 7 && day >= 22) festivals.push("Janmashtami — night celebrations, temple areas congested.");

  // September: Ganesh Chaturthi
  if (month === 8 && day >= 5 && day <= 20) festivals.push("Ganesh Chaturthi — idol immersion processions affect traffic corridors.");

  // September-October: Navratri (Sharad), Dussehra
  if (month === 8 && day >= 20 || (month === 9 && day <= 5)) festivals.push("Sharad Navratri — pandal activities, increased evening foot traffic and generator use.");
  if (month === 9 && day >= 5 && day <= 15) festivals.push("Dussehra — Ravana effigy burning spikes PM10/PM2.5 sharply for 1-2 days.");
  if (month === 9 && day >= 16 && day <= 25) festivals.push("Karwa Chauth / pre-Diwali shopping — heavy market traffic.");

  // October-November: Diwali, Chhath Puja, Guru Purab
  if (month === 9 && day >= 26 || (month === 10 && day <= 5)) festivals.push("Diwali season — firecracker pollution spikes PM2.5/PM10 to hazardous levels, SO2 also rises.");
  if (month === 10 && day >= 5 && day <= 12) festivals.push("Post-Diwali haze persists. Chhath Puja — riverside gatherings, biomass burning.");
  if (month === 10 && day >= 12 && day <= 20) festivals.push("Guru Nanak Jayanti — gurudwara area traffic and langar cooking emissions.");
  if (month === 10 && day >= 20) festivals.push("Post-Diwali + stubble burning convergence — worst air quality window of the year.");

  // December: Christmas, New Year
  if (month === 11 && day >= 20) festivals.push("Christmas/New Year — bonfire parties, increased nightlife traffic in central Delhi.");

  const festivalContext = festivals.length > 0 ? festivals.join(" ") : "No major festival impact currently.";

  let cropBurning = "";
  if (month === 9 || month === 10) cropBurning = "CRITICAL: Paddy stubble burning from Punjab/Haryana/UP — transboundary smoke.";
  if (month === 3 || month === 4) cropBurning = "Wheat stubble burning possible from neighboring states.";

  let weatherPattern = "";
  if (season === "winter") weatherPattern = "Temperature inversion trapping pollutants near surface. Low wind speed. Fog/smog likely. Cold temperatures (5-15°C) keep people indoors.";
  if (season === "monsoon") weatherPattern = "Rain washout actively reducing PM. High humidity (70-95%) suppresses dust but increases O3 formation. Waterlogging may slow traffic.";
  if (season === "summer") weatherPattern = "High temps (38-46°C) intensifying O3 photochemistry. Dust storms possible from Rajasthan/Thar. Heat island effect in urban core.";
  if (season === "spring") weatherPattern = "Moderate temps (22-35°C), transitional winds. Pollen season — allergenic particles add to PM10. Dust picking up.";
  if (season === "pre-monsoon") weatherPattern = "Peak heat (40-47°C), thunderstorm dust squalls, high O3. Occasional nor'westers bring temporary relief.";
  if (season === "post-monsoon") weatherPattern = "Temps dropping rapidly (18-28°C), calm winds, inversion layers forming — pollutant trapping begins.";

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `Time: ${timeOfDay} (${hour}:00 IST), Date: ${day} ${months[month]}, Season: ${season}. Festivals: ${festivalContext} ${cropBurning} Weather: ${weatherPattern}`.trim();
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

  const visualKeys = `Allowed visual_key values (ONE per card):
transport citizen: metro | carpool | wfh | cycling | ev_vehicle
transport govt: odd_even | truck_ban
construction: construction_shroud | water_spray | smog_gun | dust_netting
govt policy: factory_shutdown | school_closure | emergency_alert
trees: tree_peepal | tree_neem | tree_arjun | tree_ashoka
health: n95_mask | air_purifier | stay_indoors`;

  const wardAqi = ward?.interpolated_aqi ?? 0;
  const grapStage = wardAqi > 450 ? "GRAP-4 (Emergency — ALL restrictions active, schools closed, construction banned, BS3 petrol/BS4 diesel vehicles banned)" :
    wardAqi > 400 ? "GRAP-3 (Severe+ — private construction stopped, BS3 petrol banned, WFH mandated for 50% govt staff)" :
    wardAqi > 300 ? "GRAP-2 (Very Poor — diesel gensets banned, construction dust mandatory controls, intensified enforcement)" :
    wardAqi > 200 ? "GRAP-1 (Poor — mechanical sweeping mandatory, dust suppression on roads, enhanced public transport)" : "Below GRAP threshold";

  return `You are a Delhi ward-level air quality ML+policy intelligence engine. You combine real-time sensor data with a global evidence database and Delhi-specific policy history to give exact, ward-specific, actionable analysis. Return ONLY valid JSON, no markdown.${langInstruction}

CONTEXT: ${delhiContext}
WARD: ${ward?.ward_name ?? "Unknown"} (No.${ward?.ward_no ?? "N/A"}), AC: ${ward?.ac_name ?? "N/A"}, Pop: ${ward?.total_pop?.toLocaleString?.() ?? "N/A"}, AQI: ${wardAqi}, Station dist: ${ward?.nearest_station_dist ?? "N/A"}m
LIVE SENSORS: ${iaqiStr}
GRAP STATUS: ${grapStage}
DELHI HOTSPOT PROXIMITY: Industrial(Okhla,Wazirpur,Naraina,Bawana), Landfills(Ghazipur,Bhalswa,Okhla), Traffic(ITO,Ashram,Anand Vihar,NH-24,NH-8,NH-1)

GLOBAL SOLUTIONS DATABASE — evidence-based interventions from cities worldwide. Use to frame specific, constructive recommendations:
[TRANSPORT-1] Singapore ERP: Congestion pricing at specific road chokepoints during peak 7:30-9:30 AM & 5-8 PM. Result: 25% traffic drop on priced roads, 18% NO2 reduction. Recommend when: NO2>50ppb, high-density traffic ward, morning/evening hours.
[TRANSPORT-2] Seoul smog-day odd-even: Activated on AQI>150 winter days, paired with WFH for govt employees and free public transit. Result: 15% PM reduction on active days. Key enhancement: extending to two-wheelers amplifies impact significantly.
[TRANSPORT-3] London ULEZ: Zone-specific emission standards — heavy vehicles 24/7, private cars 7AM-midnight. Result: 46% roadside NO2 cut in Zone 1. Recommend for wards near commercial corridors with high vehicle density.
[TRANSPORT-4] Mexico City Hoy No Circula: Plate-digit rotation includes motorcycles, 7 days/week. Broader vehicle coverage increases emission reduction proportionally.
[TRANSPORT-5] Oslo peak pricing + free transit combo: Congestion charge on peak entry + zero-fare public transit on bad air days. Result: 19% fewer vehicles in core zone.
[CONSTRUCTION-1] Singapore construction protocol: No demolition/concrete after 10 PM in residential zones + GPS-logged water suppression per site. Result: 35% PM10 reduction at monitored sites. Recommend for wards with active large construction.
[CONSTRUCTION-2] CAQM smog gun rule: Anti-smog guns mandatory within 500m of construction sites >2000 sqm. Enforcement: Rs.50,000/day for non-compliance — already Delhi law, strengthen ward-level compliance.
[INDUSTRIAL-1] Multi-city emergency protocol: Targeted production controls at specific industrial clusters when AQI>200. Recommend for Okhla/Wazirpur/Bawana adjacent wards when SO2>25 or PM2.5>150.
[WASTE-1] Landfill fire suppression: Nitrogen blanket + covered leachate channels reduces fire-PM2.5 by 60%. Recommend for wards within 5km of Ghazipur/Bhalswa/Okhla landfills when overnight PM2.5 spikes (fires peak 11 PM-4 AM).
[DELHI-WIN-1] CM Rekha Gupta tandoor ban (Nov 2024): Coal/wood tandoors banned in commercial establishments. A strong Delhi-specific step targeting PAH combustion near dhaba clusters — recommend strengthening night-time compliance checks in this ward.
[DELHI-WIN-2] DPCC mechanical road sweeping (2022): Nightly vacuum sweepers reduced road dust PM10 by 40% on 22 major corridors. Recommend extending to this ward's secondary roads.
[DELHI-WIN-3] BS6 fuel transition: Sulfur in fuel dropped from 50ppm to 10ppm, cutting vehicular SO2 by 80%. Next step for this ward: BS3/BS4 vehicle scrappage drive.
[TREES] Neem: Best for roadside PM10 trapping + antimicrobial. Peepal: Highest CO2 absorption, produces O2 24hrs. Arjun: Highway noise+pollution barrier. Ashoka: Dense canopy for colony dividers.

GEOPOLITICAL CONTEXT (proportionate use):
- Russia-Ukraine conflict (2024-25): Europe's increased coal use raised global coal demand; marginally elevated India thermal power sector SO2/NOx. Mention ONLY if live SO2>20ppb.
- Middle East/Red Sea disruptions: Alternate shipping routes raised fuel consumption; negligible direct Delhi impact. Mention ONLY if context would otherwise be incomplete.
- Default: Focus on Delhi's dominant local sources — vehicular, dust, industry, stubble burning.

ODD-EVEN RECOMMENDATION RULE: Always recommend odd-even as a targeted, time-bound intervention to maximize effectiveness:
- SPECIFY which ward corridor (use ward + AC name to infer key road)
- SPECIFY peak hours: morning (8-10 AM) or evening (6-9 PM) based on current time — not all-day
- NOTE the season: winter inversion = higher impact; summer = lower impact due to atmospheric dispersion
- ENHANCE with: truck entry restrictions, WFH for govt staff, or free/extra buses for compound effect
- Frame as STRENGTHENING existing policy, not criticizing it: e.g. "Extend to peak hours on [road] and include two-wheelers for maximum coverage"
- Title: use specific framing like "Peak-Hour Corridor Rationing" or "Morning Rush Plate Rotation"

${visualKeys}

ANALYSIS RULES:
1. Read LIVE pollutant values precisely. Identify dominant pollutant, its value, and the exact real-world cause given time+season+ward geography.
2. summary: (a) temperature feel (b) dominant pollutant with exact number (c) specific cause NOW (d) health implication — 3-4 sentences, no fluff
3. pollution_source: hyper-specific, e.g. "Pre-dawn truck convoy on NH-24 border entry" not "vehicular"
4. advisory_cards: 5-7 cards. Each desc must mention actual sensor value or time context. No generic sentences.
5. Mix: 2-3 citizen + 2-3 govt + 1 tree. Each must map to a different problem (don't give 3 transport cards if source is industrial).
6. title: max 4 words. desc: 1 sentence, sharp, evidence-referenced where possible.
7. target: exactly "citizen" or "govt"
8. trend_reason: cite actual numbers (e.g. "PM2.5 at 142 + humidity 78% + wind 0.8m/s = accumulation trap")
9. predicted_next_hours: specific forecast using time-of-day + weather data
10. admin_action: ONE specific action the ward officer/MCD can do TODAY, not a generic policy

FINAL LANGUAGE CHECK BEFORE OUTPUT: Re-read every string you are about to write. If LANGUAGE=ENGLISH, replace any Devanagari/Hindi word with its English equivalent. If LANGUAGE=HINDI, replace any English word with Hindi. No mixing allowed.

Return JSON:
{"summary":"3-4 sentences","health_risk":"LOW|MODERATE|HIGH|SEVERE|CRITICAL","pollution_source":"specific 5-15 words","source_type":"vehicular|industrial|stubble_burning|construction|waste_burning|dust|weather_inversion|mixed","source_icon":"emoji","confidence":75,"trend":"RISING|STABLE|FALLING","trend_reason":"data-cited reason","vulnerable_impact":"3-4 detailed sentences covering: which groups are most at risk (children, elderly, asthma/COPD patients, outdoor workers, pregnant women), specific symptoms they may experience at this AQI level, and what precautions they should take right now","key_concerns":["c1","c2","c3"],"recommendations":["r1","r2","r3"],"admin_action":"1 specific ward-level action today","citizen_tip":"1 tip for right now","local_insight":"ward-specific geography insight","seasonal_factor":"current season + active event effect","anomaly":false,"anomaly_detail":"","pm25_status":"SAFE|ELEVATED|DANGEROUS","predicted_next_hours":"specific 4-6hr forecast","advisory_cards":[{"visual_key":"metro","title":"Skip Car AM Rush","desc":"NO2 at 68ppb on this corridor 8-10 AM — metro cuts your personal exposure by 60%.","target":"citizen","category":"transport"}]}`;
{"summary":"3-4 sentences","health_risk":"LOW|MODERATE|HIGH|SEVERE|CRITICAL","pollution_source":"specific 5-15 words","source_type":"vehicular|industrial|stubble_burning|construction|waste_burning|dust|weather_inversion|mixed","source_icon":"emoji","confidence":75,"trend":"RISING|STABLE|FALLING","trend_reason":"data-cited reason",{"summary":"3-4 sentences","health_risk":"LOW|MODERATE|HIGH|SEVERE|CRITICAL","pollution_source":"specific 5-15 words","source_type":"vehicular|industrial|stubble_burning|construction|waste_burning|dust|weather_inversion|mixed","source_icon":"emoji","confidence":75,"trend":"RISING|STABLE|FALLING","trend_reason":"data-cited reason","vulnerable_impact":"3-4 detailed sentences covering: which groups are most at risk (children, elderly, asthma/COPD patients, outdoor workers, pregnant women), specific symptoms they may experience at this AQI level, and what precautions they should take right now","key_concerns":["c1","c2","c3"],"recommendations":["r1","r2","r3"],"admin_action":"1 specific ward-level action today","citizen_tip":"1 tip for right now","local_insight":"ward-specific geography insight","seasonal_factor":"current season + active event effect","anomaly":false,"anomaly_detail":"","pm25_status":"SAFE|ELEVATED|DANGEROUS","predicted_next_hours":"specific 4-6hr forecast","advisory_cards":[{"visual_key":"metro","title":"Skip Car AM Rush","desc":"NO2 at 68ppb on this corridor 8-10 AM — metro cuts your personal exposure by 60%.","target":"citizen","category":"transport"}]}`;,"key_concerns":["c1","c2","c3"],"recommendations":["r1","r2","r3"],"admin_action":"1 specific ward-level action today","citizen_tip":"1 tip for right now","local_insight":"ward-specific geography insight","seasonal_factor":"current season + active event effect","anomaly":false,"anomaly_detail":"","pm25_status":"SAFE|ELEVATED|DANGEROUS","predicted_next_hours":"specific 4-6hr forecast","advisory_cards":[{"visual_key":"metro","title":"Skip Car AM Rush","desc":"NO2 at 68ppb on this corridor 8-10 AM — metro cuts your personal exposure by 60%.","target":"citizen","category":"transport"}]}`;
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
      { visual_key: "metro", title: hi ? "पीक ऑवर मेट्रो लें" : "Metro: Skip AM Rush", desc: hi ? "NO2 बढ़ा हुआ है — सुबह 8-10 बजे व शाम 6-9 बजे मेट्रो से जाएं, व्यक्तिगत प्रदूषण 60% कम होगा" : "NO2 elevated — metro cuts personal exposure 60% vs driving during 8-10 AM and 6-9 PM peak corridors", target: "citizen", category: "transport" },
      { visual_key: "carpool", title: hi ? "कारपूल: रोड लोड घटाएं" : "Carpool: Cut Road Load", desc: hi ? "4 लोग एक गाड़ी में = 3 गाड़ियां कम। वार्ड में वाहन घनत्व घटाने का सबसे तेज़ तरीका" : "4 people per car = 3 fewer vehicles. Singapore-proven: 18% NO2 drop when carpool penetration exceeds 30% on a corridor", target: "citizen", category: "transport" },
      { visual_key: "wfh", title: hi ? "WFH: पीक ट्रैफिक टालें" : "WFH: Avoid Peak Traffic", desc: hi ? "GRAP-2+ पर सरकार का 50% WFH आदेश लागू करें — यह Seoul मॉडल है जो AQI>150 पर काम करता है" : "GRAP-2+ triggers mandatory 50% govt WFH — Seoul model shows 15% PM cut when combined with peak-hour plate rationing", target: "citizen", category: "transport" },
      { visual_key: "odd_even", title: hi ? "पीक-ऑवर कॉरिडोर रेशनिंग" : "Peak-Hour Corridor Rationing", desc: hi ? "सुबह 8-10 व शाम 6-9 बजे प्रमुख कॉरिडोर पर लागू करें, दोपहिया वाहन शामिल करें और अतिरिक्त DTC बसें चलाएं — Seoul मॉडल पर सर्दियों में सबसे प्रभावी" : "Activate on key ward corridors during 8-10 AM & 6-9 PM peaks, include two-wheelers and add DTC bus frequency — most effective in winter with WFH order combined", target: "govt", category: "transport" },
    );
  }

  if (sourceType === "construction" || sourceType === "dust") {
    cards.push(
      { visual_key: "construction_shroud", title: hi ? "निर्माण साइट धूल नेट" : "Site Dust-Net Coverage", desc: hi ? "CAQM नियम: 2000 sqm से बड़े सभी निर्माण स्थलों पर धूल-नेट अनिवार्य — वार्ड स्तर पर अनुपालन जांच आज ही करें" : "CAQM mandates dust-suppression nets on all sites >2000 sqm — conduct ward-level compliance inspection today for immediate PM10 reduction", target: "govt", category: "construction" },
      { visual_key: "water_spray", title: hi ? "स्मॉग गन तैनाती" : "Anti-Smog Gun Deployment", desc: hi ? "सक्रिय निर्माण स्थलों के 500m दायरे में एंटी-स्मॉग गन चालू करें — रात 10 बजे के बाद तोड़-फोड़ व कंक्रीट कार्य बंद करें" : "Activate anti-smog guns within 500m of active construction — stop demolition and concrete pouring after 10 PM in residential areas", target: "govt", category: "construction" },
    );
  }

  if (aqi > 200) {
    cards.push(
      { visual_key: "truck_ban", title: hi ? "रात HGV प्रवेश नियंत्रण" : "Night HGV Entry Control", desc: hi ? "गैर-जरूरी भारी वाहनों का रात 10 बजे से सुबह 6 बजे तक प्रवेश नियंत्रित करें — ट्रक-से-PM2.5 कमी के लिए सबसे तेज़ असरदार कदम" : "Restrict non-essential heavy goods vehicle entry 10 PM-6 AM — the fastest high-impact step to reduce overnight PM2.5 accumulation in this ward", target: "govt", category: "transport" },
    );
  }

  if (aqi > 300) {
    cards.push(
      { visual_key: "school_closure", title: hi ? "GRAP-3: स्कूल बंद" : "GRAP-3: Close Schools", desc: hi ? "AQI 300+ पर GRAP-3 स्वतः लागू — बच्चों का बाहरी exposure शून्य करें। ऑनलाइन कक्षाएं अभी शुरू करें" : "AQI 300+ triggers mandatory GRAP-3 school closure — eliminate outdoor child exposure. Switch to online classes immediately", target: "govt", category: "health" },
    );
  }

  // Always add tree cards
  cards.push(
    { visual_key: "tree_peepal", title: hi ? "पीपल: 24hr ऑक्सीजन" : "Peepal: 24hr O₂", desc: hi ? "दिल्ली में सर्वश्रेष्ठ CO₂ अवशोषक, रात को भी ऑक्सीजन देता है — कॉलोनी/छत पर लगाएं" : "Delhi's highest CO₂ absorber — produces oxygen 24hrs unlike most trees. Plant in colony or rooftop", target: "citizen", category: "trees" },
    { visual_key: "tree_neem", title: hi ? "नीम: PM10 अवशोषक" : "Neem: PM10 Absorber", desc: hi ? "सड़क किनारे के लिए सर्वश्रेष्ठ — पत्तियां PM10 और सूक्ष्म धूल कणों को पकड़ती हैं, रोगाणुरोधी भी" : "Best for roadside planting — leaf surface traps PM10 and fine dust. Antimicrobial properties reduce bioaerosol load", target: "citizen", category: "trees" },
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
            { role: "system", content: "You are a Delhi air quality ML engine. Return valid JSON only. Follow all language instructions in the user prompt exactly." },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 2048,
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
          messages: [
            { role: "system", content: "You are a Delhi air quality ML engine. Return ONLY valid JSON, no markdown, no explanation. Complete the entire JSON object." },
            { role: "user", content: prompt },
          ],
          max_tokens: 2048,
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
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
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
    const langInstruction = lang === "hi"
      ? "\nLANGUAGE=HINDI. Every single string value in the JSON — summary, title, desc, pollution_source, trend_reason, recommendations, key_concerns, admin_action, citizen_tip, local_insight, seasonal_factor, vulnerable_impact, predicted_next_hours, anomaly_detail — must be written in Hindi Devanagari script only. No English words allowed in any field."
      : "\nLANGUAGE=ENGLISH. Every single string value in the JSON — summary, title, desc, pollution_source, trend_reason, recommendations, key_concerns, admin_action, citizen_tip, local_insight, seasonal_factor, vulnerable_impact, predicted_next_hours, anomaly_detail — must be written in English only. Hindi/Devanagari characters are strictly forbidden. Do not use मास्क, पहनें, or any Hindi word.";

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
    // Don't cache heuristic fallbacks — retry AI on next request
    if (parsed?._source !== "heuristic_fallback") {
      saveToCache(supabaseAdmin, cacheKey, mode, ward, aqi, parsed).catch((e) =>
        console.error("Cache save error:", e),
      );
    }

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
