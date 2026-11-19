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
export type Area = { division: string; district: string };
export const noArea: Area = { division: "", district: "" };
export const divisionOf = (district: string) => divisions.find((d) => d.districts.includes(district))?.bn ?? "";
export const areaLabel = (a: Area) => (a.district ? `${a.district}, ${a.division}` : a.division ? `${a.division} বিভাগ` : "সারা বাংলাদেশ");
export const inArea = (a: Area, sellerDistrict: string, sellerDivision: string) =>
  a.district ? sellerDistrict === a.district : a.division ? sellerDivision === a.division : true;
