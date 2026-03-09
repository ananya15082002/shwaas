import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, Wind, Thermometer, Activity, Shield, AlertTriangle, TrendingUp, Factory, Users } from "lucide-react";

interface Term {
  term: string;
  termHi: string;
  icon: React.ReactNode;
  description: string;
  descriptionHi: string;
}

const TERMS: Term[] = [
  {
    term: "AQI (Air Quality Index)",
    termHi: "AQI (वायु गुणवत्ता सूचकांक)",
    icon: <Activity className="h-4 w-4" />,
    description: "A standardized scale from 0–500 that tells you how clean or polluted the air is. 0–50 is Good, 51–100 Moderate, 101–150 Unhealthy for Sensitive Groups, 151–200 Unhealthy, 201–300 Very Unhealthy, and 301–500 Hazardous.",
    descriptionHi: "0–500 का एक मानकीकृत पैमाना जो बताता है कि हवा कितनी साफ या प्रदूषित है। 0–50 अच्छा, 51–100 मध्यम, 101–150 संवेदनशील समूहों के लिए अस्वास्थ्यकर, 151–200 अस्वास्थ्यकर, 201–300 बहुत अस्वास्थ्यकर, और 301–500 खतरनाक।",
  },
  {
    term: "PM2.5",
    termHi: "PM2.5 (सूक्ष्म कण)",
    icon: <Wind className="h-4 w-4" />,
    description: "Particulate Matter smaller than 2.5 micrometres — about 30× thinner than a human hair. These tiny particles penetrate deep into lungs and even enter the bloodstream, causing respiratory and cardiovascular diseases. Major sources: vehicle exhaust, crop burning, and industrial emissions.",
    descriptionHi: "2.5 माइक्रोमीटर से छोटे कण — मानव बाल से लगभग 30 गुना पतले। ये सूक्ष्म कण फेफड़ों में गहराई तक प्रवेश करते हैं और रक्तप्रवाह में भी पहुँच जाते हैं, जिससे श्वसन और हृदय रोग होते हैं। प्रमुख स्रोत: वाहन उत्सर्जन, पराली जलाना, और औद्योगिक उत्सर्जन।",
  },
  {
    term: "PM10",
    termHi: "PM10 (स्थूल कण)",
    icon: <Wind className="h-4 w-4" />,
    description: "Particulate Matter smaller than 10 micrometres. Includes dust, pollen, and mould spores. Can irritate eyes, nose and throat. Common sources: road dust, construction sites, and open burning.",
    descriptionHi: "10 माइक्रोमीटर से छोटे कण। इसमें धूल, पराग और फफूंद बीजाणु शामिल हैं। आँखों, नाक और गले में जलन कर सकते हैं। सामान्य स्रोत: सड़क की धूल, निर्माण स्थल और खुले में जलाना।",
  },
  {
    term: "NO₂ (Nitrogen Dioxide)",
    termHi: "NO₂ (नाइट्रोजन डाइऑक्साइड)",
    icon: <Factory className="h-4 w-4" />,
    description: "A reddish-brown gas produced by vehicle engines and power plants. Irritates airways, worsens asthma, and contributes to smog and acid rain.",
    descriptionHi: "वाहन इंजन और बिजली संयंत्रों से उत्पन्न लालिमा-भूरी गैस। श्वसन मार्ग में जलन करती है, अस्थमा बिगाड़ती है, और धुंध व अम्ल वर्षा में योगदान करती है।",
  },
  {
    term: "O₃ (Ozone)",
    termHi: "O₃ (ओज़ोन)",
    icon: <Shield className="h-4 w-4" />,
    description: "Ground-level ozone is formed when sunlight reacts with pollutants like NO₂ and VOCs. Unlike the protective ozone layer high in the atmosphere, ground-level ozone is harmful — it can trigger chest pain, coughing, and breathing difficulty.",
    descriptionHi: "जमीनी स्तर का ओज़ोन तब बनता है जब सूर्य का प्रकाश NO₂ और VOC जैसे प्रदूषकों से प्रतिक्रिया करता है। वायुमंडल में ऊपर की सुरक्षात्मक ओज़ोन परत के विपरीत, जमीनी ओज़ोन हानिकारक है — यह सीने में दर्द, खाँसी और साँस लेने में कठिनाई पैदा कर सकता है।",
  },
  {
    term: "CO (Carbon Monoxide)",
    termHi: "CO (कार्बन मोनोऑक्साइड)",
    icon: <AlertTriangle className="h-4 w-4" />,
    description: "A colourless, odourless gas from incomplete combustion of fuels. At high levels it reduces the blood's ability to carry oxygen, causing dizziness and headaches. Major sources: vehicles and biomass burning.",
    descriptionHi: "ईंधन के अपूर्ण दहन से निकलने वाली रंगहीन, गंधहीन गैस। उच्च स्तर पर यह रक्त की ऑक्सीजन वहन क्षमता कम करती है, जिससे चक्कर और सिरदर्द होता है। प्रमुख स्रोत: वाहन और बायोमास जलाना।",
  },
  {
    term: "SO₂ (Sulphur Dioxide)",
    termHi: "SO₂ (सल्फर डाइऑक्साइड)",
    icon: <Factory className="h-4 w-4" />,
    description: "A sharp-smelling gas from burning fossil fuels containing sulphur (coal, oil). Irritates the respiratory system and contributes to acid rain. Mainly from power plants and industrial processes.",
    descriptionHi: "सल्फर युक्त जीवाश्म ईंधन (कोयला, तेल) जलाने से निकलने वाली तीखी गंध वाली गैस। श्वसन तंत्र में जलन करती है और अम्ल वर्षा में योगदान करती है। मुख्यतः बिजली संयंत्रों और औद्योगिक प्रक्रियाओं से।",
  },
  {
    term: "Dominant Pollutant",
    termHi: "प्रमुख प्रदूषक",
    icon: <TrendingUp className="h-4 w-4" />,
    description: "The single pollutant that currently has the highest sub-index value and therefore determines the overall AQI reading for a station.",
    descriptionHi: "वह एकल प्रदूषक जिसका वर्तमान में सबसे अधिक उप-सूचकांक मान है और इसलिए किसी स्टेशन की समग्र AQI रीडिंग निर्धारित करता है।",
  },
  {
    term: "GRAP (Graded Response Action Plan)",
    termHi: "GRAP (श्रेणीबद्ध कार्य योजना)",
    icon: <Shield className="h-4 w-4" />,
    description: "Delhi's emergency action plan that activates stricter measures as AQI worsens — from Stage I (Poor) to Stage IV (Severe+). Actions include banning construction, restricting trucks, and closing schools.",
    descriptionHi: "दिल्ली की आपातकालीन कार्य योजना जो AQI बिगड़ने पर सख्त उपाय सक्रिय करती है — चरण I (खराब) से चरण IV (गंभीर+) तक। कार्रवाइयों में निर्माण पर प्रतिबंध, ट्रकों पर प्रतिबंध और स्कूल बंद करना शामिल है।",
  },
  {
    term: "Temperature Inversion",
    termHi: "तापमान व्युत्क्रमण",
    icon: <Thermometer className="h-4 w-4" />,
    description: "A weather condition where a layer of warm air traps cool air near the ground, preventing pollutants from dispersing upward. Common in Delhi during winter, leading to severe smog episodes.",
    descriptionHi: "एक मौसमी स्थिति जहाँ गर्म हवा की परत ठंडी हवा को जमीन के पास फँसा लेती है, जिससे प्रदूषक ऊपर नहीं फैल पाते। दिल्ली में सर्दियों में आम, जो गंभीर धुंध की घटनाओं का कारण बनता है।",
  },
  {
    term: "Ward",
    termHi: "वार्ड",
    icon: <Users className="h-4 w-4" />,
    description: "The smallest administrative division of Delhi's municipal area. Each ward has its own elected councillor. This dashboard shows interpolated AQI for each ward based on the nearest monitoring station.",
    descriptionHi: "दिल्ली नगरपालिका क्षेत्र का सबसे छोटा प्रशासनिक विभाग। प्रत्येक वार्ड का अपना निर्वाचित पार्षद होता है। यह डैशबोर्ड निकटतम मॉनिटरिंग स्टेशन के आधार पर प्रत्येक वार्ड का अनुमानित AQI दिखाता है।",
  },
  {
    term: "Interpolated AQI",
    termHi: "अनुमानित AQI",
    icon: <Activity className="h-4 w-4" />,
    description: "An estimated AQI value for a ward calculated from the readings of nearby monitoring stations, weighted by distance. Since not every ward has its own sensor, interpolation fills the gaps.",
    descriptionHi: "निकटवर्ती मॉनिटरिंग स्टेशनों की रीडिंग से गणना किया गया वार्ड का अनुमानित AQI मान, दूरी के अनुसार भारित। चूँकि हर वार्ड में सेंसर नहीं है, इंटरपोलेशन अंतराल भरता है।",
  },
];

export function DictionaryTab() {
  const { t, lang } = useLanguage();

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="font-display text-sm font-bold tracking-widest text-primary">
            {t("dict.title")}
          </h2>
        </div>
        <p className="font-mono text-[10px] text-muted-foreground">
          {t("dict.subtitle")}
        </p>

        <div className="space-y-2">
          {TERMS.map((item) => (
            <div
              key={item.term}
              className="rounded-lg border border-border bg-card/50 p-3 transition-colors hover:bg-card/80"
            >
              <div className="flex items-center gap-2">
                <span className="text-primary">{item.icon}</span>
                <h3 className="font-display text-xs font-bold text-foreground">
                  {lang === "hi" ? item.termHi : item.term}
                </h3>
              </div>
              <p className="mt-1.5 ml-6 font-body text-xs leading-relaxed text-secondary-foreground">
                {lang === "hi" ? item.descriptionHi : item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
