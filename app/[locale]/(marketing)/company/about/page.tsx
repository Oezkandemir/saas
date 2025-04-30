import { Metadata } from "next";
import { constructMetadata } from "@/lib/utils";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = constructMetadata({
  title: "About Us",
  description: "Learn more about Cenety, our mission and vision",
});

export default async function AboutPage() {
  const t = await getTranslations("Footer");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">About Cenety</h1>
      
      <p className="text-muted-foreground">
        Founded in 2023, Cenety is a company dedicated to helping businesses and developers create exceptional
        SaaS applications with modern technologies.
      </p>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Our Mission</h2>
        <p>
          We&apos;re on a mission to simplify the development process and empower creators to build
          exceptional software applications without getting bogged down in repetitive tasks and configurations.
        </p>
        
        <h2 className="text-2xl font-semibold">Our Vision</h2>
        <p>
          We envision a world where building robust SaaS applications is accessible to all developers,
          regardless of their experience level or resources. By providing high-quality starter kits and
          templates, we aim to democratize SaaS development and help businesses launch faster.
        </p>
        
        <h2 className="text-2xl font-semibold">Our Values</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li><strong>Quality:</strong> We believe in creating high-quality, well-documented code that stands the test of time.</li>
          <li><strong>Innovation:</strong> We embrace new technologies and continuously improve our products.</li>
          <li><strong>Accessibility:</strong> We make development more accessible by providing clear documentation and intuitive interfaces.</li>
          <li><strong>Community:</strong> We value the developer community and actively contribute to open-source projects.</li>
        </ul>
        
        <h2 className="text-2xl font-semibold">Our Team</h2>
        <p>
          Our team consists of passionate developers, designers, and product managers who are dedicated to
          creating exceptional developer experiences. We&apos;re located around the world and embrace remote work
          and diverse perspectives.
        </p>
      </div>
    </div>
  );
} 