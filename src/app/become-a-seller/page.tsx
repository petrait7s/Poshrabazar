import { SellerApplyForm } from "@/components/SellerApplyForm";
import { Breadcrumb } from "@/components/ui/misc";
export const metadata = { title: "বিক্রেতা হোন" };
export default function Page() {
  return (
    <div className="container-x max-w-2xl py-8">
      <Breadcrumb items={[{ label: "হোম", href: "/" }, { label: "বিক্রেতা হোন" }]} />
      <h1 className="mb-1 mt-4 text-[28px]">বিক্রেতা হোন</h1>
      <p className="mb-6 font-bn text-sm text-ink/70">কৃষক, উৎপাদক, তরুণ উদ্যোক্তা বা ব্যবসা, যে কেউ আবেদন করতে পারেন। অনুমোদনের পর নিজের দোকান ও ড্যাশবোর্ড পাবেন। এই সংস্করণ প্রিভিউ: তথ্য শুধু আপনার ব্রাউজারে থাকে।</p>
      <SellerApplyForm />
    </div>
  );
}
