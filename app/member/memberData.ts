import type {CatsEyeSaveData} from "../types";
import {galleryFiles} from "../gallery/galleryData";

export interface MemberProfile {
  nameJa: string;
  nameEn: string;
  title: string;
  comment: string;
  catData: CatsEyeSaveData | null;
}

const members: Omit<MemberProfile, "catData">[] = [
  {nameJa: "秋澤瑞穂", nameEn: "Mizuho Akizawa", title: "コピーライター／CMプランナー", comment: "“かわいい”だけじゃない、命と向き合うということ。看病からペットロスまでの経験を生かしたい"},
  {nameJa: "上杉剛弘", nameEn: "Takehiro Uesugi", title: "獣医師／コンサルタント", comment: "２週に1度は動物園・水族館に行かないと落ち着かないんです。※上野・葛西・多摩の年間パス持ってます"},
  {nameJa: "大瀧篤", nameEn: "Atsushi Otaki", title: "クリエイティブ・ディレクター／クリエイティブ・テクノロジスト", comment: "猫のおかげで兄弟なかよくできた。奮闘中の育児に、猫が与える影響に関心があります"},
  {nameJa: "澤井有香", nameEn: "Yuka Sawai", title: "コンサルタント", comment: "保護猫を迎えてから、“ゆかいな生物多様性”をモットーに活動しています"},
  {nameJa: "関陽子", nameEn: "Yoko Seki", title: "コピーライター／クリエイティブ・ディレクター", comment: "猫大好きだけど猫の毛アレルギー。そのもどかしい愛を原動力に"},
  {nameJa: "高瀬未央", nameEn: "Mio Takase", title: "アートディレクター", comment: "うちの猫が時折見せる、人間っぽい行動の謎に迫りたい！"},
  {nameJa: "なかのかな", nameEn: "Kana Nakano", title: "クリエイティブ・テクノロジスト／リサーチャー", comment: "necomimiという製品企画に関わったことがあり、猫に恩返しがしたいです"},
  {nameJa: "中村恵", nameEn: "Megumi Nakamura", title: "コミュニケーション・プランナー", comment: "猫が遊ぶだけで、健康状態を測定できるおもちゃを作りたい"},
  {nameJa: "中山桃歌", nameEn: "Momoka Nakayama", title: "クリエイティブ・テクノロジスト", comment: "感動的ですらある猫の身体感覚を、自分自身に宿らせたい！"},
  {nameJa: "根岸桃子", nameEn: "Momoko Negishi", title: "アートディレクター", comment: "最大6匹のヒマラヤンに埋もれて育った、根っからの猫派です"},
  {nameJa: "若園祐作", nameEn: "Yusaku Wakazono", title: "クリエイティブ・テクノロジスト", comment: "猫の幸せのためには、まず猫の気持ちを知るところから"},
  {nameJa: "宮下良介", nameEn: "Ryosuke Miyashita", title: "", comment: "ふみふみで発電する照明をつくりたい"},
];

export const memberList = members;

export async function loadMemberProfiles(): Promise<MemberProfile[]> {
  const catDataList = await Promise.all(
    galleryFiles.map((file) =>
      fetch(`/cat_data/${file}`).then((res) => res.json())
    )
  );
  return members.map((m, i) => ({
    ...m,
    catData: catDataList[i % catDataList.length],
  }));
}
