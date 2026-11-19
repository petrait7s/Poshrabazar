import { EmptyState } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
export default function NotFound() { return <div className="container-x py-20"><EmptyState title="পাতাটি পাওয়া যায়নি" text="লিংকটি ভুল বা পাতাটি সরানো হয়েছে।" action={<LinkButton href="/">হোমে ফিরুন</LinkButton>} /></div>; }
