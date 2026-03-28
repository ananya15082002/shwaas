import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  BookOpen, Wind, Thermometer, Activity, Shield, AlertTriangle,
  TrendingUp, Factory, Users, ChevronDown, ChevronRight,
  Droplets, Eye, HeartPulse, Brain, Baby,
  Car, Flame, Building2, Leaf, Truck, Cigarette,
  Ruler, Info, Skull, Zap, CloudRain, Sun, Stethoscope,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Source {
  icon: React.ReactNode;
  label: string;
  labelHi: string;
  desc: string;
  descHi: string;
}

interface HealthImpact {
  icon: React.ReactNode;
  label: string;
  labelHi: string;
  type: "short" | "long";
}

interface PollutantEntry {
  id: string;
  term: string;
  termHi: string;
  icon: React.ReactNode;
  color: string;
  tagline: string;
  taglineHi: string;
  description: string;
  descriptionHi: string;
  sizeComparison?: string;
  sizeComparisonHi?: string;
  whoGuideline?: string;
  whoGuidelineHi?: string;
  sources: Source[];
  healthImpacts: HealthImpact[];
  funFact?: string;
  funFactHi?: string;
}

interface ConceptEntry {
  id: string;
  term: string;
  termHi: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  descriptionHi: string;
  details?: string;
  detailsHi?: string;
}

