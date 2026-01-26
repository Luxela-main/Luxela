export interface Country {
  code: string;
  name: string;
  flag: string;
}

export interface State {
  name: string;
  code: string;
}

export interface City {
  name: string;
  state: string;
}

export const COUNTRIES: Country[] = [
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "GH", name: "Ghana", flag: "🇬🇭" },
  { code: "UG", name: "Uganda", flag: "🇺🇬" },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "SN", name: "Senegal", flag: "🇸🇳" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "EG", name: "Egypt", flag: "🇪🇬" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
];

export const COUNTRY_PHONE_CODES: { [key: string]: string } = {
  NG: "+234",
  US: "+1",
  GB: "+44",
  CA: "+1",
  AU: "+61",
  DE: "+49",
  FR: "+33",
  IN: "+91",
  JP: "+81",
  SG: "+65",
  ZA: "+27",
  KE: "+254",
  GH: "+233",
  UG: "+256",
  TZ: "+255",
  CI: "+225",
  SN: "+221",
  PK: "+92",
  BD: "+880",
  BR: "+55",
  MX: "+52",
  ES: "+34",
  IT: "+39",
  NL: "+31",
  SE: "+46",
  CH: "+41",
  AE: "+971",
  SA: "+966",
  EG: "+20",
  NZ: "+64",
};

export function getCountryPhoneCode(countryCode: string): string {
  return COUNTRY_PHONE_CODES[countryCode] || "+";
}

export const NIGERIAN_STATES: State[] = [
  { name: "Abia", code: "AB" },
  { name: "Adamawa", code: "AD" },
  { name: "Akwa Ibom", code: "AK" },
  { name: "Anambra", code: "AN" },
  { name: "Bauchi", code: "BA" },
  { name: "Bayelsa", code: "BY" },
  { name: "Benue", code: "BE" },
  { name: "Borno", code: "BO" },
  { name: "Cross River", code: "CR" },
  { name: "Delta", code: "DE" },
  { name: "Ebonyi", code: "EB" },
  { name: "Edo", code: "ED" },
  { name: "Ekiti", code: "EK" },
  { name: "Enugu", code: "EN" },
  { name: "Gombe", code: "GO" },
  { name: "Imo", code: "IM" },
  { name: "Jigawa", code: "JI" },
  { name: "Kaduna", code: "KA" },
  { name: "Kano", code: "KN" },
  { name: "Katsina", code: "KT" },
  { name: "Kebbi", code: "KE" },
  { name: "Kogi", code: "KO" },
  { name: "Kwara", code: "KW" },
  { name: "Lagos", code: "LA" },
  { name: "Nasarawa", code: "NA" },
  { name: "Niger", code: "NI" },
  { name: "Ogun", code: "OG" },
  { name: "Ondo", code: "ON" },
  { name: "Osun", code: "OS" },
  { name: "Oyo", code: "OY" },
  { name: "Plateau", code: "PL" },
  { name: "Rivers", code: "RI" },
  { name: "Sokoto", code: "SO" },
  { name: "Taraba", code: "TA" },
  { name: "Yobe", code: "YO" },
  { name: "Zamfara", code: "ZA" },
  { name: "Federal Capital Territory", code: "FC" },
];

