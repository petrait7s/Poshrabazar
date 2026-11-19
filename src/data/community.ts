// DEMO community data. Real profiles/posts will come from the backend.
import { sellers } from "./catalog";

export type Member = { slug: string; name: string; role: "seller" | "buyer"; location: string; verified: boolean; bio: string; followers: number };
export type Media = { type: "image" | "video"; src?: string; motif?: string; productSlug?: string };
export type PostComment = { id: string; author: string; text: string };
export type Post = { id: string; author: string; text: string; media?: Media; productSlug?: string; ago: string; likes: number; comments: PostComment[]; mine?: boolean };

const buyers: Member[] = [
  { slug: "arif-hossain", name: "আরিফ হোসেন", role: "buyer", location: "ঢাকা", verified: false, bio: "দেশি পণ্য খুঁজি, ভালো লাগলে সবাইকে জানাই।", followers: 42 },
  { slug: "sumi-akter", name: "সুমি আক্তার", role: "buyer", location: "চট্টগ্রাম", verified: false, bio: "রান্না ও মুদি বাজার নিয়ে লিখি।", followers: 87 },
  { slug: "rahman-store", name: "রহমান স্টোর", role: "buyer", location: "খুলনা", verified: false, bio: "ছোট দোকানদার, পাইকারি কিনি।", followers: 31 },
];
export const members: Member[] = [
  ...sellers.map((s) => ({ slug: s.slug, name: s.bn, role: "seller" as const, location: s.location, verified: s.verified, bio: s.desc, followers: Math.round(s.orders / 6) })),
  ...buyers,
];
export const getMember = (slug: string) => members.find((m) => m.slug === slug);

export const seedPosts: Post[] = [
  { id: "p1", author: "bogura-doi-ghar", text: "আজ সকালের তাজা দই তৈরি হলো। মাটির পাতিলে জমানো, সারা দেশে কুরিয়ারে পাঠাচ্ছি।", media: { type: "image", productSlug: "bogura-doi" }, productSlug: "bogura-doi", ago: "২ ঘণ্টা আগে", likes: 48, comments: [{ id: "c1", author: "sumi-akter", text: "চট্টগ্রামে পাঠান? অর্ডার করতে চাই।" }] },
  { id: "p2", author: "rupganj-jamdani-palli", text: "তাঁতে একটি জামদানির নকশা বোনার প্রক্রিয়া — প্রতিটি শাড়িতে কয়েক সপ্তাহের শ্রম।", media: { type: "video", productSlug: "jamdani-saree" }, productSlug: "jamdani-saree", ago: "৫ ঘণ্টা আগে", likes: 131, comments: [] },
  { id: "p3", author: "arif-hossain", text: "বগুড়ার দই অর্ডার করেছিলাম, দুই দিনে ঢাকায় পৌঁছেছে। স্বাদ দারুণ!", productSlug: "bogura-doi", ago: "গতকাল", likes: 19, comments: [] },
  { id: "p4", author: "coxsbazar-shutki-aarot", text: "এই মৌসুমের নতুন শুটকি এসেছে। রোদে শুকানো, বাছাই করা — পাইকারি দর জানতে মেসেজ করুন।", media: { type: "image", productSlug: "coxsbazar-shutki" }, productSlug: "coxsbazar-shutki", ago: "গতকাল", likes: 36, comments: [] },
  { id: "p5", author: "bogura-farmers-hub", text: "এবার আলুর ফলন ভালো। সরাসরি আড়ত থেকে পাইকারি দরে পাওয়া যাচ্ছে।", media: { type: "image", productSlug: "potato" }, productSlug: "potato", ago: "২ দিন আগে", likes: 27, comments: [] },
  { id: "p6", author: "sumi-akter", text: "শীতলপাটি কিনলাম সিলেট থেকে — গরমে অসাধারণ ঠান্ডা। সবাই একবার দেখুন।", productSlug: "shitalpati", ago: "২ দিন আগে", likes: 54, comments: [] },
  { id: "p7", author: "rajshahi-orchard", text: "হিমসাগর আম পাড়া শুরু হয়েছে। বাগান থেকে সরাসরি ক্রেতার ঘরে।", media: { type: "image", productSlug: "himsagar-mango" }, productSlug: "himsagar-mango", ago: "৩ দিন আগে", likes: 72, comments: [] },
];
