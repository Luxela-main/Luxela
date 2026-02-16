export const BUSINESS_TYPES = [
  { label: '👤 Individual / Sole Trader', value: 'individual', description: 'One-person operation' },
  { label: '🏢 Sole Proprietorship', value: 'sole_proprietorship', description: 'Self-owned business' },
  { label: '⚖️ LLC (Limited Liability Company)', value: 'llc', description: 'Protected liability structure' },
  { label: '🏛️ Corporation', value: 'corporation', description: 'Formal registered company' },
  { label: '🤝 Partnership', value: 'partnership', description: 'Multiple co-owners' },
  { label: '👥 Cooperative', value: 'cooperative', description: 'Member-owned enterprise' },
  { label: '🎗️ Non-Profit Organization', value: 'non_profit', description: 'Community-based' },
  { label: '📋 Trust', value: 'trust', description: 'Trust-managed entity' },
  { label: '🔗 Joint Venture', value: 'joint_venture', description: 'Collaborative partnership' },
];

export const ID_TYPES = [
  { label: '🆔 National ID / NIN', value: 'national_id', description: 'Official national identification' },
  { label: '🛂 International Passport', value: 'passport', description: 'Travel document' },
  { label: '🚗 Driver\'s License', value: 'drivers_license', description: 'Driving authorization' },
  { label: '🗳️ Voter\'s Card', value: 'voters_card', description: 'Electoral identification' },
  { label: '📄 Business License', value: 'business_license', description: 'Business operation permit' },
  { label: '💼 Tax ID / TIN', value: 'tax_id', description: 'Taxpayer identification' },
  { label: '📋 Business Registration', value: 'business_registration', description: 'Official business registration' },
];

export const SHIPPING_TYPES = [
  { label: '⚡ Same-Day Delivery', value: 'same_day', eta: '< 24 hours', cost: 'Premium' },
  { label: '🚀 Next-Day Delivery', value: 'next_day', eta: '24 hours', cost: 'High' },
  { label: '📦 Express Shipping', value: 'express', eta: '48-72 hours', cost: 'Medium-High' },
  { label: '📮 Standard Shipping', value: 'standard', eta: '5-7 days', cost: 'Medium' },
  { label: '🏘️ Domestic Only', value: 'domestic', eta: 'Variable', cost: 'Standard' },
  { label: '🌍 International Only', value: 'international', eta: '10-30 days', cost: 'High' },
  { label: '🌐 Domestic & International', value: 'both', eta: 'Variable', cost: 'Variable' },
];

export const SHIPPING_ETA_OPTIONS = [
  { label: '⚡ Same Day (Premium)', value: 'same_day', surcharge: '50-100%' },
  { label: '🚀 Next Day (24 hours)', value: 'next_day', surcharge: '30-50%' },
  { label: '📦 48 Hours (Express)', value: '48hrs', surcharge: '20-30%' },
  { label: '📮 72 Hours (3 days)', value: '72hrs', surcharge: '10-20%' },
  { label: '📋 5 Working Days', value: '5_working_days', surcharge: 'Standard' },
  { label: '📅 1-2 Weeks', value: '1_2_weeks', surcharge: 'Standard' },
  { label: '🗓️ 2-3 Weeks (Bulk)', value: '2_3_weeks', surcharge: '5-10%' },
  { label: '💬 Custom Order (Negotiable)', value: 'custom', surcharge: 'Custom' },
];

export const REFUND_POLICIES = [
  { label: '❌ No Refunds (Final Sale)', value: 'no_refunds', trustLevel: 'Low', buyerConfidence: 'Low' },
  { label: '⏰ Refunds within 48 hours', value: '48hrs', trustLevel: 'Low-Medium', buyerConfidence: 'Medium' },
  { label: '⏰ Refunds within 72 hours', value: '72hrs', trustLevel: 'Medium', buyerConfidence: 'Medium' },
  { label: '⏰ Refunds within 5 working days', value: '5_working_days', trustLevel: 'Medium', buyerConfidence: 'Medium-High' },
  { label: '📅 Refunds within 1 week', value: '1week', trustLevel: 'Medium-High', buyerConfidence: 'High' },
  { label: '📅 Refunds within 14 days (EU Standard)', value: '14days', trustLevel: 'High', buyerConfidence: 'High' },
  { label: '📅 Refunds within 30 days', value: '30days', trustLevel: 'High', buyerConfidence: 'Very High' },
  { label: '⭐ Refunds within 60 days (Premium)', value: '60days', trustLevel: 'Very High', buyerConfidence: 'Premium' },
  { label: '💳 Store Credit Only', value: 'store_credit', trustLevel: 'Medium', buyerConfidence: 'Medium' },
];

