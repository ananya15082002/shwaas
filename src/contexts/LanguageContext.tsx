import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Language = "en" | "hi";

interface LanguageContextType {
  lang: Language;
  toggleLang: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// --------------- TRANSLATIONS ---------------
const translations: Record<string, Record<Language, string>> = {
  // Navbar
  "nav.title": { en: "DELHI AQI COMMAND CENTER", hi: "दिल्ली AQI कमांड सेंटर" },
  "nav.subtitle": { en: "REAL-TIME AIR QUALITY INTELLIGENCE", hi: "रीयल-टाइम वायु गुणवत्ता इंटेलिजेंस" },
  "nav.live": { en: "LIVE", hi: "लाइव" },
  "nav.updated": { en: "Updated", hi: "अपडेट" },
  "nav.loading": { en: "Loading...", hi: "लोड हो रहा है..." },

  // Tabs
  "tab.intel": { en: "STATION INTEL", hi: "स्टेशन इंटेल" },
  "tab.city": { en: "CITY OVERVIEW", hi: "शहर अवलोकन" },
  "tab.compare": { en: "COMPARE", hi: "तुलना" },
  "tab.ward": { en: "WARD", hi: "वार्ड" },
  "tab.dictionary": { en: "DICTIONARY", hi: "शब्दकोश" },

  // Hero / City
  "hero.cityAverage": { en: "DELHI NCR — CITY AVERAGE", hi: "दिल्ली NCR — शहर औसत" },
  "hero.stations": { en: "STATIONS", hi: "स्टेशन" },
  "hero.dominant": { en: "DOMINANT", hi: "प्रमुख" },
  "hero.status": { en: "STATUS", hi: "स्थिति" },
  "hero.alert": { en: "ALERT", hi: "अलर्ट" },
  "hero.watch": { en: "WATCH", hi: "सतर्क" },
  "hero.clear": { en: "CLEAR", hi: "सुरक्षित" },
  "hero.aggregated": { en: "Aggregated from", hi: "एकत्रित" },
  "hero.monitoringStations": { en: "monitoring stations across Delhi.", hi: "दिल्ली भर में मॉनिटरिंग स्टेशनों से।" },

  // Station Intel
  "intel.dominant": { en: "Dominant", hi: "प्रमुख" },
  "intel.aiAnalysis": { en: "CLAUDE AI ANALYSIS", hi: "CLAUDE AI विश्लेषण" },
  "intel.analyzing": { en: "Analyzing station data...", hi: "स्टेशन डेटा का विश्लेषण..." },
  "intel.risk": { en: "RISK", hi: "जोखिम" },
  "intel.keyConcerns": { en: "KEY CONCERNS", hi: "मुख्य चिंताएँ" },
  "intel.recommendations": { en: "RECOMMENDATIONS", hi: "सुझाव" },
  "intel.trendAnalysis": { en: "TREND ANALYSIS", hi: "रुझान विश्लेषण" },
  "intel.pollutantBreakdown": { en: "POLLUTANT BREAKDOWN", hi: "प्रदूषक विवरण" },
  "intel.forecast": { en: "7-DAY PM2.5 FORECAST", hi: "7-दिन PM2.5 पूर्वानुमान" },
  "intel.selectStation": { en: "Select a station on the map", hi: "मानचित्र पर एक स्टेशन चुनें" },
  "intel.na": { en: "N/A", hi: "उपलब्ध नहीं" },

  // City Overview
  "city.average": { en: "DELHI NCR CITY AVERAGE", hi: "दिल्ली NCR शहर औसत" },
  "city.stationsReporting": { en: "stations reporting", hi: "स्टेशन रिपोर्ट कर रहे हैं" },
  "city.aiIntelligence": { en: "AI CITY INTELLIGENCE", hi: "AI शहर इंटेलिजेंस" },
  "city.analyzingCity": { en: "Analyzing city data...", hi: "शहर डेटा का विश्लेषण..." },
  "city.healthAdvisory": { en: "HEALTH ADVISORY", hi: "स्वास्थ्य सलाह" },
  "city.outlook": { en: "OUTLOOK", hi: "पूर्वानुमान" },
  "city.stationComparison": { en: "STATION AQI COMPARISON", hi: "स्टेशन AQI तुलना" },
  "city.pollutantProfile": { en: "AVERAGE POLLUTANT PROFILE", hi: "औसत प्रदूषक प्रोफ़ाइल" },
  "city.top10": { en: "TOP 10 MOST POLLUTED WARDS", hi: "शीर्ष 10 सबसे प्रदूषित वार्ड" },

  // Compare
  "compare.select": { en: "SELECT STATIONS TO COMPARE (2-4)", hi: "तुलना के लिए स्टेशन चुनें (2-4)" },
  "compare.selectAtLeast": { en: "Select at least 2 stations to compare", hi: "कम से कम 2 स्टेशन चुनें" },
  "compare.pollutantComparison": { en: "POLLUTANT COMPARISON", hi: "प्रदूषक तुलना" },
  "compare.aiAnalysis": { en: "AI COMPARISON ANALYSIS", hi: "AI तुलना विश्लेषण" },
  "compare.comparing": { en: "Comparing stations...", hi: "स्टेशनों की तुलना..." },
  "compare.patterns": { en: "PATTERNS DETECTED", hi: "पैटर्न मिले" },
  "compare.hotspot": { en: "HOTSPOT ANALYSIS", hi: "हॉटस्पॉट विश्लेषण" },

  // Ward Detail
  "ward.residents": { en: "residents", hi: "निवासी" },
  "ward.population": { en: "Population", hi: "जनसंख्या" },
  "ward.scPopulation": { en: "SC Population", hi: "SC जनसंख्या" },
  "ward.nearestStation": { en: "Nearest Station", hi: "निकटतम स्टेशन" },
  "ward.aqiCategory": { en: "AQI Category", hi: "AQI श्रेणी" },
  "ward.aiIntelligence": { en: "AI WARD INTELLIGENCE", hi: "AI वार्ड इंटेलिजेंस" },
  "ward.fetchingLive": { en: "Fetching live data...", hi: "लाइव डेटा ला रहे हैं..." },
  "ward.analyzingWard": { en: "Analyzing ward data...", hi: "वार्ड डेटा का विश्लेषण..." },
  "ward.primarySource": { en: "PRIMARY SOURCE", hi: "प्राथमिक स्रोत" },
  "ward.confidence": { en: "CONFIDENCE", hi: "विश्वसनीयता" },
  "ward.vulnerableImpact": { en: "VULNERABLE POPULATION IMPACT", hi: "कमज़ोर वर्ग पर प्रभाव" },
  "ward.adminAction": { en: "ADMIN ACTION", hi: "प्रशासनिक कार्रवाई" },
  "ward.citizenTip": { en: "CITIZEN TIP", hi: "नागरिक सुझाव" },
  "ward.localInsight": { en: "LOCAL INSIGHT", hi: "स्थानीय जानकारी" },
  "ward.assembly": { en: "ASSEMBLY CONSTITUENCY", hi: "विधानसभा क्षेत्र" },
  "ward.trendLoading": { en: "Loading trend data...", hi: "रुझान डेटा लोड हो रहा है..." },
  "ward.trendTitle": { en: "PM2.5 & PM10 TREND", hi: "PM2.5 और PM10 रुझान" },
  "ward.live": { en: "LIVE from", hi: "लाइव" },
  "ward.dominant": { en: "dominant", hi: "प्रमुख" },

  // Error
  "error.title": { en: "DATA LINK INTERRUPTED", hi: "डेटा लिंक बाधित" },
  "error.retry": { en: "Retry Connection", hi: "पुनः कनेक्ट करें" },

  // AQI Gauge
  "gauge.usAqi": { en: "US AQI", hi: "US AQI" },

  // Station Card
  "card.clickAnalysis": { en: "Click for detailed analysis →", hi: "विस्तृत विश्लेषण के लिए क्लिक करें →" },

  // Station Detail Dialog
  "detail.pollutantBreakdown": { en: "POLLUTANT BREAKDOWN", hi: "प्रदूषक विवरण" },
  "detail.forecast": { en: "7-DAY PM2.5 FORECAST", hi: "7-दिन PM2.5 पूर्वानुमान" },
  "detail.healthAdvisory": { en: "AI HEALTH ADVISORY", hi: "AI स्वास्थ्य सलाह" },
  "detail.pollutionSources": { en: "AI POLLUTION SOURCE DETECTION", hi: "AI प्रदूषण स्रोत पहचान" },
  "detail.policyRecs": { en: "GOVERNMENT POLICY RECOMMENDATIONS", hi: "सरकारी नीति सिफारिशें" },
  "detail.dominantPollutant": { en: "Dominant pollutant", hi: "प्रमुख प्रदूषक" },
  "detail.lastMeasured": { en: "Last measured", hi: "अंतिम माप" },

  // Dictionary
  "dict.title": { en: "AQI DICTIONARY", hi: "AQI शब्दकोश" },
  "dict.subtitle": { en: "Quick reference for all technical terms used in this dashboard.", hi: "इस डैशबोर्ड में प्रयुक्त सभी तकनीकी शब्दों का त्वरित संदर्भ।" },

  // AQI Levels
  "aqi.good": { en: "Good", hi: "अच्छा" },
  "aqi.moderate": { en: "Moderate", hi: "मध्यम" },
  "aqi.sensitive": { en: "Unhealthy for Sensitive Groups", hi: "संवेदनशील समूहों के लिए अस्वास्थ्यकर" },
  "aqi.unhealthy": { en: "Unhealthy", hi: "अस्वास्थ्यकर" },
  "aqi.veryUnhealthy": { en: "Very Unhealthy", hi: "बहुत अस्वास्थ्यकर" },
  "aqi.hazardous": { en: "Hazardous", hi: "खतरनाक" },

  // AQI Descriptions
  "aqi.good.desc": { en: "Air quality is satisfactory", hi: "वायु गुणवत्ता संतोषजनक है" },
  "aqi.moderate.desc": { en: "Acceptable air quality", hi: "स्वीकार्य वायु गुणवत्ता" },
  "aqi.sensitive.desc": { en: "Sensitive groups may experience effects", hi: "संवेदनशील समूहों पर प्रभाव हो सकता है" },
  "aqi.unhealthy.desc": { en: "Everyone may experience health effects", hi: "सभी पर स्वास्थ्य प्रभाव हो सकता है" },
  "aqi.veryUnhealthy.desc": { en: "Health alert: serious health effects", hi: "स्वास्थ्य चेतावनी: गंभीर स्वास्थ्य प्रभाव" },
  "aqi.hazardous.desc": { en: "Emergency conditions", hi: "आपातकालीन स्थिति" },

  // Language toggle
  "lang.toggle": { en: "हिन्दी", hi: "English" },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    try {
      return (localStorage.getItem("shwaas-lang") as Language) || "en";
    } catch {
      return "en";
    }
  });

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next = prev === "en" ? "hi" : "en";
      try { localStorage.setItem("shwaas-lang", next); } catch {}
      return next;
    });
  }, []);

  const t = useCallback(
    (key: string) => translations[key]?.[lang] ?? key,
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
