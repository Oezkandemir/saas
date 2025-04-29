import Image from "next/image";
import { InfoLdg } from "@/types";

import { cn } from "@/lib/utils";
import { Icons } from "@/components/shared/icons";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

interface InfoLandingProps {
  data: InfoLdg;
  reverse?: boolean;
  infoKey: "empower" | "integration";
  locale?: string;
}

// German translations for InfoLanding
const deTranslations = {
  empower: {
    title: "Stärken Sie Ihre Projekte",
    description: "Entfalten Sie das volle Potenzial Ihrer Projekte mit unserer Open-Source-SaaS-Plattform. Arbeiten Sie nahtlos zusammen, innovieren Sie mühelos und skalieren Sie grenzenlos.",
    collaborative: {
      title: "Kollaborativ",
      description: "Arbeiten Sie in Echtzeit mit Ihren Teammitgliedern zusammen."
    },
    innovative: {
      title: "Innovativ",
      description: "Bleiben Sie mit ständigen Updates der Konkurrenz einen Schritt voraus."
    },
    scalable: {
      title: "Skalierbar",
      description: "Unsere Plattform bietet die Skalierbarkeit, die Sie benötigen, um sich an Ihre Anforderungen anzupassen."
    }
  },
  integration: {
    title: "Nahtlose Integration",
    description: "Integrieren Sie unsere Open-Source-SaaS nahtlos in Ihre bestehenden Arbeitsabläufe. Verbinden Sie mühelos Ihre Lieblingstools und -dienste für eine optimierte Erfahrung.",
    flexible: {
      title: "Flexibel",
      description: "Passen Sie Ihre Integrationen an Ihre individuellen Anforderungen an."
    },
    efficient: {
      title: "Effizient",
      description: "Optimieren Sie Ihre Prozesse und reduzieren Sie den manuellen Aufwand."
    },
    reliable: {
      title: "Zuverlässig",
      description: "Verlassen Sie sich auf unsere robuste Infrastruktur und umfassende Dokumentation."
    }
  }
};

export default function InfoLanding({
  data,
  reverse = false,
  infoKey,
  locale = "en",
}: InfoLandingProps) {
  // Get translations based on locale and info key
  const getLocalizedContent = () => {
    // Use German translations if locale is 'de'
    if (locale === 'de' && deTranslations[infoKey]) {
      return deTranslations[infoKey];
    }
    
    // Default to English/original content from the data object
    return {
      title: data.title,
      description: data.description
    };
  };
  
  // Get localized content for the main section
  const localizedContent = getLocalizedContent();
  
  // Function to get localized list item content
  const getLocalizedListItem = (item) => {
    const itemKey = item.title.toLowerCase();
    
    if (locale === 'de' && 
        deTranslations[infoKey] && 
        deTranslations[infoKey][itemKey]) {
      return {
        title: deTranslations[infoKey][itemKey].title,
        description: deTranslations[infoKey][itemKey].description
      };
    }
    
    return {
      title: item.title,
      description: item.description
    };
  };

  return (
    <div className="py-10 sm:py-20">
      <MaxWidthWrapper className="grid gap-10 px-2.5 lg:grid-cols-2 lg:items-center lg:px-7">
        <div className={cn(reverse ? "lg:order-2" : "lg:order-1")}>
          <h2 className="font-heading text-2xl text-foreground md:text-4xl lg:text-[40px]">
            {localizedContent.title}
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            {localizedContent.description}
          </p>
          <dl className="mt-6 space-y-4 leading-7">
            {data.list.map((item, index) => {
              const Icon = Icons[item.icon || "arrowRight"];
              const localizedItem = getLocalizedListItem(item);
              
              return (
                <div className="relative pl-8" key={index}>
                  <dt className="font-semibold">
                    <Icon className="absolute left-0 top-1 size-5 stroke-purple-700" />
                    <span>{localizedItem.title}</span>
                  </dt>
                  <dd className="text-sm text-muted-foreground">
                    {localizedItem.description}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
        <div
          className={cn(
            "overflow-hidden rounded-xl border lg:-m-4",
            reverse ? "order-1" : "order-2",
          )}
        >
          <div className="aspect-video">
            <Image
              className="size-full object-cover object-center"
              src={data.image}
              alt={localizedContent.title}
              width={1000}
              height={500}
              priority={true}
            />
          </div>
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