export const FIAT_PAYOUT_METHODS = [
  { label: '🏦 Bank Transfer', value: 'bank', processing: '2-5 days', fee: '1-3%', trustLevel: 'High' },
  { label: '🅿️ PayPal', value: 'paypal', processing: '1-2 days', fee: '2-3%', trustLevel: 'High' },
  { label: '🔵 Stripe', value: 'stripe', processing: '1-2 days', fee: '2.9%+0.30', trustLevel: 'Very High' },
  { label: '💱 Wise (TransferWise)', value: 'wise', processing: '1-2 days', fee: 'Mid-Market+0.64%', trustLevel: 'Very High' },
  { label: '🌊 Flutterwave', value: 'flutterwave', processing: '1-3 days', fee: '1.4%', trustLevel: 'High' },
  { label: '📱 Mobile Money (Africa)', value: 'mobile_money', processing: 'Same day', fee: '0.5-1%', trustLevel: 'Medium-High' },
  { label: '🏪 Local Payment Gateway', value: 'local_gateway', processing: 'Variable', fee: 'Variable', trustLevel: 'Medium' },
];

export const WALLET_TYPES = [
  { label: '👻 Phantom (Solana)', value: 'phantom', ecosystem: 'Solana', users: '10M+', security: 'High' },
  { label: '☀️ Solflare (Solana)', value: 'solflare', ecosystem: 'Solana', users: '1M+', security: 'High' },
  { label: '🎒 Backpack (Solana)', value: 'backpack', ecosystem: 'Solana', users: '500K+', security: 'High' },
  { label: '🦁 Magic Eden (Solana)', value: 'magic_eden', ecosystem: 'Solana/Multi', users: '2M+', security: 'Very High' },
  { label: '🔗 WalletConnect', value: 'wallet_connect', ecosystem: 'Multi-Chain', users: '5M+', security: 'Very High' },
  { label: '💾 Ledger Live', value: 'ledger_live', ecosystem: 'Multi-Chain', users: '1M+', security: 'Hardware' },
];

export const PAYOUT_TOKENS = [
  { label: '🪙 USDC (SOL)', value: 'USDC', type: 'Stablecoin', volatility: '0%', adoption: 'Very High', liquidity: 'Excellent' },
];

export const PRODUCT_CATEGORIES = [
  { label: 'Men Clothing', value: 'men_clothing' },
  { label: 'Women Clothing', value: 'women_clothing' },
  { label: 'Men Shoes', value: 'men_shoes' },
  { label: 'Women Shoes', value: 'women_shoes' },
  { label: 'Accessories', value: 'accessories' },
  { label: 'Merch', value: 'merch' },
  { label: 'Others', value: 'others' },
];

export const TARGET_AUDIENCES = [
  { label: '👨 Male / Men', value: 'male', ageRange: '18+', sizing: 'Men' },
  { label: '👩 Female / Women', value: 'female', ageRange: '18+', sizing: 'Women' },
  { label: '👥 Unisex / All Genders', value: 'unisex', ageRange: '18+', sizing: 'One Size Fits Most' },
  { label: '👶 Kids (0-12 years)', value: 'kids', ageRange: '0-12', sizing: 'Kids' },
  { label: '👦 Teens (13-17 years)', value: 'teens', ageRange: '13-17', sizing: 'Teen' },
];

export const LOCAL_PRICING_OPTIONS = [
  { label: '💵 Fiat Currency Only', value: 'fiat', convenience: 'High', volatility: 'None', bankingRequired: 'Yes' },
  { label: '₿ Cryptocurrency Only', value: 'cryptocurrency', convenience: 'Medium', volatility: 'High', bankingRequired: 'No' },
  { label: '💳 Both Fiat & Crypto', value: 'both', convenience: 'Very High', volatility: 'Varied', bankingRequired: 'Optional' },
];

// Social Media Platforms with lucide-react icons
import { X, Instagram, Facebook, MessageCircle, Music } from 'lucide-react';

