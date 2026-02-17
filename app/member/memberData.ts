import {galleryItems} from "../gallery/galleryData";
import type {CatsEyeSaveData} from "../types";

export interface MemberProfile {
  nameJa: string;
  nameEn: string;
  title: string;
  catData: CatsEyeSaveData;
}

const members: Omit<MemberProfile, "catData">[] = [
  {nameJa: "秋澤瑞穂", nameEn: "Mizuho Akizawa", title: "コピーライター／CMプランナー"},
  {nameJa: "上杉剛弘", nameEn: "Takehiro Uesugi", title: "獣医師／コンサルタント"},
  {nameJa: "大瀧篤", nameEn: "Atsushi Otaki", title: "クリエイティブ・ディレクター／クリエイティブ・テクノロジスト"},
  {nameJa: "澤井有香", nameEn: "Yuka Sawai", title: "コンサルタント"},
  {nameJa: "関陽子", nameEn: "Yoko Seki", title: "コピーライター／クリエイティブ・ディレクター"},
  {nameJa: "高瀬未央", nameEn: "Mio Takase", title: "アートディレクター"},
  {nameJa: "なかのかな", nameEn: "Kana Nakano", title: "クリエイティブ・テクノロジスト／リサーチャー"},
  {nameJa: "中村恵", nameEn: "Megumi Nakamura", title: "コミュニケーション・プランナー"},
  {nameJa: "中山桃歌", nameEn: "Momoka Nakayama", title: "クリエイティブ・テクノロジスト"},
  {nameJa: "根岸桃子", nameEn: "Momoko Negishi", title: "アートディレクター"},
  {nameJa: "若園祐作", nameEn: "Yusaku Wakazono", title: "クリエイティブ・テクノロジスト"},
  {nameJa: "宮下良介", nameEn: "Ryosuke Miyashita", title: ""},
];

export const memberProfiles: MemberProfile[] = members.map((m, i) => ({
  ...m,
  catData: galleryItems[i % galleryItems.length],
}));
