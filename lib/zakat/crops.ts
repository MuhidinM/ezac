import type { Locale } from "@/lib/i18n/config";

/**
 * Crops grown in Ethiopia, for the calculator's harvest lines. The key is
 * stored in the form; the name is shown in the visitor's language. Groups
 * follow how the Ministry of Agriculture and the CSA farm surveys report them,
 * most common crops first within each group, so a farmer finds theirs quickly.
 *
 * Whether every crop here owes Ushr is a scholarly question (schools differ on
 * vegetables and fruit); the calculator lists them all and the guidance note
 * under the result points people to the Commission for their own case.
 */

export type CropGroup = "cereals" | "pulses" | "oilseeds" | "cash" | "roots" | "vegetables" | "fruits" | "spices" | "other";

export type Crop = { key: string; group: CropGroup; name: Record<Locale, string> };

export const CROP_GROUPS: readonly CropGroup[] = [
  "cereals",
  "pulses",
  "oilseeds",
  "cash",
  "roots",
  "vegetables",
  "fruits",
  "spices",
  "other",
];

export const CROPS: readonly Crop[] = [
  // Cereals
  { key: "teff", group: "cereals", name: { en: "Teff", am: "ጤፍ", om: "Xaafii", ar: "التيف" } },
  { key: "maize", group: "cereals", name: { en: "Maize (corn)", am: "በቆሎ", om: "Boqqolloo", ar: "الذرة الشامية" } },
  { key: "wheat", group: "cereals", name: { en: "Wheat", am: "ስንዴ", om: "Qamadii", ar: "القمح" } },
  { key: "sorghum", group: "cereals", name: { en: "Sorghum", am: "ማሽላ", om: "Mishingaa", ar: "الذرة الرفيعة" } },
  { key: "barley", group: "cereals", name: { en: "Barley", am: "ገብስ", om: "Garbuu", ar: "الشعير" } },
  { key: "finger_millet", group: "cereals", name: { en: "Finger millet", am: "ዳጉሳ", om: "Daagujjaa", ar: "الدخن الإصبعي" } },
  { key: "rice", group: "cereals", name: { en: "Rice", am: "ሩዝ", om: "Ruuzii", ar: "الأرز" } },
  { key: "oats", group: "cereals", name: { en: "Oats", am: "አጃ", om: "Ajjaa", ar: "الشوفان" } },
  { key: "pearl_millet", group: "cereals", name: { en: "Pearl millet", am: "ፐርል ሚሌት", om: "Paarl miilleetii", ar: "الدخن اللؤلؤي" } },

  // Pulses
  { key: "faba_bean", group: "pulses", name: { en: "Faba bean (horse bean)", am: "ባቄላ", om: "Baaqelaa", ar: "الفول" } },
  { key: "chickpea", group: "pulses", name: { en: "Chickpea", am: "ሽምብራ", om: "Shimbiraa", ar: "الحمص" } },
  { key: "haricot_bean", group: "pulses", name: { en: "Haricot bean", am: "ቦሎቄ", om: "Boloqqee", ar: "الفاصولياء" } },
  { key: "field_pea", group: "pulses", name: { en: "Field pea", am: "አተር", om: "Atara", ar: "البازلاء" } },
  { key: "lentil", group: "pulses", name: { en: "Lentil", am: "ምስር", om: "Misira", ar: "العدس" } },
  { key: "grass_pea", group: "pulses", name: { en: "Grass pea", am: "ጓያ", om: "Gayyoo", ar: "الجلبان" } },
  { key: "mung_bean", group: "pulses", name: { en: "Mung bean", am: "ማሾ", om: "Maashoo", ar: "الماش" } },
  { key: "soybean", group: "pulses", name: { en: "Soybean", am: "አኩሪ አተር", om: "Sooyaa", ar: "فول الصويا" } },
  { key: "cowpea", group: "pulses", name: { en: "Cowpea", am: "አደንጓሬ", om: "Adangarree", ar: "اللوبياء" } },
  { key: "lupin", group: "pulses", name: { en: "Lupin", am: "ጊብቶ", om: "Gibtoo", ar: "الترمس" } },

  // Oilseeds
  { key: "sesame", group: "oilseeds", name: { en: "Sesame", am: "ሰሊጥ", om: "Saliixa", ar: "السمسم" } },
  { key: "niger_seed", group: "oilseeds", name: { en: "Niger seed (noug)", am: "ኑግ", om: "Nuugii", ar: "النيجر (نوغ)" } },
  { key: "linseed", group: "oilseeds", name: { en: "Linseed (flax)", am: "ተልባ", om: "Talbaa", ar: "بذر الكتان" } },
  { key: "groundnut", group: "oilseeds", name: { en: "Groundnut (peanut)", am: "ኦቾሎኒ", om: "Lawuzii", ar: "الفول السوداني" } },
  { key: "sunflower", group: "oilseeds", name: { en: "Sunflower", am: "የሱፍ አበባ", om: "Suufii", ar: "عباد الشمس" } },
  { key: "rapeseed", group: "oilseeds", name: { en: "Gomenzer (Ethiopian mustard, rapeseed)", am: "ጎመንዘር", om: "Sanaafica (gomanzara)", ar: "الخردل الحبشي (السلجم)" } },
  { key: "safflower", group: "oilseeds", name: { en: "Safflower", am: "ሳፍላወር", om: "Saaflaawarii", ar: "القرطم" } },
  { key: "castor", group: "oilseeds", name: { en: "Castor bean", am: "ጉሎ", om: "Qobboo", ar: "الخروع" } },

  // Cash and industrial crops
  { key: "coffee", group: "cash", name: { en: "Coffee", am: "ቡና", om: "Buna", ar: "البن" } },
  { key: "khat", group: "cash", name: { en: "Khat (chat)", am: "ጫት", om: "Jimaa (caatii)", ar: "القات" } },
  { key: "tea", group: "cash", name: { en: "Tea", am: "ሻይ", om: "Shaayii", ar: "الشاي" } },
  { key: "sugarcane", group: "cash", name: { en: "Sugarcane", am: "ሸንኮራ አገዳ", om: "Shonkoraa", ar: "قصب السكر" } },
  { key: "cotton", group: "cash", name: { en: "Cotton", am: "ጥጥ", om: "Jirbii", ar: "القطن" } },
  { key: "gesho", group: "cash", name: { en: "Gesho (hops)", am: "ጌሾ", om: "Geeshoo", ar: "الجيشو" } },
  { key: "tobacco", group: "cash", name: { en: "Tobacco", am: "ትምባሆ", om: "Tamboo", ar: "التبغ" } },

  // Roots and tubers
  { key: "potato", group: "roots", name: { en: "Potato", am: "ድንች", om: "Dinnicha", ar: "البطاطس" } },
  { key: "sweet_potato", group: "roots", name: { en: "Sweet potato", am: "ስኳር ድንች", om: "Mixaaxishii", ar: "البطاطا الحلوة" } },
  { key: "enset", group: "roots", name: { en: "Enset (false banana)", am: "እንሰት", om: "Warqee", ar: "الإنست (الموز الكاذب)" } },
  { key: "taro", group: "roots", name: { en: "Taro (godere)", am: "ጎደሬ", om: "Godarree", ar: "القلقاس" } },
  { key: "cassava", group: "roots", name: { en: "Cassava", am: "ካሳቫ", om: "Kaasaavaa", ar: "الكسافا" } },
  { key: "yam", group: "roots", name: { en: "Yam", am: "ቦዬ", om: "Boyyee", ar: "اليام" } },

  // Vegetables
  { key: "onion", group: "vegetables", name: { en: "Onion", am: "ቀይ ሽንኩርት", om: "Qullubbii diimaa", ar: "البصل" } },
  { key: "tomato", group: "vegetables", name: { en: "Tomato", am: "ቲማቲም", om: "Timaatima", ar: "الطماطم" } },
  { key: "hot_pepper", group: "vegetables", name: { en: "Hot pepper (berbere)", am: "በርበሬ", om: "Barbaree", ar: "الفلفل الحار" } },
  { key: "green_pepper", group: "vegetables", name: { en: "Green pepper", am: "ቃሪያ", om: "Qaaraa", ar: "الفلفل الأخضر" } },
  { key: "cabbage", group: "vegetables", name: { en: "Cabbage", am: "ጥቅል ጎመን", om: "Raafuu marataa", ar: "الملفوف" } },
  { key: "kale", group: "vegetables", name: { en: "Kale (gomen)", am: "ጎመን", om: "Raafuu", ar: "الكرنب الأخضر" } },
  { key: "carrot", group: "vegetables", name: { en: "Carrot", am: "ካሮት", om: "Kaarotii", ar: "الجزر" } },
  { key: "swiss_chard", group: "vegetables", name: { en: "Swiss chard", am: "ቆስጣ", om: "Qosxaa", ar: "السلق" } },
  { key: "lettuce", group: "vegetables", name: { en: "Lettuce", am: "ሰላጣ", om: "Salaaxaa", ar: "الخس" } },
  { key: "beetroot", group: "vegetables", name: { en: "Beetroot", am: "ቀይ ስር", om: "Hidda diimaa", ar: "الشمندر" } },
  { key: "pumpkin", group: "vegetables", name: { en: "Pumpkin", am: "ዱባ", om: "Buqqee", ar: "القرع" } },

  // Fruits
  { key: "banana", group: "fruits", name: { en: "Banana", am: "ሙዝ", om: "Muuzii", ar: "الموز" } },
  { key: "mango", group: "fruits", name: { en: "Mango", am: "ማንጎ", om: "Maangoo", ar: "المانجو" } },
  { key: "avocado", group: "fruits", name: { en: "Avocado", am: "አቮካዶ", om: "Avokaadoo", ar: "الأفوكادو" } },
  { key: "papaya", group: "fruits", name: { en: "Papaya", am: "ፓፓያ", om: "Paappayyaa", ar: "البابايا" } },
  { key: "orange", group: "fruits", name: { en: "Orange", am: "ብርቱካን", om: "Burtukaana", ar: "البرتقال" } },
  { key: "lemon", group: "fruits", name: { en: "Lemon", am: "ሎሚ", om: "Loomii", ar: "الليمون" } },
  { key: "pineapple", group: "fruits", name: { en: "Pineapple", am: "አናናስ", om: "Ananaasii", ar: "الأناناس" } },
  { key: "apple", group: "fruits", name: { en: "Apple", am: "ፖም", om: "Poomii", ar: "التفاح" } },
  { key: "guava", group: "fruits", name: { en: "Guava", am: "ዘይቱን (ጉዋቫ)", om: "Zaytuuna (guwaavaa)", ar: "الجوافة" } },
  { key: "dates", group: "fruits", name: { en: "Dates", am: "ተምር", om: "Timira", ar: "التمر" } },
  { key: "grapes", group: "fruits", name: { en: "Grapes", am: "ወይን", om: "Wayinii", ar: "العنب" } },

  // Spices
  { key: "ginger", group: "spices", name: { en: "Ginger", am: "ዝንጅብል", om: "Jinjibila", ar: "الزنجبيل" } },
  { key: "garlic", group: "spices", name: { en: "Garlic", am: "ነጭ ሽንኩርት", om: "Qullubbii adii", ar: "الثوم" } },
  { key: "turmeric", group: "spices", name: { en: "Turmeric", am: "እርድ", om: "Irdii", ar: "الكركم" } },
  { key: "korarima", group: "spices", name: { en: "Korarima (Ethiopian cardamom)", am: "ኮረሪማ", om: "Korarimaa", ar: "الحبهان الإثيوبي" } },
  { key: "black_cumin", group: "spices", name: { en: "Black cumin", am: "ጥቁር አዝሙድ", om: "Abasuudaa gurraacha", ar: "الحبة السوداء" } },
  { key: "coriander", group: "spices", name: { en: "Coriander", am: "ድምብላል", om: "Dimbilaala", ar: "الكزبرة" } },
  { key: "white_cumin", group: "spices", name: { en: "White cumin", am: "ነጭ አዝሙድ", om: "Kamuunii", ar: "الكمون" } },
  { key: "fenugreek", group: "spices", name: { en: "Fenugreek", am: "አብሽ", om: "Sunqoo", ar: "الحلبة" } },

  // Anything else
  { key: "other", group: "other", name: { en: "Other crop", am: "ሌላ ሰብል", om: "Midhaan biraa", ar: "محصول آخر" } },
];

const BY_KEY = new Map(CROPS.map((crop) => [crop.key, crop]));

/** The crop's name in the visitor's language, or "" for an unknown key. */
export function cropName(key: string, locale: Locale) {
  return BY_KEY.get(key)?.name[locale] ?? "";
}

/** The crops most Ethiopian farmers grow, listed first so they are found without scrolling. */
export const COMMON_CROPS: readonly string[] = ["teff", "maize", "wheat", "sorghum", "barley", "faba_bean", "coffee", "sesame"];