export const NIGERIAN_CITIES: Record<string, string[]> = {
  "Lagos": ["Lekki", "Victoria Island", "Ikeja", "Yaba", "Surulere", "Ikoyi", "Ajah", "Epe", "Ikorodu", "Badagry"],
  "Ogun": ["Abeokuta", "Ijebu-Ode", "Sagamu", "Remo", "Owu", "Ipokia", "Imeko-Afon"],
  "Oyo": ["Ibadan", "Ogbomoso", "Iseyin", "Oyo", "Eruwa", "Kajola", "Saki"],
  "Osun": ["Osogbo", "Ilesha", "Iwo", "Ikire", "Ede", "Ilesa", "Oshogbo"],
  "Ondo": ["Akure", "Ondo", "Owo", "Ilesa", "Akokoland", "Ose", "Irele"],
  "Ekiti": ["Ado-Ekiti", "Ikere", "Ijero", "Ilawe", "Oye", "Otun", "Isan-Ekiti"],
  "Kwara": ["Ilorin", "Offa", "Jebba", "Pategi", "Kwara", "Kaiama", "Argungu"],
  "Niger": ["Minna", "Suleja", "Bida", "Kontagora", "Paiko", "Wushishi"],
  "Kaduna": ["Kaduna", "Zaria", "Kafanchan", "Saminaka", "Kachia", "Kagarko"],
  "Kano": ["Kano", "Dawakin Kudu", "Takai", "Bunkure", "Kura", "Geza", "Kunchi"],
  "Katsina": ["Katsina", "Daura", "Funtua", "Malumfashi", "Kankara", "Batsari"],
  "Sokoto": ["Sokoto", "Gusau", "Tambuwal", "Tureta", "Argungu", "Wurno"],
  "Kebbi": ["Birnin Kebbi", "Argungu", "Yauri", "Zuru", "Jega", "Bagudo"],
  "Zamfara": ["Gusau", "Tsafe", "Kaura Namoda", "Talika", "Anka", "Maru"],
  "Jigawa": ["Dutse", "Gumel", "Hadejia", "Kazaure", "Birnin Kudu", "Guri"],
  "Yobe": ["Damaturu", "Potiskum", "Geidam", "Nangere", "Machina", "Karasuwa"],
  "Borno": ["Maiduguri", "Biu", "Damboa", "Gwoza", "Bama", "Dikwa"],
  "Adamawa": ["Yola", "Jimeta", "Girei", "Mubi", "Numan", "Adamawa"],
  "Taraba": ["Jalingo", "Wukari", "Zing", "Ibi", "Karim-Lamido", "Takum"],
  "Gombe": ["Gombe", "Kumo", "Bajoga", "Yamaltu", "Dukku", "Funakaye"],
  "Bauchi": ["Bauchi", "Dass", "Giade", "Toro", "Misau", "Ningi"],
  "Plateau": ["Jos", "Pankshin", "Shendam", "Barkin-Ladi", "Bokkos", "Mangu"],
  "Nassarawa": ["Keffi", "Lafia", "Nasarawa", "Obi", "Akwanga", "Toto"],
  "Federal Capital Territory": ["Abuja", "Gwagwalada", "Kubwa", "Jikwoyi", "Asokoro", "Wuse"],
  "Benue": ["Makurdi", "Otukpo", "Gboko", "Katsina-Ala", "Vandeikya", "Logo"],
  "Kogi": ["Lokoja", "Okene", "Ofu", "Idah", "Anyigba", "Kabba"],
  "Edo": ["Benin City", "Auchi", "Uromi", "Ekpoma", "Ovia", "Orhionmwon"],
  "Delta": ["Asaba", "Warri", "Effurun", "Sapele", "Ovwor-Ton", "Burutu"],
  "Bayelsa": ["Yenagoa", "Ogbia", "Nembe", "Brass", "Ekeremor", "Kolokuma"],
  "Rivers": ["Port Harcourt", "Obio-Akpor", "Eleme", "Oyigbo", "Bonny", "Ogu"],
  "Cross River": ["Calabar", "Buea", "Ogoja", "Obudu", "Bekwarra", "Ikom"],
  "Akwa Ibom": ["Uyo", "Eket", "Ikot-Ekpene", "Abak", "Oron", "Onna"],
  "Anambra": ["Onitsha", "Awka", "Nnewi", "Ekwulobia", "Agulu", "Orumba"],
  "Enugu": ["Enugu", "Nsukka", "Enugu-Ezike", "Udi", "Agbani", "Nkanu"],
  "Ebonyi": ["Abakaliki", "Onueke", "Afikpo", "Ezza", "Izzi", "Ohaukwu"],
  "Imo": ["Owerri", "Orlu", "Okigwe", "Umuahia", "Aba", "Ohafia"],
  "Abia": ["Umuahia", "Aba", "Ohafia", "Abiriba", "Arochukwu", "Okeigbo"],
};

export const SOCIAL_MEDIA_PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: "📷", color: "#E4405F", baseUrl: "https://instagram.com" },
  { id: "twitter", name: "Twitter/X", icon: "𝕏", color: "#000000", baseUrl: "https://twitter.com" },
  { id: "facebook", name: "Facebook", icon: "f", color: "#1877F2", baseUrl: "https://facebook.com" },
  { id: "tiktok", name: "TikTok", icon: "🎵", color: "#000000", baseUrl: "https://tiktok.com/@" },
  { id: "linkedin", name: "LinkedIn", icon: "in", color: "#0A66C2", baseUrl: "https://linkedin.com/in" },
  { id: "youtube", name: "YouTube", icon: "▶️", color: "#FF0000", baseUrl: "https://youtube.com/@" },
  { id: "whatsapp", name: "WhatsApp", icon: "💬", color: "#25D366", baseUrl: "https://wa.me" },
  { id: "telegram", name: "Telegram", icon: "✈️", color: "#0088cc", baseUrl: "https://t.me" },
];

export function getCountryCode(countryName: string): string {
  const country = COUNTRIES.find(c => c.name === countryName);
  return country?.code || "";
}

export function getStatesByCountry(countryCode: string): State[] {
  if (countryCode === "NG") {
    return NIGERIAN_STATES;
  }
  // Add more countries as needed
  return [];
}

export function getCitiesByState(state: string, countryCode: string): string[] {
  console.log('getCitiesByState called with:', { state, countryCode, availableKeys: Object.keys(NIGERIAN_CITIES) });
  if (countryCode === "NG") {
    const result = NIGERIAN_CITIES[state] || [];
    console.log(`NIGERIAN_CITIES["${state}"] =`, result);
    return result;
  }
  // Add more countries as needed
  return [];
}

export function getSocialMediaPlatform(platformId: string) {
  return SOCIAL_MEDIA_PLATFORMS.find(p => p.id === platformId);
}