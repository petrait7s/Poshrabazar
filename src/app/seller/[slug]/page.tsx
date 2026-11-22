import { redirect } from "next/navigation";
import { sellers } from "@/data/catalog";
export const generateStaticParams = () => sellers.map((s) => ({ slug: s.slug }));
export default async function Page({ params }: { params: Promise<{ slug: string }> }) { redirect(`/stores/${(await params).slug}`); }