const POLLUTANTS: PollutantEntry[] = [
  {
    id: "pm25",
    term: "PM2.5",
    termHi: "PM2.5 (सूक्ष्म कण)",
    icon: <Wind className="h-5 w-5" />,
    color: "hsl(0, 85%, 55%)",
    tagline: "The invisible killer",
    taglineHi: "अदृश्य हत्यारा",
    description: "Particulate Matter smaller than 2.5 micrometres — about 30× thinner than a human hair. These tiny particles penetrate deep into lungs and even enter the bloodstream.",
    descriptionHi: "2.5 माइक्रोमीटर से छोटे कण — मानव बाल से लगभग 30 गुना पतले। ये सूक्ष्म कण फेफड़ों में गहराई तक प्रवेश करते हैं और रक्तप्रवाह में भी पहुँच जाते हैं।",
    sizeComparison: "30× thinner than human hair • Can pass through lungs into blood",
    sizeComparisonHi: "मानव बाल से 30 गुना पतले • फेफड़ों से रक्त में जा सकते हैं",
    whoGuideline: "WHO 24-hr guideline: 15 µg/m³",
    whoGuidelineHi: "WHO 24-घंटे दिशानिर्देश: 15 µg/m³",
    sources: [
      { icon: <Car className="h-4 w-4" />, label: "Vehicle Exhaust", labelHi: "वाहन उत्सर्जन", desc: "Diesel & petrol engines emit fine soot particles", descHi: "डीजल और पेट्रोल इंजन से सूक्ष्म कालिख कण निकलते हैं" },
      { icon: <Flame className="h-4 w-4" />, label: "Crop Burning", labelHi: "पराली जलाना", desc: "Stubble burning in Punjab & Haryana spreads smoke to Delhi", descHi: "पंजाब और हरियाणा में पराली जलाने से धुआँ दिल्ली तक फैलता है" },
      { icon: <Factory className="h-4 w-4" />, label: "Industrial Emissions", labelHi: "औद्योगिक उत्सर्जन", desc: "Factories, brick kilns, and power plants", descHi: "कारखाने, ईंट भट्टे और बिजली संयंत्र" },
      { icon: <Cigarette className="h-4 w-4" />, label: "Biomass & Cooking", labelHi: "बायोमास और खाना पकाना", desc: "Burning wood, dung cakes for cooking", descHi: "लकड़ी, उपले जलाकर खाना पकाना" },
    ],
    healthImpacts: [
      { icon: <Stethoscope className="h-4 w-4" />, label: "Asthma & Bronchitis", labelHi: "अस्थमा और ब्रोंकाइटिस", type: "short" },
      { icon: <HeartPulse className="h-4 w-4" />, label: "Heart Attacks", labelHi: "हृदय रोग", type: "long" },
      { icon: <Brain className="h-4 w-4" />, label: "Cognitive Decline", labelHi: "संज्ञानात्मक गिरावट", type: "long" },
      { icon: <Baby className="h-4 w-4" />, label: "Low Birth Weight", labelHi: "कम जन्म वजन", type: "long" },
      { icon: <Eye className="h-4 w-4" />, label: "Eye Irritation", labelHi: "आँखों में जलन", type: "short" },
    ],
    funFact: "Delhi's PM2.5 regularly exceeds WHO limits by 10–20×, equivalent to smoking 10+ cigarettes daily.",
    funFactHi: "दिल्ली का PM2.5 नियमित रूप से WHO सीमा से 10-20 गुना अधिक होता है, जो रोज़ 10+ सिगरेट पीने के बराबर है।",
  },
  {
    id: "pm10",
    term: "PM10",
    termHi: "PM10 (स्थूल कण)",
    icon: <Wind className="h-5 w-5" />,
    color: "hsl(30, 100%, 55%)",
    tagline: "Dust you can almost see",
    taglineHi: "धूल जो लगभग दिखती है",
    description: "Particulate Matter smaller than 10 micrometres. Includes dust, pollen, and mould spores. Can irritate eyes, nose and throat.",
    descriptionHi: "10 माइक्रोमीटर से छोटे कण। इसमें धूल, पराग और फफूंद बीजाणु शामिल हैं। आँखों, नाक और गले में जलन कर सकते हैं।",
    sizeComparison: "1/5 to 1/7 the size of human hair • Settles in upper airways",
    sizeComparisonHi: "मानव बाल का 1/5 से 1/7 आकार • ऊपरी श्वसन मार्ग में जमता है",
    whoGuideline: "WHO 24-hr guideline: 45 µg/m³",
    whoGuidelineHi: "WHO 24-घंटे दिशानिर्देश: 45 µg/m³",
    sources: [
      { icon: <Wind className="h-4 w-4" />, label: "Wind-blown Dust", labelHi: "हवा से उड़ी धूल", desc: "Dust lifted from bare soil and unpaved roads", descHi: "खुली मिट्टी और कच्ची सड़कों से उड़ी धूल" },
      { icon: <Building2 className="h-4 w-4" />, label: "Construction Sites", labelHi: "निर्माण स्थल", desc: "Demolition, digging, and cement mixing", descHi: "तोड़-फोड़, खुदाई और सीमेंट मिश्रण" },
      { icon: <Factory className="h-4 w-4" />, label: "Industries", labelHi: "उद्योग", desc: "Crushing, grinding, and manufacturing", descHi: "कुचलना, पीसना और निर्माण प्रक्रिया" },
      { icon: <Flame className="h-4 w-4" />, label: "Waste Burning", labelHi: "कचरा जलाना", desc: "Open burning of municipal and agricultural waste", descHi: "नगरपालिका और कृषि कचरे का खुले में जलाना" },
      { icon: <Truck className="h-4 w-4" />, label: "Vehicle Dust", labelHi: "वाहन धूल", desc: "Tyre wear and road dust kicked up by traffic", descHi: "टायर घिसाव और ट्रैफिक से उड़ी सड़क धूल" },
    ],
    healthImpacts: [
      { icon: <Eye className="h-4 w-4" />, label: "Eye Irritation", labelHi: "आँखों में जलन", type: "short" },
      { icon: <Droplets className="h-4 w-4" />, label: "Runny Nose & Cough", labelHi: "बहती नाक और खाँसी", type: "short" },
      { icon: <Stethoscope className="h-4 w-4" />, label: "Breathing Difficulty", labelHi: "साँस लेने में कठिनाई", type: "short" },
      { icon: <AlertTriangle className="h-4 w-4" />, label: "Allergies", labelHi: "एलर्जी", type: "short" },
      { icon: <HeartPulse className="h-4 w-4" />, label: "Chest Tightness", labelHi: "सीने में जकड़न", type: "short" },
    ],
    funFact: "Delhi's construction boom generates massive PM10 — one demolition site can spike local levels to 500+ µg/m³.",
    funFactHi: "दिल्ली के निर्माण उछाल से भारी PM10 उत्पन्न होता है — एक तोड़-फोड़ स्थल स्थानीय स्तर को 500+ µg/m³ तक पहुँचा सकता है।",
  },
  {
    id: "no2",
    term: "NO₂ (Nitrogen Dioxide)",
    termHi: "NO₂ (नाइट्रोजन डाइऑक्साइड)",
    icon: <Factory className="h-5 w-5" />,
    color: "hsl(280, 70%, 50%)",
    tagline: "The traffic gas",
    taglineHi: "ट्रैफिक की गैस",
    description: "A reddish-brown gas produced by vehicle engines and power plants. Irritates airways, worsens asthma, and contributes to smog and acid rain.",
    descriptionHi: "वाहन इंजन और बिजली संयंत्रों से उत्पन्न लालिमा-भूरी गैस। श्वसन मार्ग में जलन करती है, अस्थमा बिगाड़ती है, और धुंध व अम्ल वर्षा में योगदान करती है।",
    whoGuideline: "WHO 24-hr guideline: 25 µg/m³",
    whoGuidelineHi: "WHO 24-घंटे दिशानिर्देश: 25 µg/m³",
    sources: [
      { icon: <Car className="h-4 w-4" />, label: "Vehicles", labelHi: "वाहन", desc: "Diesel trucks and buses are biggest emitters", descHi: "डीज़ल ट्रक और बसें सबसे बड़े उत्सर्जक हैं" },
      { icon: <Zap className="h-4 w-4" />, label: "Power Plants", labelHi: "बिजली संयंत्र", desc: "Coal-fired electricity generation", descHi: "कोयले से बिजली उत्पादन" },
      { icon: <Factory className="h-4 w-4" />, label: "Industrial Boilers", labelHi: "औद्योगिक बॉयलर", desc: "High-temperature combustion processes", descHi: "उच्च-तापमान दहन प्रक्रियाएँ" },
    ],
    healthImpacts: [
      { icon: <Stethoscope className="h-4 w-4" />, label: "Airway Inflammation", labelHi: "श्वसन मार्ग सूजन", type: "short" },
      { icon: <AlertTriangle className="h-4 w-4" />, label: "Worsens Asthma", labelHi: "अस्थमा बिगड़ना", type: "short" },
      { icon: <HeartPulse className="h-4 w-4" />, label: "Cardiovascular Risk", labelHi: "हृदय रोग जोखिम", type: "long" },
    ],
    funFact: "NO₂ creates the brownish haze visible over Delhi on winter mornings — a visible sign of traffic pollution.",
    funFactHi: "NO₂ सर्दियों की सुबह दिल्ली के ऊपर दिखने वाली भूरी धुंध बनाता है — ट्रैफिक प्रदूषण का दृश्य संकेत।",
  },
  {
    id: "o3",
    term: "O₃ (Ozone)",
    termHi: "O₃ (ओज़ोन)",
    icon: <Sun className="h-5 w-5" />,
    color: "hsl(50, 100%, 50%)",
    tagline: "Good up high, bad nearby",
    taglineHi: "ऊपर अच्छा, पास में बुरा",
    description: "Ground-level ozone forms when sunlight reacts with NO₂ and VOCs. Unlike the protective ozone layer high up, ground-level ozone is harmful.",
    descriptionHi: "जमीनी ओज़ोन तब बनता है जब सूर्य का प्रकाश NO₂ और VOC से प्रतिक्रिया करता है। ऊपरी सुरक्षात्मक ओज़ोन परत के विपरीत, जमीनी ओज़ोन हानिकारक है।",
    whoGuideline: "WHO 8-hr guideline: 100 µg/m³",
    whoGuidelineHi: "WHO 8-घंटे दिशानिर्देश: 100 µg/m³",
    sources: [
      { icon: <Sun className="h-4 w-4" />, label: "Sunlight + NOx", labelHi: "सूर्यप्रकाश + NOx", desc: "UV light triggers chemical reactions with traffic fumes", descHi: "UV प्रकाश ट्रैफिक धुएँ के साथ रासायनिक प्रतिक्रिया करता है" },
      { icon: <Factory className="h-4 w-4" />, label: "Industrial VOCs", labelHi: "औद्योगिक VOC", desc: "Volatile organic compounds from factories", descHi: "कारखानों से वाष्पशील कार्बनिक यौगिक" },
    ],
    healthImpacts: [
      { icon: <Stethoscope className="h-4 w-4" />, label: "Chest Pain & Cough", labelHi: "सीने में दर्द और खाँसी", type: "short" },
      { icon: <AlertTriangle className="h-4 w-4" />, label: "Breathing Difficulty", labelHi: "साँस लेने में कठिनाई", type: "short" },
      { icon: <Leaf className="h-4 w-4" />, label: "Crop Damage", labelHi: "फसल नुकसान", type: "long" },
    ],
    funFact: "Ozone peaks in summer afternoons — opposite to PM2.5 which peaks in winter mornings.",
    funFactHi: "ओज़ोन गर्मी की दोपहर में चरम पर होता है — PM2.5 के विपरीत जो सर्दियों की सुबह चरम पर होता है।",
  },
  {
    id: "co",
    term: "CO (Carbon Monoxide)",
    termHi: "CO (कार्बन मोनोऑक्साइड)",
    icon: <Skull className="h-5 w-5" />,
    color: "hsl(0, 0%, 60%)",
    tagline: "The silent poisoner",
    taglineHi: "मूक ज़हर",
    description: "A colourless, odourless gas from incomplete combustion. At high levels it reduces the blood's ability to carry oxygen, causing dizziness and headaches.",
    descriptionHi: "अपूर्ण दहन से निकलने वाली रंगहीन, गंधहीन गैस। उच्च स्तर पर रक्त की ऑक्सीजन वहन क्षमता कम करती है, जिससे चक्कर और सिरदर्द होता है।",
    sources: [
      { icon: <Car className="h-4 w-4" />, label: "Vehicle Engines", labelHi: "वाहन इंजन", desc: "Idling cars in traffic jams", descHi: "ट्रैफिक जाम में खड़ी गाड़ियाँ" },
      { icon: <Flame className="h-4 w-4" />, label: "Biomass Burning", labelHi: "बायोमास जलाना", desc: "Wood and dung cake fires", descHi: "लकड़ी और उपले की आग" },
      { icon: <Cigarette className="h-4 w-4" />, label: "Smoking", labelHi: "धूम्रपान", desc: "Cigarette and hookah smoke", descHi: "सिगरेट और हुक्का का धुआँ" },
    ],
    healthImpacts: [
      { icon: <Brain className="h-4 w-4" />, label: "Dizziness & Headache", labelHi: "चक्कर और सिरदर्द", type: "short" },
      { icon: <HeartPulse className="h-4 w-4" />, label: "Heart Strain", labelHi: "हृदय पर दबाव", type: "long" },
      { icon: <AlertTriangle className="h-4 w-4" />, label: "Nausea & Confusion", labelHi: "जी मिचलाना और भ्रम", type: "short" },
    ],
  },
  {
    id: "so2",
    term: "SO₂ (Sulphur Dioxide)",
    termHi: "SO₂ (सल्फर डाइऑक्साइड)",
    icon: <CloudRain className="h-5 w-5" />,
    color: "hsl(45, 90%, 50%)",
    tagline: "The acid rain maker",
    taglineHi: "अम्ल वर्षा बनाने वाला",
    description: "A sharp-smelling gas from burning fossil fuels containing sulphur. Irritates the respiratory system and contributes to acid rain.",
    descriptionHi: "सल्फर युक्त जीवाश्म ईंधन जलाने से निकलने वाली तीखी गंध वाली गैस। श्वसन तंत्र में जलन करती है और अम्ल वर्षा में योगदान करती है।",
    whoGuideline: "WHO 24-hr guideline: 40 µg/m³",
    whoGuidelineHi: "WHO 24-घंटे दिशानिर्देश: 40 µg/m³",
    sources: [
      { icon: <Zap className="h-4 w-4" />, label: "Coal Power Plants", labelHi: "कोयला बिजली संयंत्र", desc: "Burning high-sulphur coal for electricity", descHi: "बिजली के लिए उच्च-सल्फर कोयला जलाना" },
      { icon: <Factory className="h-4 w-4" />, label: "Oil Refineries", labelHi: "तेल शोधनागार", desc: "Crude oil processing releases SO₂", descHi: "कच्चे तेल के प्रसंस्करण से SO₂ निकलता है" },
      { icon: <Truck className="h-4 w-4" />, label: "Diesel Vehicles", labelHi: "डीज़ल वाहन", desc: "Old trucks with high-sulphur fuel", descHi: "उच्च-सल्फर ईंधन वाले पुराने ट्रक" },
    ],
    healthImpacts: [
      { icon: <Stethoscope className="h-4 w-4" />, label: "Airway Irritation", labelHi: "श्वसन मार्ग जलन", type: "short" },
      { icon: <AlertTriangle className="h-4 w-4" />, label: "Triggers Asthma", labelHi: "अस्थमा शुरू करना", type: "short" },
      { icon: <CloudRain className="h-4 w-4" />, label: "Acid Rain → Crops", labelHi: "अम्ल वर्षा → फसलें", type: "long" },
    ],
  },
];

