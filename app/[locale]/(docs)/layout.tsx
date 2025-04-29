import { SiteFooter } from "@/components/layout/site-footer";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import { DocsLanguageProvider } from "@/components/docs/docs-language-provider";
import { DocsNavbarWrapper } from "@/components/docs/docs-navbar-wrapper";
import { DocsMobileNavWrapper } from "@/components/docs/docs-mobile-nav-wrapper";

interface DocsLayoutProps {
  children: React.ReactNode;
}

export default function DocsLayout({ children }: DocsLayoutProps) {
  return (
    <DocsLanguageProvider>
      <div className="flex flex-col">
        <DocsMobileNavWrapper />
        <DocsNavbarWrapper />
        <MaxWidthWrapper className="min-h-screen" large>
          {children}
        </MaxWidthWrapper>
        <SiteFooter className="border-t" />
      </div>
    </DocsLanguageProvider>
  );
}
