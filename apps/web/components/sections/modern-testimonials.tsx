import { getTranslations } from "next-intl/server";
import Image from "next/image";

import { testimonials } from "@/config/landing";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import { Icons } from "@/components/shared/icons";

interface ModernTestimonialsProps {}

export default async function ModernTestimonials({}: ModernTestimonialsProps) {
  const t = await getTranslations("Testimonials");

  return (
    <section className="relative py-24 sm:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.05),transparent)]" />

      <MaxWidthWrapper className="relative">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-6 text-xl text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="mt-20 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.slice(0, 6).map((testimonial, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card/80 p-8 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-card hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Quote icon */}
              <Icons.quote className="mb-6 size-10 text-primary/30 transition-colors group-hover:text-primary/50" />

              {/* Review text */}
              <p className="mb-8 leading-relaxed text-muted-foreground">
                {testimonial.review}
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <Image
                  src={testimonial.image}
                  alt={testimonial.name}
                  width={56}
                  height={56}
                  className="size-14 rounded-full border-2 border-border transition-transform group-hover:scale-110"
                />
                <div>
                  <div className="font-bold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.job}
                  </div>
                </div>
              </div>

              {/* Hover gradient effect */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {/* Decorative corner */}
              <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </MaxWidthWrapper>
    </section>
  );
}