export const SOCIAL_MEDIA_PLATFORMS = [
  { 
    label: 'X', 
    value: 'x', 
    placeholder: '@your_handle', 
    inputType: 'text', 
    description: 'Handle without @',
    icon: X,
    iconColor: '#ffffff',
    bgColor: '#000000'
  },
  { 
    label: 'Instagram', 
    value: 'instagram', 
    placeholder: '@your_handle', 
    inputType: 'text', 
    description: 'Handle without @',
    icon: Instagram,
    iconColor: '#E1306C'
  },
  { 
    label: 'Facebook', 
    value: 'facebook', 
    placeholder: 'facebook.com/yourpage', 
    inputType: 'url', 
    description: 'Profile or page URL',
    icon: Facebook,
    iconColor: '#1877F2'
  },
  { 
    label: 'WhatsApp', 
    value: 'whatsapp', 
    placeholder: '+1234567890', 
    inputType: 'tel', 
    description: 'Phone number with country code',
    icon: MessageCircle,
    iconColor: '#25D366'
  },
  { 
    label: 'TikTok', 
    value: 'tiktok', 
    placeholder: '@your_handle', 
    inputType: 'text', 
    description: 'Handle without @',
    icon: Music,
    iconColor: '#ffffff',
    bgColor: '#000000'
  },
];

export const PREFERRED_PAYOUT_METHODS = [
  { label: 'Fiat Currency (Local Currency)', value: 'fiat_currency' },
  { label: 'Cryptocurrency', value: 'cryptocurrency' },
  { label: 'Both Options', value: 'both' },
];

export const BLOCKCHAINS = [
  { label: 'Solana', value: 'solana' },
  { label: 'Ethereum', value: 'ethereum' },
  { label: 'Polygon', value: 'polygon' },
  { label: 'Arbitrum', value: 'arbitrum' },
  { label: 'Optimism', value: 'optimism' },
];

// ============================================
// HIERARCHICAL LOCATION DATA: Country → State → City
// ============================================

interface StateData {
  [stateName: string]: string[];
}

interface CountryData {
  label: string;
  states: StateData;
}

export const PHONE_COUNTRY_CODES = [
  { label: '🇳🇬 Nigeria (+234)', value: 'NG', code: '+234' },
  { label: '🇺🇸 United States (+1)', value: 'US', code: '+1' },
  { label: '🇬🇧 United Kingdom (+44)', value: 'GB', code: '+44' },
  { label: '🇨🇦 Canada (+1)', value: 'CA', code: '+1' },
  { label: '🇿🇦 South Africa (+27)', value: 'ZA', code: '+27' },
  { label: '🇪🇬 Egypt (+20)', value: 'EG', code: '+20' },
  { label: '🇮🇳 India (+91)', value: 'IN', code: '+91' },
  { label: '🇰🇪 Kenya (+254)', value: 'KE', code: '+254' },
  { label: '🇬🇭 Ghana (+233)', value: 'GH', code: '+233' },
];

