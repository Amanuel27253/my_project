export const NORTH_SHEWA_WOREDAS = [
  // City & Town Administrations
  { woredaCode: "NSZ-W01", nameEn: "Debre Berhan City Administration", nameAm: "ደብረ ብርሃን ከተማ አስተዳደር", type: "CITY_ADMIN" },
  { woredaCode: "NSZ-W02", nameEn: "Shewa Robit Town Administration", nameAm: "ሸዋ ሮቢት ከተማ አስተዳደር", type: "CITY_ADMIN" },
  { woredaCode: "NSZ-W03", nameEn: "Ataye (Efeson) Town Administration", nameAm: "አጣዬ (ኤፌሶን) ከተማ አስተዳደር", type: "CITY_ADMIN" },
  { woredaCode: "NSZ-W04", nameEn: "Alem Ketema Town Administration", nameAm: "ዓለም ከተማ አስተዳደር", type: "CITY_ADMIN" },
  { woredaCode: "NSZ-W05", nameEn: "Mehal Meda Town Administration", nameAm: "መሐል ሜዳ ከተማ አስተዳደር", type: "CITY_ADMIN" },
  { woredaCode: "NSZ-W06", nameEn: "Arerti Town Administration", nameAm: "አረርቲ ከተማ አስተዳደር", type: "CITY_ADMIN" },

  // 22 Rural Woredas
  { woredaCode: "NSZ-W07", nameEn: "Angolelana Tera", nameAm: "አንጎለላና ጠራ", type: "RURAL_WOREDA" },
  { woredaCode: "NSZ-W08", nameEn: "Ankober", nameAm: "አንኮበር", type: "RURAL_WOREDA" },
  { woredaCode: "NSZ-W09", nameEn: "Antsokiyana Gemza", nameAm: "አንጾኪያና ገምዛ", type: "RURAL_WOREDA" },
  { woredaCode: "NSZ-W10", nameEn: "Asagirt", nameAm: "አሳግርት", type: "RURAL_WOREDA" },
  { woredaCode: "NSZ-W11", nameEn: "Basona Werana", nameAm: "ባሶና ወራና", type: "RURAL_WOREDA" },
  { woredaCode: "NSZ-W12", nameEn: "Berehet", nameAm: "በረኸት", type: "RURAL_WOREDA" },
  { woredaCode: "NSZ-W13", nameEn: "Efratana Gidim", nameAm: "ኤፍራታና ግድም", type: "RURAL_WOREDA" },
  { woredaCode: "NSZ-W14", nameEn: "Ensaro", nameAm: "እንሳሮ", type: "RURAL_WOREDA" },
  { woredaCode: "NSZ-W15", nameEn: "Gishe Rabel", nameAm: "ግሼ ራቤል", type: "RURAL_WOREDA" },
  { woredaCode: "NSZ-W16", nameEn: "Hagere Mariamna Kesem", nameAm: "ሀገረ ማርያምና ከሰም", type: "RURAL_WOREDA" },
  { woredaCode: "NSZ-W17", nameEn: "Kewet", nameAm: "ቀወት", type: "RURAL_WOREDA" },
  { woredaCode: "NSZ-W18", nameEn: "Menz Gera Midir", nameAm: "መንዝ ጌራ ምድር", type: "RURAL_WOREDA" },
  { woredaCode: "NSZ-W19", nameEn: "Menz Keya Gebreal", nameAm: "መንዝ ቀያ ገብርኤል", type: "RURAL_WOREDA" },
  { woredaCode: "NSZ-W20", nameEn: "Menz Lalo Midir", nameAm: "መንዝ ላሎ ምድር", type: "RURAL_WOREDA" },
  { woredaCode: "NSZ-W21", nameEn: "Menz Mama Midir", nameAm: "መንዝ ማማ ምድር", type: "RURAL_WOREDA" },
  { woredaCode: "NSZ-W22", nameEn: "Merhabete", nameAm: "መርሐ ቤቴ", type: "RURAL_WOREDA" },
  { woredaCode: "NSZ-W23", nameEn: "Mida Woremo", nameAm: "ሚዳ ወረሞ", type: "RURAL_WOREDA" },
  { woredaCode: "NSZ-W24", nameEn: "Minjarna Shenkora", nameAm: "ምንጃርና ሸንኮራ", type: "RURAL_WOREDA" },
  { woredaCode: "NSZ-W25", nameEn: "Mojana Wadera", nameAm: "ሞጃና ወደራ", type: "RURAL_WOREDA" },
  { woredaCode: "NSZ-W26", nameEn: "Moretna Jiru", nameAm: "ሞረትና ጅሩ", type: "RURAL_WOREDA" },
  { woredaCode: "NSZ-W27", nameEn: "Siyadebrina Wayu", nameAm: "ሲያደብርና ዋዩ", type: "RURAL_WOREDA" },
  { woredaCode: "NSZ-W28", nameEn: "Tarmaber", nameAm: "ጣርማ በር", type: "RURAL_WOREDA" }
];

// Default Case Study Kebele Seed (Debre Berhan City -> Baso Kebele)
export const INITIAL_KEBELES = [
  {
    woredaCode: "NSZ-W01",
    kebeleCode: "NSZ-W01-K04",
    nameEn: "Baso Kebele",
    nameAm: "ባሶ ቀበሌ",
    cooperativeStoreNameEn: "Baso Kebele Consumer Cooperative Store",
    cooperativeStoreNameAm: "የባሶ ቀበሌ ሸማቾች ኅብረት ሥራ ማኅበር መደብር"
  }
];

export default {
  NORTH_SHEWA_WOREDAS,
  INITIAL_KEBELES
};
