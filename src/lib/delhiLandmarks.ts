export interface DelhiLandmark {
  name: string;
  lat: number;
  lon: number;
  emoji: string;
  type: "monument" | "transport" | "govt" | "religious" | "park" | "market";
}

export const DELHI_LANDMARKS: DelhiLandmark[] = [
  // Transport
  { name: "IGI Airport", lat: 28.5562, lon: 77.1000, emoji: "✈️", type: "transport" },
  { name: "New Delhi Rly", lat: 28.6424, lon: 77.2197, emoji: "🚆", type: "transport" },
  { name: "Old Delhi Rly", lat: 28.6618, lon: 77.2283, emoji: "🚂", type: "transport" },
  { name: "ISBT Kashmere Gate", lat: 28.6675, lon: 77.2280, emoji: "🚌", type: "transport" },

  // Monuments & Tourist
  { name: "India Gate", lat: 28.6129, lon: 77.2295, emoji: "🏛️", type: "monument" },
  { name: "Red Fort", lat: 28.6562, lon: 77.2410, emoji: "🏰", type: "monument" },
  { name: "Qutub Minar", lat: 28.5245, lon: 77.1855, emoji: "🗼", type: "monument" },
  { name: "Humayun's Tomb", lat: 28.5933, lon: 77.2507, emoji: "🕌", type: "monument" },
  { name: "Lotus Temple", lat: 28.5535, lon: 77.2588, emoji: "🪷", type: "religious" },
  { name: "Jama Masjid", lat: 28.6507, lon: 77.2334, emoji: "🕌", type: "religious" },
  { name: "Akshardham", lat: 28.6127, lon: 77.2773, emoji: "🛕", type: "religious" },
  { name: "Gurudwara Bangla Sahib", lat: 28.6264, lon: 77.2091, emoji: "🙏", type: "religious" },

  // Govt
  { name: "Rashtrapati Bhavan", lat: 28.6143, lon: 77.1994, emoji: "🏛️", type: "govt" },
  { name: "Parliament", lat: 28.6175, lon: 77.2086, emoji: "🏛️", type: "govt" },

  // Parks & Recreation
  { name: "Lodhi Garden", lat: 28.5931, lon: 77.2197, emoji: "🌳", type: "park" },
  { name: "Nehru Place", lat: 28.5491, lon: 77.2530, emoji: "💻", type: "market" },
  { name: "Connaught Place", lat: 28.6315, lon: 77.2167, emoji: "🛍️", type: "market" },
  { name: "Dilli Haat INA", lat: 28.5733, lon: 77.2098, emoji: "🎨", type: "market" },
  { name: "Chandni Chowk", lat: 28.6506, lon: 77.2302, emoji: "🛒", type: "market" },
];
