import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  BookOpen, Wind, Thermometer, Activity, Shield, AlertTriangle,
  TrendingUp, Factory, Users, ChevronDown,
  Droplets, Eye, HeartPulse, Brain, Baby,
  Car, Flame, Building2, Leaf, Truck, Cigarette,
  Ruler, Info, Skull, Zap, CloudRain, Sun, Stethoscope,
  Gauge, Microscope, ShieldAlert, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────

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
  gradient: string;
  tagline: string;
  taglineHi: string;
  description: string;
  descriptionHi: string;
  sizeComparison?: string;
  sizeComparisonHi?: string;
  whoGuideline?: string;
  whoGuidelineHi?: string;
  whoValue?: number;
  delhiAvg?: number;
  unit?: string;
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

// ─── Data ────────────────────────────────────────────────────────

const POLLUTANTS: PollutantEntry[] = [
  {
    id: "pm25",
    term: "PM2.5",
    termHi: "PM2.5 (सूक्ष्म कण)",
    icon: <Wind className="h-5 w-5" />,
    color: "hsl(0, 85%, 55%)",
    gradient: "linear-gradient(135deg, hsl(0,85%,55%), hsl(0,85%,40%))",
    tagline: "The invisible killer",
    taglineHi: "अदृश्य हत्यारा",
    description: "Particulate Matter smaller than 2.5 micrometres — about 30× thinner than a human hair. These tiny particles penetrate deep into lungs and even enter the bloodstream.",
    descriptionHi: "2.5 माइक्रोमीटर से छोटे कण — मानव बाल से लगभग 30 गुना पतले। ये सूक्ष्म कण फेफड़ों में गहराई तक प्रवेश करते हैं और रक्तप्रवाह में भी पहुँच जाते हैं।",
    sizeComparison: "30× thinner than human hair • Can pass through lungs into blood",
    sizeComparisonHi: "मानव बाल से 30 गुना पतले • फेफड़ों से रक्त में जा सकते हैं",
    whoGuideline: "WHO 24-hr: 15 µg/m³",
    whoGuidelineHi: "WHO 24-घंटे: 15 µg/m³",
    whoValue: 15,
    delhiAvg: 180,
    unit: "µg/m³",
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
    gradient: "linear-gradient(135deg, hsl(30,100%,55%), hsl(30,100%,40%))",
    tagline: "Dust you can almost see",
    taglineHi: "धूल जो लगभग दिखती है",
    description: "Particulate Matter smaller than 10 micrometres. Includes dust, pollen, and mould spores. Can irritate eyes, nose and throat.",
    descriptionHi: "10 माइक्रोमीटर से छोटे कण। इसमें धूल, पराग और फफूंद बीजाणु शामिल हैं। आँखों, नाक और गले में जलन कर सकते हैं।",
    sizeComparison: "1/5 to 1/7 the size of human hair • Settles in upper airways",
    sizeComparisonHi: "मानव बाल का 1/5 से 1/7 आकार • ऊपरी श्वसन मार्ग में जमता है",
    whoGuideline: "WHO 24-hr: 45 µg/m³",
    whoGuidelineHi: "WHO 24-घंटे: 45 µg/m³",
    whoValue: 45,
    delhiAvg: 280,
    unit: "µg/m³",
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
    gradient: "linear-gradient(135deg, hsl(280,70%,50%), hsl(280,70%,35%))",
    tagline: "The traffic gas",
    taglineHi: "ट्रैफिक की गैस",
    description: "A reddish-brown gas produced by vehicle engines and power plants. Irritates airways, worsens asthma, and contributes to smog and acid rain.",
    descriptionHi: "वाहन इंजन और बिजली संयंत्रों से उत्पन्न लालिमा-भूरी गैस। श्वसन मार्ग में जलन करती है, अस्थमा बिगाड़ती है, और धुंध व अम्ल वर्षा में योगदान करती है।",
    whoGuideline: "WHO 24-hr: 25 µg/m³",
    whoGuidelineHi: "WHO 24-घंटे: 25 µg/m³",
    whoValue: 25,
    delhiAvg: 65,
    unit: "µg/m³",
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
    gradient: "linear-gradient(135deg, hsl(50,100%,50%), hsl(50,100%,35%))",
    tagline: "Good up high, bad nearby",
    taglineHi: "ऊपर अच्छा, पास में बुरा",
    description: "Ground-level ozone forms when sunlight reacts with NO₂ and VOCs. Unlike the protective ozone layer high up, ground-level ozone is harmful.",
    descriptionHi: "जमीनी ओज़ोन तब बनता है जब सूर्य का प्रकाश NO₂ और VOC से प्रतिक्रिया करता है। ऊपरी सुरक्षात्मक ओज़ोन परत के विपरीत, जमीनी ओज़ोन हानिकारक है।",
    whoGuideline: "WHO 8-hr: 100 µg/m³",
    whoGuidelineHi: "WHO 8-घंटे: 100 µg/m³",
    whoValue: 100,
    delhiAvg: 85,
    unit: "µg/m³",
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
    gradient: "linear-gradient(135deg, hsl(0,0%,60%), hsl(0,0%,40%))",
    tagline: "The silent poisoner",
    taglineHi: "मूक ज़हर",
    description: "A colourless, odourless gas from incomplete combustion. At high levels it reduces the blood's ability to carry oxygen, causing dizziness and headaches.",
    descriptionHi: "अपूर्ण दहन से निकलने वाली रंगहीन, गंधहीन गैस। उच्च स्तर पर रक्त की ऑक्सीजन वहन क्षमता कम करती है, जिससे चक्कर और सिरदर्द होता है।",
    whoValue: 4,
    delhiAvg: 2.5,
    unit: "mg/m³",
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
    gradient: "linear-gradient(135deg, hsl(45,90%,50%), hsl(45,90%,35%))",
    tagline: "The acid rain maker",
    taglineHi: "अम्ल वर्षा बनाने वाला",
    description: "A sharp-smelling gas from burning fossil fuels containing sulphur. Irritates the respiratory system and contributes to acid rain.",
    descriptionHi: "सल्फर युक्त जीवाश्म ईंधन जलाने से निकलने वाली तीखी गंध वाली गैस। श्वसन तंत्र में जलन करती है और अम्ल वर्षा में योगदान करती है।",
    whoGuideline: "WHO 24-hr: 40 µg/m³",
    whoGuidelineHi: "WHO 24-घंटे: 40 µg/m³",
    whoValue: 40,
    delhiAvg: 18,
    unit: "µg/m³",
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

// ─── AQI Scale Bar (Enhanced) ────────────────────────────────────

function AqiScaleBar() {
  const { lang } = useLanguage();
  const levels = [
    { range: "0–50", label: lang === "hi" ? "अच्छा" : "Good", color: "hsl(145, 100%, 45%)", emoji: "🟢" },
    { range: "51–100", label: lang === "hi" ? "मध्यम" : "Moderate", color: "hsl(50, 100%, 50%)", emoji: "🟡" },
    { range: "101–150", label: lang === "hi" ? "USG" : "USG", color: "hsl(30, 100%, 55%)", emoji: "🟠" },
    { range: "151–200", label: lang === "hi" ? "खराब" : "Unhealthy", color: "hsl(0, 85%, 55%)", emoji: "🔴" },
    { range: "201–300", label: lang === "hi" ? "बहुत खराब" : "V.Unhealthy", color: "hsl(280, 70%, 50%)", emoji: "🟣" },
    { range: "301–500", label: lang === "hi" ? "खतरनाक" : "Hazardous", color: "hsl(0, 80%, 30%)", emoji: "🟤" },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card/80 p-3 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 mb-3">
        <Gauge className="h-4 w-4 text-primary" />
        <span className="font-display text-[10px] tracking-widest text-primary uppercase">
          {lang === "hi" ? "AQI पैमाना" : "AQI Scale"}
        </span>
      </div>
      <div className="flex w-full gap-[2px] rounded-lg overflow-hidden">
        {levels.map((l, i) => (
          <motion.div
            key={l.range}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="flex-1 py-2 px-0.5 text-center origin-left"
            style={{ backgroundColor: l.color }}
          >
            <div className="text-[9px] mb-0.5">{l.emoji}</div>
            <div className="font-display text-[7px] font-bold text-background leading-tight">{l.label}</div>
            <div className="font-mono text-[7px] text-background/70 mt-0.5">{l.range}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── WHO Comparison Bar ──────────────────────────────────────────

function WHOComparisonBar({ whoValue, delhiAvg, unit, color, lang }: {
  whoValue: number;
  delhiAvg: number;
  unit: string;
  color: string;
  lang: string;
}) {
  const maxVal = Math.max(whoValue, delhiAvg) * 1.2;
  const whoPercent = (whoValue / maxVal) * 100;
  const delhiPercent = (delhiAvg / maxVal) * 100;
  const exceeds = delhiAvg > whoValue;
  const multiplier = (delhiAvg / whoValue).toFixed(1);

  return (
    <div className="rounded-lg border border-border/50 bg-secondary/20 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-display text-[9px] tracking-wider text-muted-foreground uppercase">
          {lang === "hi" ? "WHO vs दिल्ली औसत" : "WHO vs Delhi Avg"}
        </span>
        {exceeds && (
          <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{
            backgroundColor: `${color}20`,
            color: color
          }}>
            {multiplier}× {lang === "hi" ? "अधिक" : "over"}
          </span>
        )}
      </div>
      {/* WHO bar */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[8px] text-muted-foreground w-12 shrink-0">WHO</span>
          <div className="flex-1 h-2.5 rounded-full bg-secondary/60 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${whoPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: "hsl(var(--primary))" }}
            />
          </div>
          <span className="font-mono text-[8px] text-primary w-14 text-right shrink-0">{whoValue} {unit}</span>
        </div>
        {/* Delhi bar */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[8px] text-muted-foreground w-12 shrink-0">
            {lang === "hi" ? "दिल्ली" : "Delhi"}
          </span>
          <div className="flex-1 h-2.5 rounded-full bg-secondary/60 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(delhiPercent, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
            />
          </div>
          <span className="font-mono text-[8px] font-bold w-14 text-right shrink-0" style={{ color }}>
            {delhiAvg} {unit}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Size Comparison Visual (Enhanced) ───────────────────────────

function SizeComparisonVisual() {
  const { lang } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-xl border border-border bg-card/80 p-4 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 mb-3">
        <Microscope className="h-4 w-4 text-primary" />
        <span className="font-display text-[10px] tracking-widest text-primary uppercase">
          {lang === "hi" ? "आकार तुलना" : "Size Comparison"}
        </span>
      </div>

      <div className="flex items-end justify-center gap-6 py-3">
        {/* Hair */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="relative h-16 w-[3px] rounded-full bg-gradient-to-b from-muted-foreground/60 to-muted-foreground/20" />
          <div className="text-center">
            <div className="font-display text-[9px] font-bold text-foreground">
              {lang === "hi" ? "बाल" : "Hair"}
            </div>
            <div className="font-mono text-[8px] text-muted-foreground">50–70µm</div>
          </div>
        </motion.div>

        {/* PM10 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="flex items-end h-16 justify-center">
            <div className="h-5 w-5 rounded-full border-2 shadow-lg"
              style={{
                borderColor: "hsl(30,100%,55%)",
                backgroundColor: "hsl(30,100%,55%,0.2)",
                boxShadow: "0 0 12px hsl(30,100%,55%,0.3)"
              }}
            />
          </div>
          <div className="text-center">
            <div className="font-display text-[9px] font-bold" style={{ color: "hsl(30,100%,55%)" }}>PM10</div>
            <div className="font-mono text-[8px] text-muted-foreground">&lt;10µm</div>
          </div>
        </motion.div>

        {/* PM2.5 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="flex items-end h-16 justify-center">
            <div className="h-2 w-2 rounded-full border shadow-lg"
              style={{
                borderColor: "hsl(0,85%,55%)",
                backgroundColor: "hsl(0,85%,55%,0.4)",
                boxShadow: "0 0 10px hsl(0,85%,55%,0.4)"
              }}
            />
          </div>
          <div className="text-center">
            <div className="font-display text-[9px] font-bold" style={{ color: "hsl(0,85%,55%)" }}>PM2.5</div>
            <div className="font-mono text-[8px] text-muted-foreground">&lt;2.5µm</div>
          </div>
        </motion.div>
      </div>

      <div className="mt-2 rounded-lg bg-secondary/30 px-3 py-2 flex items-start gap-2">
        <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5 text-destructive" />
        <p className="font-body text-[10px] leading-relaxed text-muted-foreground">
          {lang === "hi"
            ? "PM2.5 इतना सूक्ष्म है कि यह फेफड़ों की दीवारों को पार करके सीधे रक्तप्रवाह में प्रवेश कर सकता है, जिससे हृदय और मस्तिष्क प्रभावित होते हैं।"
            : "PM2.5 is so tiny it can cross lung walls directly into the bloodstream, affecting the heart and brain."}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Pollutant Card (Premium) ────────────────────────────────────

function PollutantCard({ entry, index }: { entry: PollutantEntry; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { lang } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      layout
      className="rounded-xl border border-border overflow-hidden group"
      style={{
        background: expanded
          ? `linear-gradient(180deg, ${entry.color}08 0%, transparent 40%)`
          : undefined,
      }}
    >
      {/* Header with gradient accent */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3.5 text-left transition-colors hover:bg-card/60"
      >
        {/* Icon with gradient bg */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-lg"
          style={{
            background: entry.gradient,
            color: "hsl(var(--background))",
          }}
        >
          {entry.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-xs font-bold text-foreground truncate">
              {lang === "hi" ? entry.termHi : entry.term}
            </h3>
          </div>
          <p className="font-body text-[10px] italic mt-0.5" style={{ color: entry.color }}>
            "{lang === "hi" ? entry.taglineHi : entry.tagline}"
          </p>
        </div>
        {/* Severity dot */}
        {entry.delhiAvg && entry.whoValue && entry.delhiAvg > entry.whoValue && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 mr-1">
            <div className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
            <span className="font-mono text-[8px] text-destructive font-bold">
              {(entry.delhiAvg / entry.whoValue).toFixed(0)}×
            </span>
          </div>
        )}
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
            <div className="px-3.5 pb-4 space-y-3">
              {/* Description */}
              <p className="font-body text-[11px] leading-relaxed text-secondary-foreground">
                {lang === "hi" ? entry.descriptionHi : entry.description}
              </p>

              {/* WHO vs Delhi comparison bar */}
              {entry.whoValue && entry.delhiAvg && (
                <WHOComparisonBar
                  whoValue={entry.whoValue}
                  delhiAvg={entry.delhiAvg}
                  unit={entry.unit || "µg/m³"}
                  color={entry.color}
                  lang={lang}
                />
              )}

              {/* Size comparison for PM */}
              {entry.sizeComparison && (
                <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/30 px-3 py-2.5">
                  <Ruler className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {lang === "hi" ? entry.sizeComparisonHi : entry.sizeComparison}
                  </span>
                </div>
              )}

              {/* Sources */}
              <div>
                <h4 className="font-display text-[10px] tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Factory className="h-3 w-3" />
                  {lang === "hi" ? "प्रमुख स्रोत" : "KEY SOURCES"}
                </h4>
                <div className="space-y-1.5">
                  {entry.sources.map((s, i) => (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-2.5 rounded-lg bg-secondary/30 p-2.5 border border-border/30"
                    >
                      <span className="mt-0.5 shrink-0 p-1 rounded-md" style={{
                        color: entry.color,
                        backgroundColor: `${entry.color}15`,
                      }}>
                        {s.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-body text-[10px] font-semibold text-foreground">
                          {lang === "hi" ? s.labelHi : s.label}
                        </div>
                        <div className="font-body text-[9px] text-muted-foreground leading-snug mt-0.5">
                          {lang === "hi" ? s.descHi : s.desc}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Health impacts */}
              <div>
                <h4 className="font-display text-[10px] tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                  <HeartPulse className="h-3 w-3" />
                  {lang === "hi" ? "स्वास्थ्य प्रभाव" : "HEALTH IMPACTS"}
                </h4>
                {/* Legend */}
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "hsl(30, 100%, 55%)" }} />
                    <span className="font-mono text-[8px] text-muted-foreground">{lang === "hi" ? "अल्पकालिक" : "Short-term"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "hsl(0, 85%, 55%)" }} />
                    <span className="font-mono text-[8px] text-muted-foreground">{lang === "hi" ? "दीर्घकालिक" : "Long-term"}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {entry.healthImpacts.map((h) => (
                    <div
                      key={h.label}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border"
                      style={{
                        backgroundColor: h.type === "long" ? "hsl(0, 85%, 55%, 0.08)" : "hsl(30, 100%, 55%, 0.08)",
                        borderColor: h.type === "long" ? "hsl(0, 85%, 55%, 0.2)" : "hsl(30, 100%, 55%, 0.2)",
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
              </div>

              {/* Fun fact */}
              {entry.funFact && (
                <div className="flex items-start gap-2.5 rounded-xl border border-accent/20 bg-accent/5 p-3">
                  <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-accent" />
                  <div>
                    <div className="font-display text-[8px] tracking-wider text-accent mb-1 uppercase">
                      {lang === "hi" ? "क्या आप जानते हैं?" : "Did You Know?"}
                    </div>
                    <p className="font-body text-[10px] leading-relaxed text-accent-foreground/80">
                      {lang === "hi" ? entry.funFactHi : entry.funFact}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Concept Card (Enhanced) ─────────────────────────────────────

function ConceptCard({ entry, index }: { entry: ConceptEntry; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { lang } = useLanguage();
  const hasDetails = !!entry.details;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl border border-border overflow-hidden transition-colors hover:bg-card/60"
    >
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3.5 text-left"
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${entry.color}15`, color: entry.color }}
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
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
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
            <div className="px-3.5 pb-3.5 ml-12">
              <div className="rounded-lg bg-secondary/30 border border-border/30 p-3">
                <p className="font-mono text-[9px] leading-relaxed text-muted-foreground">
                  {lang === "hi" ? entry.detailsHi : entry.details}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── GRAP Stages Visual ──────────────────────────────────────────

function GRAPStagesVisual() {
  const { lang } = useLanguage();
  const stages = [
    { stage: "I", aqi: "201–300", label: lang === "hi" ? "खराब" : "Poor", color: "hsl(30, 100%, 55%)", action: lang === "hi" ? "खुले में जलाना बंद" : "Ban open burning" },
    { stage: "II", aqi: "301–400", label: lang === "hi" ? "बहुत खराब" : "V. Poor", color: "hsl(0, 85%, 55%)", action: lang === "hi" ? "डीज़ल जनरेटर प्रतिबंध" : "Restrict diesel generators" },
    { stage: "III", aqi: "401–450", label: lang === "hi" ? "गंभीर" : "Severe", color: "hsl(280, 70%, 50%)", action: lang === "hi" ? "निर्माण कार्य बंद" : "Ban construction" },
    { stage: "IV", aqi: "450+", label: lang === "hi" ? "गंभीर+" : "Severe+", color: "hsl(0, 80%, 30%)", action: lang === "hi" ? "स्कूल बंद, ट्रक प्रतिबंध" : "Close schools, ban trucks" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-xl border border-border bg-card/80 p-4 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert className="h-4 w-4 text-destructive" />
        <span className="font-display text-[10px] tracking-widest text-destructive uppercase">
          {lang === "hi" ? "GRAP चरण" : "GRAP Stages"}
        </span>
      </div>
      <div className="space-y-1.5">
        {stages.map((s, i) => (
          <motion.div
            key={s.stage}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className="flex items-center gap-2.5 rounded-lg p-2 border border-border/30"
            style={{ backgroundColor: `${s.color}08` }}
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-display text-[10px] font-black"
              style={{ backgroundColor: s.color, color: "hsl(var(--background))" }}
            >
              {s.stage}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] font-bold" style={{ color: s.color }}>{s.label}</span>
                <span className="font-mono text-[8px] text-muted-foreground">AQI {s.aqi}</span>
              </div>
              <div className="font-body text-[9px] text-secondary-foreground mt-0.5">{s.action}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Section Tab Toggle ──────────────────────────────────────────

function SectionTabs({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const { lang } = useLanguage();
  const tabs = [
    { id: "pollutants", label: lang === "hi" ? "प्रदूषक" : "Pollutants", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    { id: "concepts", label: lang === "hi" ? "अवधारणाएँ" : "Concepts", icon: <BookOpen className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="flex gap-1.5 p-1 rounded-xl bg-secondary/40 border border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-display text-[10px] tracking-wider transition-all ${
            activeTab === tab.id
              ? "bg-primary text-primary-foreground shadow-lg"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main Dictionary Tab ─────────────────────────────────────────

export function DictionaryTab() {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState("pollutants");

  return (
    <div>
      <div className="space-y-4 p-4 pb-20 sm:pb-16">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/5 p-4"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-display text-sm font-bold tracking-wider text-foreground">
                  {t("dict.title")}
                </h2>
                <p className="font-body text-[10px] text-muted-foreground mt-0.5">
                  {lang === "hi"
                    ? "प्रदूषकों की विस्तृत जानकारी — स्रोत, प्रभाव और WHO मानक"
                    : "Complete pollutant guide — sources, impacts & WHO standards"}
                </p>
              </div>
            </div>
          </div>
          {/* Decorative */}
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-primary/5 blur-2xl" />
          <div className="absolute -bottom-6 -left-6 h-16 w-16 rounded-full bg-accent/5 blur-2xl" />
        </motion.div>

        {/* AQI Scale */}
        <AqiScaleBar />

        {/* Size Comparison */}
        <SizeComparisonVisual />

        {/* GRAP Stages */}
        <GRAPStagesVisual />

        {/* Section Tabs */}
        <SectionTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Pollutants Section */}
        <AnimatePresence mode="wait">
          {activeTab === "pollutants" && (
            <motion.div
              key="pollutants"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="space-y-2.5"
            >
              {POLLUTANTS.map((p, i) => (
                <PollutantCard key={p.id} entry={p} index={i} />
              ))}
            </motion.div>
          )}

          {activeTab === "concepts" && (
            <motion.div
              key="concepts"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="space-y-2"
            >
              {CONCEPTS.map((c, i) => (
                <ConceptCard key={c.id} entry={c} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