const CONCEPTS: ConceptEntry[] = [
  {
    id: "aqi",
    term: "AQI (Air Quality Index)",
    termHi: "AQI (वायु गुणवत्ता सूचकांक)",
    icon: <Activity className="h-5 w-5" />,
    color: "hsl(180, 100%, 45%)",
    description: "A standardized scale from 0–500 that tells you how clean or polluted the air is.",
    descriptionHi: "0–500 का एक मानकीकृत पैमाना जो बताता है कि हवा कितनी साफ या प्रदूषित है।",
    details: "0–50 Good • 51–100 Moderate • 101–150 Unhealthy for Sensitive Groups • 151–200 Unhealthy • 201–300 Very Unhealthy • 301–500 Hazardous",
    detailsHi: "0–50 अच्छा • 51–100 मध्यम • 101–150 संवेदनशील समूहों के लिए अस्वास्थ्यकर • 151–200 अस्वास्थ्यकर • 201–300 बहुत अस्वास्थ्यकर • 301–500 खतरनाक",
  },
  {
    id: "dominant",
    term: "Dominant Pollutant",
    termHi: "प्रमुख प्रदूषक",
    icon: <TrendingUp className="h-5 w-5" />,
    color: "hsl(30, 100%, 55%)",
    description: "The single pollutant with the highest sub-index value that determines the overall AQI reading for a station.",
    descriptionHi: "वह एकल प्रदूषक जिसका सबसे अधिक उप-सूचकांक मान है और जो किसी स्टेशन की समग्र AQI रीडिंग निर्धारित करता है।",
  },
  {
    id: "grap",
    term: "GRAP (Graded Response Action Plan)",
    termHi: "GRAP (श्रेणीबद्ध कार्य योजना)",
    icon: <Shield className="h-5 w-5" />,
    color: "hsl(0, 85%, 55%)",
    description: "Delhi's emergency action plan that activates stricter measures as AQI worsens.",
    descriptionHi: "दिल्ली की आपातकालीन कार्य योजना जो AQI बिगड़ने पर सख्त उपाय सक्रिय करती है।",
    details: "Stage I (Poor 201–300): Ban open burning • Stage II (Very Poor 301–400): Restrict diesel generators • Stage III (Severe 401–450): Ban construction • Stage IV (Severe+ 450+): Close schools, restrict trucks",
    detailsHi: "चरण I (खराब 201–300): खुले में जलाना बंद • चरण II (बहुत खराब 301–400): डीज़ल जनरेटर प्रतिबंध • चरण III (गंभीर 401–450): निर्माण बंद • चरण IV (गंभीर+ 450+): स्कूल बंद, ट्रक प्रतिबंध",
  },
  {
    id: "inversion",
    term: "Temperature Inversion",
    termHi: "तापमान व्युत्क्रमण",
    icon: <Thermometer className="h-5 w-5" />,
    color: "hsl(200, 80%, 50%)",
    description: "A weather condition where warm air traps cool air near the ground, preventing pollutants from dispersing upward. Common in Delhi during winter.",
    descriptionHi: "एक मौसमी स्थिति जहाँ गर्म हवा ठंडी हवा को जमीन के पास फँसा लेती है, जिससे प्रदूषक ऊपर नहीं फैल पाते। दिल्ली में सर्दियों में आम।",
  },
  {
    id: "ward",
    term: "Ward",
    termHi: "वार्ड",
    icon: <Users className="h-5 w-5" />,
    color: "hsl(260, 80%, 60%)",
    description: "The smallest administrative division of Delhi's municipal area. Each ward has its own elected councillor.",
    descriptionHi: "दिल्ली नगरपालिका क्षेत्र का सबसे छोटा प्रशासनिक विभाग। प्रत्येक वार्ड का अपना निर्वाचित पार्षद होता है।",
  },
  {
    id: "interpolated",
    term: "Interpolated AQI",
    termHi: "अनुमानित AQI",
    icon: <Activity className="h-5 w-5" />,
    color: "hsl(145, 100%, 45%)",
    description: "An estimated AQI value for a ward calculated from the readings of nearby monitoring stations, weighted by distance.",
    descriptionHi: "निकटवर्ती मॉनिटरिंग स्टेशनों की रीडिंग से गणना किया गया वार्ड का अनुमानित AQI मान, दूरी के अनुसार भारित।",
  },
];

