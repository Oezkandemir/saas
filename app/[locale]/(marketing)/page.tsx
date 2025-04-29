import { infos } from "@/config/landing";
import BentoGrid from "@/components/sections/bentogrid";
import Features from "@/components/sections/features";
import HeroLanding from "@/components/sections/hero-landing";
import InfoLanding from "@/components/sections/info-landing";
import Powered from "@/components/sections/powered";
import PreviewLanding from "@/components/sections/preview-landing";
import Testimonials from "@/components/sections/testimonials";

interface PageProps {
  params: {
    locale: string;
  };
}

export default async function IndexPage({ params }: PageProps) {
  // Next.js 15 requires params to be awaited
  const resolvedParams = await params;
  const { locale } = resolvedParams;
  
  return (
    <>
      <HeroLanding />
      <PreviewLanding />
      <Powered />
      <BentoGrid />
      <InfoLanding 
        data={infos[0]} 
        reverse={true} 
        infoKey="empower" 
        locale={locale}
      />
      {/* Uncomment to enable the second info section
      <InfoLanding 
        data={infos[1]}
        infoKey="integration"
        locale={locale} 
      /> */}
      <Features locale={locale} />
      <Testimonials locale={locale} />
    </>
  );
}
