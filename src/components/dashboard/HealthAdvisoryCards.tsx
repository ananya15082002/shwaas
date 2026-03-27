import { useLanguage } from "@/contexts/LanguageContext";
import { Heart, Baby, UserRound, PersonStanding, Stethoscope, Wind, ShieldAlert, Bike } from "lucide-react";

interface HealthAdvisoryCardsProps {
  aqi: number;
}

const getAdvice = (aqi: number, lang: "en" | "hi") => {
  if (aqi <= 50) return {
    level: "good",
    color: "#00E5A0",
    general: lang === "en" ? "Air quality is ideal. Enjoy outdoor activities!" : "वायु गुणवत्ता उत्तम। बाहरी गतिविधियों का आनंद लें!",
    groups: [
      { icon: Baby, label: lang === "en" ? "Children" : "बच्चे", advice: lang === "en" ? "Safe for all outdoor play" : "बाहर खेलना सुरक्षित" },
      { icon: UserRound, label: lang === "en" ? "Elderly" : "बुज़ुर्ग", advice: lang === "en" ? "No precautions needed" : "कोई सावधानी नहीं" },
      { icon: Stethoscope, label: lang === "en" ? "Asthma" : "दमा", advice: lang === "en" ? "Safe for outdoor exercise" : "बाहर व्यायाम सुरक्षित" },
      { icon: Bike, label: lang === "en" ? "Active" : "सक्रिय", advice: lang === "en" ? "Great for jogging & cycling" : "जॉगिंग और साइकलिंग के लिए बढ़िया" },
    ],
  };
  if (aqi <= 100) return {
    level: "moderate",
    color: "#FFD600",
    general: lang === "en" ? "Acceptable quality. Sensitive individuals should be cautious." : "स्वीकार्य गुणवत्ता। संवेदनशील लोग सावधान रहें।",
    groups: [
      { icon: Baby, label: lang === "en" ? "Children" : "बच्चे", advice: lang === "en" ? "Limit prolonged outdoor play" : "लंबे समय तक बाहर खेलना सीमित करें" },
      { icon: UserRound, label: lang === "en" ? "Elderly" : "बुज़ुर्ग", advice: lang === "en" ? "Reduce prolonged exertion" : "लंबी शारीरिक मेहनत कम करें" },
      { icon: Stethoscope, label: lang === "en" ? "Asthma" : "दमा", advice: lang === "en" ? "Keep inhaler handy" : "इनहेलर पास रखें" },
      { icon: Bike, label: lang === "en" ? "Active" : "सक्रिय", advice: lang === "en" ? "OK for short outdoor exercise" : "छोटे व्यायाम ठीक हैं" },
    ],
  };
  if (aqi <= 150) return {
    level: "sensitive",
    color: "#FF8C00",
    general: lang === "en" ? "Unhealthy for sensitive groups. Limit outdoor time." : "संवेदनशील समूहों के लिए अस्वास्थ्यकर।",
    groups: [
      { icon: Baby, label: lang === "en" ? "Children" : "बच्चे", advice: lang === "en" ? "Avoid prolonged outdoor play" : "लंबे समय तक बाहर न खेलें" },
      { icon: UserRound, label: lang === "en" ? "Elderly" : "बुज़ुर्ग", advice: lang === "en" ? "Stay indoors, close windows" : "घर में रहें, खिड़कियाँ बंद करें" },
      { icon: Stethoscope, label: lang === "en" ? "Asthma" : "दमा", advice: lang === "en" ? "Avoid outdoor exercise entirely" : "बाहर व्यायाम बिल्कुल न करें" },
      { icon: Bike, label: lang === "en" ? "Active" : "सक्रिय", advice: lang === "en" ? "Move exercise indoors" : "व्यायाम घर के अंदर करें" },
    ],
  };
  if (aqi <= 200) return {
    level: "unhealthy",
    color: "#FF3D3D",
    general: lang === "en" ? "Everyone may experience health effects. Reduce outdoor activity." : "सभी पर स्वास्थ्य प्रभाव। बाहरी गतिविधि कम करें।",
    groups: [
      { icon: Baby, label: lang === "en" ? "Children" : "बच्चे", advice: lang === "en" ? "Keep indoors, use air purifier" : "घर में रखें, एयर प्यूरीफायर चलाएँ" },
      { icon: UserRound, label: lang === "en" ? "Elderly" : "बुज़ुर्ग", advice: lang === "en" ? "Avoid all outdoor activity" : "बाहर बिल्कुल न जाएँ" },
      { icon: Stethoscope, label: lang === "en" ? "Asthma" : "दमा", advice: lang === "en" ? "Stay indoors, monitor symptoms" : "घर में रहें, लक्षण देखते रहें" },
      { icon: Bike, label: lang === "en" ? "Active" : "सक्रिय", advice: lang === "en" ? "No outdoor exercise. Use N95 if out" : "बाहर व्यायाम नहीं। N95 पहनें" },
    ],
  };
  if (aqi <= 300) return {
    level: "veryUnhealthy",
    color: "#8B3A8F",
    general: lang === "en" ? "Health alert! Serious effects possible. Stay indoors." : "स्वास्थ्य चेतावनी! गंभीर प्रभाव संभव। घर में रहें।",
    groups: [
      { icon: Baby, label: lang === "en" ? "Children" : "बच्चे", advice: lang === "en" ? "Stay indoors, seal windows, run purifier" : "घर में रहें, खिड़कियाँ सील करें" },
      { icon: UserRound, label: lang === "en" ? "Elderly" : "बुज़ुर्ग", advice: lang === "en" ? "Medical alert — avoid going out" : "मेडिकल अलर्ट — बाहर न जाएँ" },
      { icon: Stethoscope, label: lang === "en" ? "Asthma" : "दमा", advice: lang === "en" ? "Emergency kit ready, stay indoors" : "इमरजेंसी किट तैयार रखें" },
      { icon: Bike, label: lang === "en" ? "Active" : "सक्रिय", advice: lang === "en" ? "All outdoor activity suspended" : "सभी बाहरी गतिविधि बंद" },
    ],
  };
  return {
    level: "hazardous",
    color: "#7E0023",
    general: lang === "en" ? "EMERGENCY! Everyone should stay indoors. Wear N95 if going out." : "आपातकाल! सभी घर में रहें। बाहर जाएँ तो N95 पहनें।",
    groups: [
      { icon: Baby, label: lang === "en" ? "Children" : "बच्चे", advice: lang === "en" ? "Do NOT go outside under any circumstances" : "किसी भी हालत में बाहर न जाएँ" },
      { icon: UserRound, label: lang === "en" ? "Elderly" : "बुज़ुर्ग", advice: lang === "en" ? "Seek medical help if breathing issues" : "साँस की तकलीफ हो तो डॉक्टर को दिखाएँ" },
      { icon: Stethoscope, label: lang === "en" ? "Asthma" : "दमा", advice: lang === "en" ? "Hospital alert — have emergency plan" : "अस्पताल अलर्ट — इमरजेंसी प्लान रखें" },
      { icon: Bike, label: lang === "en" ? "Active" : "सक्रिय", advice: lang === "en" ? "Zero outdoor exposure. N95 mandatory" : "बाहर जाना शून्य। N95 अनिवार्य" },
    ],
  };
};

export function HealthAdvisoryCards({ aqi }: HealthAdvisoryCardsProps) {
  const { t, lang } = useLanguage();
  const advice = getAdvice(aqi, lang);

  return (
    <div className="space-y-2">
      <h4 className="flex items-center gap-2 font-display text-xs font-bold tracking-widest text-primary">
        <Heart className="h-4 w-4" /> {t("ward.healthAdvisory")}
      </h4>
      <div className="rounded-lg border border-border p-3" style={{ background: `${advice.color}08` }}>
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" style={{ color: advice.color }} />
          <p className="font-body text-xs leading-relaxed text-foreground">{advice.general}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 xs:grid-cols-2 sm:grid-cols-2">
        {advice.groups.map(({ icon: Icon, label, advice: tip }) => (
          <div key={label} className="rounded-lg border border-border bg-card/50 p-2.5">
            <div className="flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" style={{ color: advice.color }} />
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
            </div>
            <p className="mt-1 font-body text-[11px] leading-snug text-foreground/80">{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