export const COUNTRIES_WITH_STATES_AND_CITIES: Record<string, CountryData> = {
  NG: {
    label: 'Nigeria',
    states: {
      'Abia': ['Umuahia', 'Aba', 'Okigwe', 'Ohafia', 'Arochukwu', 'Bende', 'Obingwa'],
      'Adamawa': ['Yola', 'Mubi', 'Girei', 'Song', 'Hong', 'Jada', 'Ganye'],
      'Akwa Ibom': ['Uyo', 'Ikot Ekpene', 'Eket', 'Oron', 'Abak', 'Ibeno'],
      'Anambra': ['Awka', 'Onitsha', 'Nnewi', 'Agulu', 'Ekwulobia', 'Ihiala'],
      'Bauchi': ['Bauchi', 'Giade', 'Dass', 'Tafawa Balewa', 'Kirfi', 'Zaki'],
      'Bayelsa': ['Yenagoa', 'Brass', 'Nembe', 'Akassa', 'Oporoma', 'Gbarantoru'],
      'Benue': ['Makurdi', 'Gboko', 'Otukpo', 'Katsina-Ala', 'Vandeikya', 'Tarka'],
      'Borno': ['Maiduguri', 'Biu', 'Potiskum', 'Gujba', 'Jakusko', 'Gashua'],
      'Cross River': ['Calabar', 'Ogoja', 'Ikom', 'Oban', 'Akamkpa', 'Obudu'],
      'Delta': ['Asaba', 'Warri', 'Sapele', 'Agbor', 'Abraka', 'Oleh'],
      'Ebonyi': ['Abakaliki', 'Onueke', 'Afikpo', 'Ishielu', 'Izzi', 'Ohaukwu'],
      'Edo': ['Benin City', 'Auchi', 'Ekpoma', 'Uromi', 'Irrua', 'Fugar'],
      'Ekiti': ['Ado-Ekiti', 'Ikere', 'Oye', 'Aramoko', 'Ijero', 'Ilawe'],
      'Enugu': ['Enugu', 'Nsukka', 'Agbani', 'Oji River', 'Awgu', 'Udi'],
      'Gombe': ['Gombe', 'Bajoga', 'Gada', 'Kumo', 'Nafada', 'Billiri'],
      'Imo': ['Owerri', 'Mbaise', 'Mbaitoli', 'Okigwe', 'Oguta', 'Isu'],
      'Jigawa': ['Dutse', 'Hadejia', 'Gumel', 'Kazaure', 'Kiri', 'Birnin Kudu'],
      'Kaduna': ['Kaduna', 'Zaria', 'Kafanchan', 'Samaru', 'Giwa', 'Chikun'],
      'Kano': ['Kano', 'Kumbotso', 'Garun Mallam', 'Bebeji', 'Karaye', 'Dambatta'],
      'Katsina': ['Katsina', 'Kankara', 'Daura', 'Jibia', 'Kaita', 'Dandume'],
      'Kebbi': ['Birnin Kebbi', 'Argungu', 'Bagudo', 'Yauri', 'Zuru', 'Kalgo'],
      'Kogi': ['Lokoja', 'Okene', 'Idah', 'Ankpa', 'Kabba', 'Ajaokuta'],
      'Kwara': ['Ilorin', 'Offa', 'Jebba', 'Pategi', 'Kaima', 'Moro'],
      'Lagos': ['Lagos', 'Ikeja', 'Epe', 'Badagry', 'Lekki', 'Ikorodu'],
      'Nasarawa': ['Lafia', 'Keffi', 'Doma', 'Karu', 'Kagarko', 'Awe'],
      'Niger': ['Minna', 'Suleja', 'Bida', 'Lapai', 'Bosso', 'Wushishi'],
      'Ogun': ['Abeokuta', 'Sagamu', 'Ijebu-Ode', 'Ifo', 'Ota', 'Ilaro'],
      'Ondo': ['Akure', 'Ondo', 'Owo', 'Ose', 'Idanre', 'Okitipupa'],
      'Osun': ['Osogbo', 'Ilesa', 'Ede', 'Iwo', 'Ijebu-Jesa', 'Ikire'],
      'Oyo': ['Ibadan', 'Ogbomoso', 'Oyo', 'Iseyin', 'Shaki', 'Saki'],
      'Plateau': ['Jos', 'Bukuru', 'Pankshin', 'Kanam', 'Wase', 'Bokkos'],
      'Rivers': ['Port Harcourt', 'Obio-Akpor', 'Bonny', 'Opobo', 'Ahoada', 'Oyigbo'],
      'Sokoto': ['Sokoto', 'Tambuwal', 'Dange', 'Gudu', 'Bodinga', 'Binji'],
      'Taraba': ['Jalingo', 'Wukari', 'Takum', 'Zing', 'Karim-Lamido', 'Gashaka'],
      'Yobe': ['Damaturu', 'Potiskum', 'Gujba', 'Gashua', 'Bursari', 'Geidam'],
      'Zamfara': ['Gusau', 'Kaura-Namoda', 'Anka', 'Bukkuyum', 'Tsafe', 'Maru'],
      'FCT': ['Abuja', 'Garki', 'Wuse', 'Maitama', 'Central Area', 'Lugbe'],
    },
  },
  US: {
    label: 'United States',
    states: {
      'Alabama': ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville', 'Dothan'],
      'Alaska': ['Anchorage', 'Juneau', 'Fairbanks', 'Ketchikan'],
      'Arizona': ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Glendale'],
      'Arkansas': ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale'],
      'California': ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento'],
      'Colorado': ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins'],
      'Connecticut': ['Bridgeport', 'Hartford', 'New Haven', 'Waterbury'],
      'Delaware': ['Wilmington', 'Dover', 'Newark'],
      'Florida': ['Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg'],
      'Georgia': ['Atlanta', 'Augusta', 'Columbus', 'Savannah'],
      'Hawaii': ['Honolulu', 'Pearl City', 'Hilo'],
      'Idaho': ['Boise', 'Meridian', 'Pocatello', 'Idaho Falls'],
      'Illinois': ['Chicago', 'Aurora', 'Rockford', 'Joliet'],
      'Indiana': ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend'],
      'Iowa': ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City'],
      'Kansas': ['Kansas City', 'Wichita', 'Topeka', 'Overland Park'],
      'Kentucky': ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro'],
      'Louisiana': ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette'],
      'Maine': ['Portland', 'Lewiston', 'Bangor', 'Augusta'],
      'Maryland': ['Baltimore', 'Frederick', 'Gaithersburg', 'Bowie'],
      'Massachusetts': ['Boston', 'Worcester', 'Springfield', 'Cambridge'],
      'Michigan': ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights'],
      'Minnesota': ['Minneapolis', 'St. Paul', 'Rochester', 'Duluth'],
      'Mississippi': ['Jackson', 'Gulfport', 'Biloxi', 'Hattiesburg'],
      'Missouri': ['Kansas City', 'St. Louis', 'Springfield', 'Independence'],
      'Montana': ['Billings', 'Missoula', 'Great Falls', 'Bozeman'],
      'Nebraska': ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island'],
      'Nevada': ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas'],
      'New Hampshire': ['Manchester', 'Nashua', 'Concord', 'Derry'],
      'New Jersey': ['Newark', 'Jersey City', 'Paterson', 'Elizabeth'],
      'New Mexico': ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe'],
      'New York': ['New York City', 'Buffalo', 'Rochester', 'Syracuse'],
      'North Carolina': ['Charlotte', 'Raleigh', 'Greensboro', 'Durham'],
      'North Dakota': ['Bismarck', 'Fargo', 'Grand Forks', 'Minot'],
      'Ohio': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo'],
      'Oklahoma': ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow'],
      'Oregon': ['Portland', 'Eugene', 'Salem', 'Gresham'],
      'Pennsylvania': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie'],
      'Rhode Island': ['Providence', 'Warwick', 'Cranston'],
      'South Carolina': ['Charleston', 'Columbia', 'Greenville', 'Spartanburg'],
      'South Dakota': ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings'],
      'Tennessee': ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga'],
      'Texas': ['Houston', 'Dallas', 'Austin', 'San Antonio'],
      'Utah': ['Salt Lake City', 'West Valley City', 'Provo', 'Orem'],
      'Vermont': ['Burlington', 'South Burlington', 'Rutland'],
      'Virginia': ['Virginia Beach', 'Richmond', 'Arlington', 'Alexandria'],
      'Washington': ['Seattle', 'Spokane', 'Tacoma', 'Vancouver'],
      'West Virginia': ['Charleston', 'Huntington', 'Wheeling', 'Morgantown'],
      'Wisconsin': ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha'],
      'Wyoming': ['Cheyenne', 'Casper', 'Laramie', 'Gillette'],
    },
  },
  GB: {
    label: 'United Kingdom',
    states: {
      'England': ['London', 'Manchester', 'Birmingham', 'Leeds', 'Bristol', 'Sheffield', 'Oxford', 'Cambridge'],
      'Scotland': ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Stirling'],
      'Wales': ['Cardiff', 'Swansea', 'Newport', 'Wrexham', 'Bangor'],
      'Northern Ireland': ['Belfast', 'Londonderry', 'Lisburn', 'Armagh'],
    },
  },
  CA: {
    label: 'Canada',
    states: {
      'Ontario': ['Toronto', 'Ottawa', 'Mississauga', 'Brampton', 'Hamilton', 'London', 'Markham'],
      'Quebec': ['Montreal', 'Quebec City', 'Gatineau', 'Laval', 'Longueuil', 'Sherbrooke'],
      'British Columbia': ['Vancouver', 'Victoria', 'Surrey', 'Burnaby', 'Richmond'],
      'Alberta': ['Calgary', 'Edmonton', 'Red Deer', 'Lethbridge', 'St. Albert'],
      'Manitoba': ['Winnipeg', 'Brandon', 'Flin Flon'],
      'Saskatchewan': ['Saskatoon', 'Regina', 'Prince Albert', 'Moose Jaw'],
      'Nova Scotia': ['Halifax', 'Sydney', 'Cape Breton', 'Glace Bay'],
      'New Brunswick': ['Saint John', 'Moncton', 'Fredericton'],
      'Newfoundland and Labrador': ['St. John\'s', 'Corner Brook', 'Gander'],
      'Prince Edward Island': ['Charlottetown', 'Summerside'],
      'Northwest Territories': ['Yellowknife', 'Hay River'],
      'Yukon': ['Whitehorse', 'Dawson City'],
      'Nunavut': ['Iqaluit', 'Rankin Inlet'],
    },
  },
  ZA: {
    label: 'South Africa',
    states: {
      'Eastern Cape': ['Port Elizabeth', 'East London', 'Gqeberha', 'Uitenhage'],
      'Free State': ['Bloemfontein', 'Welkom', 'Parys', 'Virginia'],
      'Gauteng': ['Johannesburg', 'Pretoria', 'Soweto', 'Tshwane'],
      'KwaZulu-Natal': ['Durban', 'Pietermaritzburg', 'Newcastle', 'Richards Bay'],
      'Limpopo': ['Polokwane', 'Messina', 'Musina', 'Thohoyandou'],
      'Mpumalanga': ['Mbombela', 'Witbank', 'Secunda', 'Middelburg'],
      'Northern Cape': ['Kimberley', 'Upington', 'De Aar', 'Kuruman'],
      'North West': ['Mahikeng', 'Rustenburg', 'Potchefstroom', 'Klerksdorp'],
      'Western Cape': ['Cape Town', 'Stellenbosch', 'Paarl', 'Somerset West'],
    },
  },
  EG: {
    label: 'Egypt',
    states: {
      'Cairo': ['Cairo', 'Heliopolis', 'New Cairo', 'Nasr City'],
      'Giza': ['Giza', 'Sheikh Zayed', '6th of October City'],
      'Alexandria': ['Alexandria', 'Agami'],
      'Port Said': ['Port Said', 'Port Tawfik'],
      'Ismailia': ['Ismailia', 'Fayed', 'Kassasseen'],
      'Suez': ['Suez', 'Attaka', 'Ain Sokhna'],
      'Damietta': ['Damietta', 'New Damietta'],
      'Sharqia': ['Zagazig', 'Benha', 'Bilbeis'],
      'Dakahlia': ['Mansura', 'Tanta', 'Mit Ghamr'],
      'Kafr El Sheikh': ['Kafr El Sheikh', 'Desouq'],
      'Beheira': ['Damanhur', 'Kafr El Dawwar'],
      'Monufia': ['Shebin El Qom', 'Menouf'],
      'Fayoum': ['Fayoum', 'Itsa'],
      'Minya': ['Minya', 'Mallawi'],
      'Asyut': ['Asyut', 'Manfalut'],
      'Sohag': ['Sohag', 'Akhmim'],
      'Qena': ['Qena', 'Dendera'],
      'Aswan': ['Aswan', 'Abu Simbel'],
      'Red Sea': ['Hurghada', 'Safaga'],
      'Matruh': ['Marsa Matruh', 'Siwa'],
      'North Sinai': ['Arish', 'Rafah'],
      'South Sinai': ['Sharm El Sheikh', 'Dahab'],
    },
  },
  IN: {
    label: 'India',
    states: {
      'Andhra Pradesh': ['Hyderabad', 'Visakhapatnam', 'Vijayawada', 'Tirupati'],
      'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat'],
      'Assam': ['Guwahati', 'Silchar', 'Dibrugarh'],
      'Bihar': ['Patna', 'Gaya', 'Bhagalpur'],
      'Chhattisgarh': ['Raipur', 'Bhilai', 'Durg'],
      'Goa': ['Panaji', 'Margao', 'Vasco da Gama'],
      'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara'],
      'Haryana': ['Chandigarh', 'Faridabad', 'Gurgaon'],
      'Himachal Pradesh': ['Shimla', 'Mandi', 'Solan'],
      'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad'],
      'Karnataka': ['Bangalore', 'Mysore', 'Belgaum'],
      'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode'],
      'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur'],
      'Maharashtra': ['Mumbai', 'Pune', 'Nagpur'],
      'Manipur': ['Imphal', 'Thoubal'],
      'Meghalaya': ['Shillong', 'Tura'],
      'Mizoram': ['Aizawl', 'Lunglei'],
      'Nagaland': ['Kohima', 'Dimapur'],
      'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela'],
      'Punjab': ['Amritsar', 'Ludhiana', 'Patiala'],
      'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota'],
      'Sikkim': ['Gangtok', 'Peling'],
      'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai'],
      'Telangana': ['Hyderabad', 'Secunderabad', 'Warangal'],
      'Tripura': ['Agartala', 'Dharmanagar'],
      'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra'],
      'Uttarakhand': ['Dehradun', 'Nainital', 'Haridwar'],
      'West Bengal': ['Kolkata', 'Howrah', 'Darjeeling'],
      'Puducherry': ['Pondicherry', 'Yanam'],
    },
  },
  KE: {
    label: 'Kenya',
    states: {
      'Nairobi': ['Nairobi', 'Westlands', 'Karen', 'Gigiri'],
      'Mombasa': ['Mombasa', 'Likoni', 'Kisauni', 'Nyali'],
      'Kisumu': ['Kisumu', 'Kericho', 'Ahero'],
      'Nakuru': ['Nakuru', 'Eldoret', 'Iten'],
      'Kajiado': ['Kajiado', 'Ongata Rongai', 'Ngong'],
      'Machakos': ['Machakos', 'Athi River', 'Kangundo'],
      'Makueni': ['Makueni', 'Wote', 'Mtito Andei'],
      'Nyeri': ['Nyeri', 'Murang\'a', 'Othaya'],
      'Kiambu': ['Kiambu', 'Thika', 'Limuru'],
      'Kericho': ['Kericho', 'Bomet', 'Sotik'],
      'Kisii': ['Kisii', 'Nyamira'],
      'Nandi': ['Kapsabet', 'Eldoret'],
      'Uasin Gishu': ['Eldoret', 'Iten'],
      'Trans Nzoia': ['Kitale', 'Endebess'],
      'Bungoma': ['Bungoma', 'Webuye'],
      'Busia': ['Busia', 'Butula'],
      'Siaya': ['Siaya', 'Gem'],
      'Migori': ['Migori'],
      'Homa Bay': ['Homa Bay'],
      'Kilifi': ['Kilifi', 'Malindi'],
      'Lamu': ['Lamu', 'Kiunga'],
      'Garissa': ['Garissa', 'Dadaab'],
      'Wajir': ['Wajir', 'Hamar'],
      'Mandera': ['Mandera'],
      'Turkana': ['Lodwar', 'Lokichogio'],
      'Samburu': ['Samburu'],
      'Marsabit': ['Marsabit', 'Moyale'],
      'Isiolo': ['Isiolo'],
    },
  },
  GH: {
    label: 'Ghana',
    states: {
      'Ashanti': ['Kumasi', 'Obuasi', 'Bekwai', 'Ejisu'],
      'Greater Accra': ['Accra', 'Tema', 'Spintex', 'Labadi'],
      'Central': ['Cape Coast', 'Sekondi', 'Takoradi', 'Winneba'],
      'Western': ['Takoradi', 'Tarkwa', 'Elubo'],
      'Eastern': ['Koforidua', 'Akyem', 'Aburi'],
      'Northern': ['Tamale', 'Bolgatanga', 'Wa'],
      'Volta': ['Ho', 'Keta', 'Aflao'],
      'Upper West': ['Wa', 'Lawra', 'Jirapa'],
      'Upper East': ['Bolgatanga', 'Navrongo', 'Bawku'],
    },
  },
};

// Helper function to get states for a country
export const getStatesForCountry = (countryCode: string): string[] => {
  const country = COUNTRIES_WITH_STATES_AND_CITIES[countryCode];
  return country ? Object.keys(country.states) : [];
};

// Helper function to get cities for a state in a country
export const getCitiesForState = (countryCode: string, stateName: string): string[] => {
  const country = COUNTRIES_WITH_STATES_AND_CITIES[countryCode];
  return country && country.states[stateName] ? country.states[stateName] : [];
};

// Helper function to get all countries as dropdown options
export const getAllCountries = () => {
  return Object.entries(COUNTRIES_WITH_STATES_AND_CITIES).map(([code, data]) => ({
    value: code,
    label: data.label,
  }));
};