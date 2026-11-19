import { Suspense } from "react";
import { SearchResults } from "./SearchResults";
export const metadata = { title: "অনুসন্ধান" };
export default function Page() { return <Suspense fallback={<div className="container-x py-16 font-bn">লোড হচ্ছে…</div>}><SearchResults /></Suspense>; }
