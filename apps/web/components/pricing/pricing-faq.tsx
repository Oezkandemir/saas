"use client";

import { HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function PricingFaq() {
  const t = useTranslations("Pricing.faq");

  const pricingFaqData = [
    {
      id: "item-1",
      question: t("questions.q1.question"),
      answer: t("questions.q1.answer"),
    },
    {
      id: "item-2",
      question: t("questions.q2.question"),
      answer: t("questions.q2.answer"),
    },
    {
      id: "item-3",
      question: t("questions.q3.question"),
      answer: t("questions.q3.answer"),
    },
    {
      id: "item-4",
      question: t("questions.q4.question"),
      answer: t("questions.q4.answer"),
    },
    {
      id: "item-5",
      question: t("questions.q5.question"),
      answer: t("questions.q5.answer"),
    },
  ];
  return (
    <MaxWidthWrapper>
      <section className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground mb-4">
            <HelpCircle className="size-4" />
            {t("badge")}
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            {t("title")}
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            {t("description")}
          </p>
        </div>

        {/* Accordion */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {pricingFaqData.map((faqItem) => (
              <AccordionItem
                key={faqItem.id}
                value={faqItem.id}
                className="rounded-lg border bg-card px-4 transition-all hover:bg-muted/50"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-4">
                  {faqItem.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed sm:text-base">
                  {faqItem.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </MaxWidthWrapper>
  );
}
