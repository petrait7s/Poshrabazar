import { StoreDirectory } from "@/components/StoreDirectory";
import { Breadcrumb } from "@/components/ui/misc";
export const metadata = { title: "দোকান" };
export default function Page() {
  return (
    <div className="container-x py-8">
      <Breadcrumb items={[{ label: "হোম", href: "/" }, { label: "দোকান" }]} />
      <h1 className="mt-4 text-[28px]">দোকান</h1>
      <p className="mb-5 mt-1 font-bn text-sm text-muted">ক্যাটাগরি ও পণ্যের উৎস ধরে দোকান খুঁজুন। এই তালিকা নমুনা (ডেমো)।</p>
      <StoreDirectory />
    </div>
  );
}
