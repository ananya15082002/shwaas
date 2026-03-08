import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Wind, Thermometer, Activity, Shield, AlertTriangle, TrendingUp, Factory, Users } from "lucide-react";

interface Term {
  term: string;
  hindi?: string;
  icon: React.ReactNode;
  description: string;
}

const TERMS: Term[] = [
  {
    term: "AQI (Air Quality Index)",
    hindi: "वायु गुणवत्ता सूचकांक",
    icon: <Activity className="h-4 w-4" />,
    description:
      "A standardized scale from 0–500 that tells you how clean or polluted the air is. 0–50 is Good, 51–100 Moderate, 101–150 Unhealthy for Sensitive Groups, 151–200 Unhealthy, 201–300 Very Unhealthy, and 301–500 Hazardous.",
  },
  {
    term: "PM2.5",
    hindi: "सूक्ष्म कण",
    icon: <Wind className="h-4 w-4" />,
    description:
      "Particulate Matter smaller than 2.5 micrometres — about 30× thinner than a human hair. These tiny particles penetrate deep into lungs and even enter the bloodstream, causing respiratory and cardiovascular diseases. Major sources: vehicle exhaust, crop burning, and industrial emissions.",
  },
  {
    term: "PM10",
    hindi: "स्थूल कण",
    icon: <Wind className="h-4 w-4" />,
    description:
      "Particulate Matter smaller than 10 micrometres. Includes dust, pollen, and mould spores. Can irritate eyes, nose and throat. Common sources: road dust, construction sites, and open burning.",
  },
  {
    term: "NO₂ (Nitrogen Dioxide)",
    hindi: "नाइट्रोजन डाइऑक्साइड",
    icon: <Factory className="h-4 w-4" />,
    description:
      "A reddish-brown gas produced by vehicle engines and power plants. Irritates airways, worsens asthma, and contributes to smog and acid rain.",
  },
  {
    term: "O₃ (Ozone)",
    hindi: "ओज़ोन",
    icon: <Shield className="h-4 w-4" />,
    description:
      "Ground-level ozone is formed when sunlight reacts with pollutants like NO₂ and VOCs. Unlike the protective ozone layer high in the atmosphere, ground-level ozone is harmful — it can trigger chest pain, coughing, and breathing difficulty.",
  },
  {
    term: "CO (Carbon Monoxide)",
    hindi: "कार्बन मोनोऑक्साइड",
    icon: <AlertTriangle className="h-4 w-4" />,
    description:
      "A colourless, odourless gas from incomplete combustion of fuels. At high levels it reduces the blood's ability to carry oxygen, causing dizziness and headaches. Major sources: vehicles and biomass burning.",
  },
  {
    term: "SO₂ (Sulphur Dioxide)",
    hindi: "सल्फर डाइऑक्साइड",
    icon: <Factory className="h-4 w-4" />,
    description:
      "A sharp-smelling gas from burning fossil fuels containing sulphur (coal, oil). Irritates the respiratory system and contributes to acid rain. Mainly from power plants and industrial processes.",
  },
  {
    term: "Dominant Pollutant",
    hindi: "प्रमुख प्रदूषक",
    icon: <TrendingUp className="h-4 w-4" />,
    description:
      "The single pollutant that currently has the highest sub-index value and therefore determines the overall AQI reading for a station.",
  },
  {
    term: "GRAP (Graded Response Action Plan)",
    hindi: "श्रेणीबद्ध कार्य योजना",
    icon: <Shield className="h-4 w-4" />,
    description:
      "Delhi's emergency action plan that activates stricter measures as AQI worsens — from Stage I (Poor) to Stage IV (Severe+). Actions include banning construction, restricting trucks, and closing schools.",
  },
  {
    term: "Temperature Inversion",
    hindi: "तापमान व्युत्क्रमण",
    icon: <Thermometer className="h-4 w-4" />,
    description:
      "A weather condition where a layer of warm air traps cool air near the ground, preventing pollutants from dispersing upward. Common in Delhi during winter, leading to severe smog episodes.",
  },
  {
    term: "Ward",
    hindi: "वार्ड",
    icon: <Users className="h-4 w-4" />,
    description:
      "The smallest administrative division of Delhi's municipal area. Each ward has its own elected councillor. This dashboard shows interpolated AQI for each ward based on the nearest monitoring station.",
  },
  {
    term: "Interpolated AQI",
    hindi: "अनुमानित AQI",
    icon: <Activity className="h-4 w-4" />,
    description:
      "An estimated AQI value for a ward calculated from the readings of nearby monitoring stations, weighted by distance. Since not every ward has its own sensor, interpolation fills the gaps.",
  },
];

export function DictionaryTab() {
  return (
    <ScrollArea className="h-[calc(100vh-12rem)]">
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="font-display text-sm font-bold tracking-widest text-primary">
            AQI DICTIONARY
          </h2>
        </div>
        <p className="font-mono text-[10px] text-muted-foreground">
          Quick reference for all technical terms used in this dashboard.
        </p>

        <div className="space-y-2">
          {TERMS.map((t) => (
            <div
              key={t.term}
              className="rounded-lg border border-border bg-card/50 p-3 transition-colors hover:bg-card/80"
            >
              <div className="flex items-center gap-2">
                <span className="text-primary">{t.icon}</span>
                <h3 className="font-display text-xs font-bold text-foreground">
                  {t.term}
                </h3>
              </div>
              {t.hindi && (
                <p className="mt-0.5 ml-6 font-mono text-[9px] text-muted-foreground">
                  {t.hindi}
                </p>
              )}
              <p className="mt-1.5 ml-6 font-body text-xs leading-relaxed text-secondary-foreground">
                {t.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