// AQI scale visual component
function AqiScaleBar() {
  const { lang } = useLanguage();
  const levels = [
    { range: "0–50", label: lang === "hi" ? "अच्छा" : "Good", color: "hsl(145, 100%, 45%)" },
    { range: "51–100", label: lang === "hi" ? "मध्यम" : "Moderate", color: "hsl(50, 100%, 50%)" },
    { range: "101–150", label: lang === "hi" ? "अस्वास्थ्यकर*" : "USG", color: "hsl(30, 100%, 55%)" },
    { range: "151–200", label: lang === "hi" ? "अस्वास्थ्यकर" : "Unhealthy", color: "hsl(0, 85%, 55%)" },
    { range: "201–300", label: lang === "hi" ? "बहुत खराब" : "V. Unhealthy", color: "hsl(280, 70%, 50%)" },
    { range: "301–500", label: lang === "hi" ? "खतरनाक" : "Hazardous", color: "hsl(0, 80%, 30%)" },
  ];
  return (
    <div className="flex w-full gap-0.5 rounded-lg overflow-hidden">
      {levels.map((l) => (
        <div key={l.range} className="flex-1 py-1.5 px-1 text-center" style={{ backgroundColor: l.color }}>
          <div className="font-mono text-[8px] font-bold text-background leading-tight">{l.label}</div>
          <div className="font-mono text-[7px] text-background/80">{l.range}</div>
        </div>
      ))}
    </div>
  );
}

