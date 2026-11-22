import { redirect } from "next/navigation";
import { categories } from "@/data/catalog";
export const generateStaticParams = () => categories.map((c) => ({ slug: c.slug }));
export default async function Page({ params }: { params: Promise<{ slug: string }> }) { redirect(`/categories/${(await params).slug}`); }
