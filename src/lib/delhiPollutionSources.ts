// Major known pollution sources in Delhi NCR
export interface PollutionSource {
  id: string;
  name: string;
  type: "factory" | "industrial" | "traffic" | "waste" | "construction" | "power";
  lat: number;
  lon: number;
  emoji: string;
  description: string;
}

export const DELHI_POLLUTION_SOURCES: PollutionSource[] = [
  // Industrial Areas
  { id: "okhla-ind", name: "Okhla Industrial Area", type: "industrial", lat: 28.5308, lon: 77.2710, emoji: "🏭", description: "Major industrial zone with numerous factories" },
  { id: "wazirpur-ind", name: "Wazirpur Industrial Area", type: "industrial", lat: 28.6980, lon: 77.1660, emoji: "🏭", description: "Metal & steel processing hub" },
  { id: "naraina-ind", name: "Naraina Industrial Area", type: "industrial", lat: 28.6290, lon: 77.1370, emoji: "🏭", description: "Mixed industrial zone" },
  { id: "mayapuri-ind", name: "Mayapuri Industrial Area", type: "industrial", lat: 28.6270, lon: 77.1150, emoji: "🏭", description: "Recycling & metal scrap processing" },
  { id: "bawana-ind", name: "Bawana Industrial Area", type: "industrial", lat: 28.7950, lon: 77.0520, emoji: "🏭", description: "Relocated industries from old Delhi" },
  { id: "patparganj-ind", name: "Patparganj Industrial Area", type: "industrial", lat: 28.6250, lon: 77.3050, emoji: "🏭", description: "Electronics & manufacturing hub" },
  { id: "gtkarnal-ind", name: "GT Karnal Road Industrial", type: "industrial", lat: 28.7350, lon: 77.1730, emoji: "🏭", description: "Heavy manufacturing corridor" },
  { id: "lawrence-ind", name: "Lawrence Road Industrial", type: "industrial", lat: 28.6810, lon: 77.1340, emoji: "🏭", description: "Small-scale industries" },
  { id: "jhilmil-ind", name: "Jhilmil Industrial Area", type: "industrial", lat: 28.6730, lon: 77.3130, emoji: "🏭", description: "Chemical & textile units" },
  { id: "badli-ind", name: "Badli Industrial Area", type: "industrial", lat: 28.7370, lon: 77.1330, emoji: "🏭", description: "Auto parts & engineering" },

  // Major Traffic Hotspots
  { id: "ito-traffic", name: "ITO Junction", type: "traffic", lat: 28.6295, lon: 77.2413, emoji: "🚗", description: "Heaviest traffic intersection in Delhi" },
  { id: "ashram-traffic", name: "Ashram Chowk", type: "traffic", lat: 28.5700, lon: 77.2500, emoji: "🚗", description: "Major traffic bottleneck" },
  { id: "karolbagh-traffic", name: "Karol Bagh Ring Road", type: "traffic", lat: 28.6519, lon: 77.1907, emoji: "🚗", description: "Congested commercial zone" },
  { id: "anandvihar-isbt", name: "Anand Vihar ISBT", type: "traffic", lat: 28.6468, lon: 77.3152, emoji: "🚌", description: "Bus terminus with heavy diesel emissions" },

  // Thermal Power
  { id: "badarpur-power", name: "Badarpur Power Plant (Decom.)", type: "power", lat: 28.5060, lon: 77.3040, emoji: "⚡", description: "Decommissioned coal power plant area" },
  { id: "rajghat-power", name: "Rajghat Power Station", type: "power", lat: 28.6460, lon: 77.2490, emoji: "⚡", description: "Gas-based power station" },

  // Waste Sites
  { id: "ghazipur-landfill", name: "Ghazipur Landfill", type: "waste", lat: 28.6210, lon: 77.3260, emoji: "🗑️", description: "Massive waste dump, frequent fires" },
  { id: "bhalswa-landfill", name: "Bhalswa Landfill", type: "waste", lat: 28.7390, lon: 77.1610, emoji: "🗑️", description: "Overflowing landfill, methane emissions" },
  { id: "okhla-landfill", name: "Okhla Landfill", type: "waste", lat: 28.5420, lon: 77.2690, emoji: "🗑️", description: "Waste-to-energy & open dump" },

  // Construction Zones
  { id: "dwarkaexp", name: "Dwarka Expressway", type: "construction", lat: 28.5900, lon: 77.0400, emoji: "🏗️", description: "Ongoing highway & metro construction" },
  { id: "pragati-maidan", name: "Pragati Maidan Redevelopment", type: "construction", lat: 28.6180, lon: 77.2430, emoji: "🏗️", description: "Massive redevelopment project" },
];

export function getSourceTypeColor(type: PollutionSource["type"]): string {
  switch (type) {
    case "factory": return "#FF6B35";
    case "industrial": return "#FF3D3D";
    case "traffic": return "#FFD600";
    case "waste": return "#C62BFF";
    case "construction": return "#FF8C00";
    case "power": return "#00B4D8";
    default: return "#888";
  }
}