// Size comparison visual
function SizeComparisonVisual() {
  const { lang } = useLanguage();
  return (
    <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
      <div className="flex items-end gap-2">
        <div className="flex flex-col items-center gap-1">
          <div className="h-10 w-[2px] rounded-full bg-muted-foreground/40" />
          <span className="font-mono text-[8px] text-muted-foreground">
            {lang === "hi" ? "बाल" : "Hair"}<br />50–70µm
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-end h-10 justify-center">
            <div className="h-3 w-3 rounded-full border-2 border-[hsl(30,100%,55%)] bg-[hsl(30,100%,55%,0.3)]" />
          </div>
          <span className="font-mono text-[8px] text-[hsl(30,100%,55%)]">
            PM10<br />&lt;10µm
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-end h-10 justify-center">
            <div className="h-1.5 w-1.5 rounded-full border border-[hsl(0,85%,55%)] bg-[hsl(0,85%,55%,0.5)]" />
          </div>
          <span className="font-mono text-[8px] text-[hsl(0,85%,55%)]">
            PM2.5<br />&lt;2.5µm
          </span>
        </div>
      </div>
      <div className="flex-1">
        <p className="font-body text-[10px] text-muted-foreground leading-relaxed">
          <Ruler className="inline h-3 w-3 mr-1 text-primary" />
          {lang === "hi"
            ? "PM2.5 मानव बाल से 30× पतला है और फेफड़ों को पार कर रक्त में प्रवेश कर सकता है"
            : "PM2.5 is 30× thinner than human hair and can pass through lungs into the bloodstream"}
        </p>
      </div>
    </div>
  );
}

