/**
 * Special zones in Delhi that fall outside municipal ward boundaries.
 * These include the airport, cantonment, Yamuna riverbed, Delhi Ridge, and Central Vista.
 * Each zone has approximate polygon coords and a centroid for AQI data fetching.
 */

export interface SpecialZone {
  id: string;
  name: string;
  name_hi: string;
  emoji: string;
  description: string;
  centroid: [number, number]; // [lon, lat] — same format as ward centroids
  polygon: [number, number][]; // [lat, lon] pairs for Leaflet
}

export const DELHI_SPECIAL_ZONES: SpecialZone[] = [
  {
    id: "igi-airport",
    name: "IGI Airport Zone",
    name_hi: "IGI हवाई अड्डा क्षेत्र",
    emoji: "✈️",
    description: "Indira Gandhi International Airport & surrounding restricted area",
    centroid: [77.1000, 28.5562],
    polygon: [
      [28.575, 77.070], [28.575, 77.130], [28.555, 77.130],
      [28.540, 77.120], [28.535, 77.100], [28.540, 77.075],
      [28.555, 77.065], [28.575, 77.070],
    ],
  },
  {
    id: "delhi-cantonment",
    name: "Delhi Cantonment",
    name_hi: "दिल्ली छावनी",
    emoji: "🪖",
    description: "Delhi Cantonment Board area — military jurisdiction",
    centroid: [77.1500, 28.5900],
    polygon: [
      [28.605, 77.130], [28.605, 77.170], [28.585, 77.175],
      [28.575, 77.165], [28.575, 77.135], [28.585, 77.125],
      [28.605, 77.130],
    ],
  },
  {
    id: "yamuna-riverbed",
    name: "Yamuna Floodplain",
    name_hi: "यमुना बाढ़ का मैदान",
    emoji: "🏞️",
    description: "Yamuna riverbed and floodplain — no municipal wards",
    centroid: [77.2600, 28.6600],
    polygon: [
      [28.720, 77.245], [28.730, 77.260], [28.710, 77.280],
      [28.680, 77.290], [28.650, 77.285], [28.630, 77.275],
      [28.610, 77.270], [28.600, 77.260], [28.605, 77.245],
      [28.620, 77.240], [28.650, 77.235], [28.680, 77.238],
      [28.700, 77.240], [28.720, 77.245],
    ],
  },
  {
    id: "central-vista",
    name: "Central Vista / NDMC",
    name_hi: "सेंट्रल विस्टा / NDMC",
    emoji: "🏛️",
    description: "New Delhi Municipal Council — Rashtrapati Bhavan, Parliament, India Gate",
    centroid: [77.2100, 28.6150],
    polygon: [
      [28.635, 77.190], [28.635, 77.230], [28.620, 77.240],
      [28.600, 77.235], [28.595, 77.215], [28.600, 77.195],
      [28.615, 77.185], [28.635, 77.190],
    ],
  },
  {
    id: "delhi-ridge",
    name: "Delhi Ridge (Forest)",
    name_hi: "दिल्ली रिज (वन)",
    emoji: "🌲",
    description: "Northern & Southern Ridge — protected forest area",
    centroid: [77.1700, 28.6950],
    polygon: [
      [28.720, 77.155], [28.720, 77.185], [28.705, 77.190],
      [28.690, 77.185], [28.680, 77.175], [28.675, 77.160],
      [28.680, 77.150], [28.695, 77.145], [28.710, 77.148],
      [28.720, 77.155],
    ],
  },
];
