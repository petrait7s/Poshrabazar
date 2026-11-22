import { notFound } from "next/navigation";
import { ProfileView } from "./ProfileView";
import { members, getMember } from "@/data/community";
export const generateStaticParams = () => members.map((m) => ({ slug: m.slug }));
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getMember(slug)) notFound();
  return <ProfileView slug={slug} />;
}