// Pollutant card
function PollutantCard({ entry }: { entry: PollutantEntry }) {
  const [expanded, setExpanded] = useState(false);
  const { lang } = useLanguage();

  return (
    <motion.div
      layout
      className="rounded-xl border border-border bg-card/60 overflow-hidden transition-colors hover:bg-card/90"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${entry.color}20`, color: entry.color }}
        >
          {entry.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-xs font-bold text-foreground truncate">
            {lang === "hi" ? entry.termHi : entry.term}
          </h3>
          <p className="font-body text-[10px] italic" style={{ color: entry.color }}>
            {lang === "hi" ? entry.taglineHi : entry.tagline}
          </p>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-4 space-y-3">
              {/* Description */}
              <p className="font-body text-xs leading-relaxed text-secondary-foreground">
                {lang === "hi" ? entry.descriptionHi : entry.description}
              </p>

              {/* Size comparison for PM */}
              {entry.sizeComparison && (
                <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/30 px-3 py-2">
                  <Ruler className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {lang === "hi" ? entry.sizeComparisonHi : entry.sizeComparison}
                  </span>
                </div>
              )}

              {/* WHO guideline */}
              {entry.whoGuideline && (
                <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                  <Shield className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="font-mono text-[10px] font-semibold text-primary">
                    {lang === "hi" ? entry.whoGuidelineHi : entry.whoGuideline}
                  </span>
                </div>
              )}

              {/* Sources */}
              <div>
                <h4 className="font-display text-[10px] tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Factory className="h-3 w-3" />
                  {lang === "hi" ? "स्रोत" : "SOURCES"}
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {entry.sources.map((s) => (
                    <div key={s.label} className="flex items-start gap-2 rounded-lg bg-secondary/40 p-2">
                      <span className="mt-0.5 shrink-0" style={{ color: entry.color }}>{s.icon}</span>
                      <div>
                        <div className="font-body text-[10px] font-semibold text-foreground">
                          {lang === "hi" ? s.labelHi : s.label}
                        </div>
                        <div className="font-body text-[9px] text-muted-foreground leading-tight">
                          {lang === "hi" ? s.descHi : s.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Health impacts */}
              <div>
                <h4 className="font-display text-[10px] tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                  <HeartPulse className="h-3 w-3" />
                  {lang === "hi" ? "स्वास्थ्य प्रभाव" : "HEALTH IMPACTS"}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {entry.healthImpacts.map((h) => (
                    <div
                      key={h.label}
                      className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                      style={{
                        backgroundColor: h.type === "long" ? "hsl(0, 85%, 55%, 0.12)" : "hsl(30, 100%, 55%, 0.12)",
                        color: h.type === "long" ? "hsl(0, 85%, 65%)" : "hsl(30, 100%, 65%)",
                      }}
                    >
                      {h.icon}
                      <span className="font-body text-[9px] font-semibold">
                        {lang === "hi" ? h.labelHi : h.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(30, 100%, 55%, 0.4)" }} />
                    <span className="font-mono text-[8px] text-muted-foreground">{lang === "hi" ? "अल्पकालिक" : "Short-term"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(0, 85%, 55%, 0.4)" }} />
                    <span className="font-mono text-[8px] text-muted-foreground">{lang === "hi" ? "दीर्घकालिक" : "Long-term"}</span>
                  </div>
                </div>
              </div>

              {/* Fun fact */}
              {entry.funFact && (
                <div className="flex items-start gap-2 rounded-lg border border-accent/20 bg-accent/5 p-2.5">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-accent" />
                  <p className="font-body text-[10px] leading-relaxed text-accent-foreground/80">
                    {lang === "hi" ? entry.funFactHi : entry.funFact}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Concept card
function ConceptCard({ entry }: { entry: ConceptEntry }) {
  const [expanded, setExpanded] = useState(false);
  const { lang } = useLanguage();
  const hasDetails = !!entry.details;

  return (
    <div className="rounded-xl border border-border bg-card/60 overflow-hidden transition-colors hover:bg-card/90">
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${entry.color}20`, color: entry.color }}
        >
          {entry.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-[11px] font-bold text-foreground">
            {lang === "hi" ? entry.termHi : entry.term}
          </h3>
          <p className="font-body text-[10px] text-secondary-foreground leading-relaxed mt-0.5">
            {lang === "hi" ? entry.descriptionHi : entry.description}
          </p>
        </div>
        {hasDetails && (
          <motion.div animate={{ rotate: expanded ? 90 : 0 }}>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </motion.div>
        )}
      </button>
      <AnimatePresence>
        {expanded && entry.details && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 ml-11">
              <div className="rounded-lg bg-secondary/40 p-2.5">
                <p className="font-mono text-[9px] leading-relaxed text-muted-foreground">
                  {lang === "hi" ? entry.detailsHi : entry.details}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DictionaryTab() {
  const { t, lang } = useLanguage();

  return (
    <div>
      <div className="space-y-5 p-4 pb-20 sm:pb-16">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-display text-sm font-bold tracking-widest text-primary">
              {t("dict.title")}
            </h2>
          </div>
          <p className="mt-1 font-body text-xs text-muted-foreground">
            {lang === "hi"
              ? "हर प्रदूषक को समझें — स्रोत, स्वास्थ्य प्रभाव और WHO दिशानिर्देश"
              : "Understand every pollutant — sources, health impacts & WHO guidelines"}
          </p>
        </div>

        {/* AQI Scale */}
        <div>
          <h3 className="font-display text-[10px] tracking-widest text-muted-foreground mb-2">
            {lang === "hi" ? "AQI पैमाना" : "AQI SCALE"}
          </h3>
          <AqiScaleBar />
        </div>

        {/* Size comparison */}
        <SizeComparisonVisual />

        {/* Pollutants */}
        <div>
          <h3 className="font-display text-[10px] tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3" />
            {lang === "hi" ? "प्रदूषक" : "POLLUTANTS"}
          </h3>
          <div className="space-y-2">
            {POLLUTANTS.map((p) => (
              <PollutantCard key={p.id} entry={p} />
            ))}
          </div>
        </div>

        {/* Concepts */}
        <div>
          <h3 className="font-display text-[10px] tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
            <BookOpen className="h-3 w-3" />
            {lang === "hi" ? "अवधारणाएँ और शब्दावली" : "CONCEPTS & TERMINOLOGY"}
          </h3>
          <div className="space-y-2">
            {CONCEPTS.map((c) => (
              <ConceptCard key={c.id} entry={c} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
