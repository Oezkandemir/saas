import { Metadata } from "next";

import { constructMetadata } from "@/lib/utils";

export const metadata: Metadata = constructMetadata({
  title: "Product",
  description: "Product information and features",
});

interface ProductLayoutProps {
  children: React.ReactNode;
}

export default function ProductLayout({ children }: ProductLayoutProps) {
  return (
    <div className="w-full py-12">
      <div className="space-y-8">{children}</div>
    </div>
  );
}
