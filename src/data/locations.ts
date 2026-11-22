export type Division = { bn: string; en: string; districts: string[] };
export const divisions: Division[] = [
  { bn: "ঢাকা", en: "Dhaka", districts: ["ঢাকা", "গাজীপুর", "নারায়ণগঞ্জ", "নরসিংদী", "মানিকগঞ্জ", "মুন্সিগঞ্জ", "কিশোরগঞ্জ", "টাঙ্গাইল", "ফরিদপুর", "গোপালগঞ্জ", "মাদারীপুর", "রাজবাড়ী", "শরীয়তপুর"] },
  { bn: "চট্টগ্রাম", en: "Chattogram", districts: ["চট্টগ্রাম", "কক্সবাজার", "কুমিল্লা", "ফেনী", "নোয়াখালী", "লক্ষ্মীপুর", "চাঁদপুর", "ব্রাহ্মণবাড়িয়া", "খাগড়াছড়ি", "রাঙামাটি", "বান্দরবান"] },
  { bn: "রাজশাহী", en: "Rajshahi", districts: ["রাজশাহী", "বগুড়া", "পাবনা", "সিরাজগঞ্জ", "নাটোর", "নওগাঁ", "চাঁপাইনবাবগঞ্জ", "জয়পুরহাট"] },
  { bn: "খুলনা", en: "Khulna", districts: ["খুলনা", "যশোর", "সাতক্ষীরা", "বাগেরহাট", "কুষ্টিয়া", "মেহেরপুর", "চুয়াডাঙ্গা", "ঝিনাইদহ", "মাগুরা", "নড়াইল"] },
  { bn: "বরিশাল", en: "Barishal", districts: ["বরিশাল", "পটুয়াখালী", "ভোলা", "পিরোজপুর", "ঝালকাঠি", "বরগুনা"] },
  { bn: "সিলেট", en: "Sylhet", districts: ["সিলেট", "মৌলভীবাজার", "হবিগঞ্জ", "সুনামগঞ্জ"] },
  { bn: "রংপুর", en: "Rangpur", districts: ["রংপুর", "দিনাজপুর", "গাইবান্ধা", "কুড়িগ্রাম", "লালমনিরহাট", "নীলফামারী", "পঞ্চগড়", "ঠাকুরগাঁও"] },
  { bn: "ময়মনসিংহ", en: "Mymensingh", districts: ["ময়মনসিংহ", "জামালপুর", "শেরপুর", "নেত্রকোণা"] },
];
export type Area = { division: string; district: string; upazila?: string };
export const noArea: Area = { division: "", district: "" };
export const divisionOf = (district: string) => divisions.find((d) => d.districts.includes(district))?.bn ?? "";
export const areaLabel = (a: Area) => (a.upazila ? `${a.upazila}, ${a.district}` : a.district ? `${a.district}, ${a.division}` : a.division ? `${a.division} বিভাগ` : "সারা বাংলাদেশ");
export const inArea = (a: Area, sellerDistrict: string, sellerDivision: string) =>
  a.district ? sellerDistrict === a.district : a.division ? sellerDivision === a.division : true;

/** Upazilas for the launch region (Sylhet division). Other districts are added when we expand. Coordinates are intentionally not guessed here. */
export const upazilas: Record<string, { bn: string; en: string }[]> = {
  "সিলেট": [["সিলেট সদর", "Sylhet Sadar"], ["দক্ষিণ সুরমা", "Dakshin Surma"], ["বালাগঞ্জ", "Balaganj"], ["বিয়ানীবাজার", "Beanibazar"], ["বিশ্বনাথ", "Bishwanath"], ["কোম্পানীগঞ্জ", "Companiganj"], ["ফেঞ্চুগঞ্জ", "Fenchuganj"], ["গোলাপগঞ্জ", "Golapganj"], ["গোয়াইনঘাট", "Gowainghat"], ["জৈন্তাপুর", "Jaintiapur"], ["কানাইঘাট", "Kanaighat"], ["জকিগঞ্জ", "Zakiganj"], ["ওসমানী নগর", "Osmani Nagar"]].map(([bn, en]) => ({ bn, en })),
  "মৌলভীবাজার": [["মৌলভীবাজার সদর", "Moulvibazar Sadar"], ["শ্রীমঙ্গল", "Sreemangal"], ["কুলাউড়া", "Kulaura"], ["কমলগঞ্জ", "Kamalganj"], ["বড়লেখা", "Barlekha"], ["জুড়ী", "Juri"], ["রাজনগর", "Rajnagar"]].map(([bn, en]) => ({ bn, en })),
  "হবিগঞ্জ": [["হবিগঞ্জ সদর", "Habiganj Sadar"], ["নবীগঞ্জ", "Nabiganj"], ["বাহুবল", "Bahubal"], ["বানিয়াচং", "Baniachong"], ["লাখাই", "Lakhai"], ["মাধবপুর", "Madhabpur"], ["চুনারুঘাট", "Chunarughat"], ["আজমিরীগঞ্জ", "Ajmiriganj"], ["শায়েস্তাগঞ্জ", "Shaistaganj"]].map(([bn, en]) => ({ bn, en })),
  "সুনামগঞ্জ": [["সুনামগঞ্জ সদর", "Sunamganj Sadar"], ["দক্ষিণ সুনামগঞ্জ", "Dakshin Sunamganj"], ["ছাতক", "Chhatak"], ["জগন্নাথপুর", "Jagannathpur"], ["বিশ্বম্ভরপুর", "Bishwamvarpur"], ["দোয়ারাবাজার", "Dowarabazar"], ["ধর্মপাশা", "Dharmapasha"], ["দিরাই", "Derai"], ["জামালগঞ্জ", "Jamalganj"], ["শাল্লা", "Shalla"], ["শান্তিগঞ্জ", "Shantiganj"], ["তাহিরপুর", "Tahirpur"]].map(([bn, en]) => ({ bn, en })),
};
