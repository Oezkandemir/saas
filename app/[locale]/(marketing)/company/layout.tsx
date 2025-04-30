import { Metadata } from "next";
import { constructMetadata } from "@/lib/utils";

export const metadata: Metadata = constructMetadata({
  title: "Company",
  description: "Company information and legal pages",
});

interface CompanyLayoutProps {
  children: React.ReactNode;
}

export default function CompanyLayout({ children }: CompanyLayoutProps) {
  return (
    <div className="container max-w-4xl py-12">
      <div className="space-y-8">
        {children}
      </div>
    </div>
  );
} 