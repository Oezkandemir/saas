import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

const pricingFaqData = [
  {
    id: "item-1",
    question: "Was ist ein dynamischer QR-Code?",
    answer:
      "Ein dynamischer QR-Code ist ein QR-Code, dessen Ziel-URL Sie jederzeit ändern können, ohne den Code selbst neu drucken zu müssen. Der QR-Code bleibt gleich, aber die Zieladresse kann aktualisiert werden.",
  },
  {
    id: "item-2",
    question: "Kann ich den Link später ändern?",
    answer:
      "Ja, absolut! Mit dynamischen QR-Codes können Sie die Ziel-URL jederzeit ändern, ohne den QR-Code neu zu generieren oder zu drucken. Einmal gedruckt, bleibt der Code gültig, während Sie das Ziel flexibel anpassen können.",
  },
  {
    id: "item-3",
    question: "Wie funktioniert die Rechnungserstellung?",
    answer:
      "Sie können Angebote erstellen und diese später direkt in Rechnungen umwandeln. Alle Daten werden automatisch übernommen. Die Dokumente können als PDF exportiert und per E-Mail versendet werden.",
  },
  {
    id: "item-4",
    question: "Was passiert, wenn ich mein Limit erreiche?",
    answer:
      "Wenn Sie Ihr Limit erreichen, können Sie entweder auf einen höheren Plan upgraden oder warten, bis der Zähler im nächsten Monat zurückgesetzt wird. Bei Dokumenten wird der Zähler monatlich zurückgesetzt.",
  },
  {
    id: "item-5",
    question: "Kann ich jederzeit upgraden oder downgraden?",
    answer:
      "Ja, Sie können jederzeit zwischen den Plänen wechseln. Beim Upgrade werden die zusätzlichen Features sofort freigeschaltet. Beim Downgrade bleiben Ihre Daten erhalten, aber einige Features werden eingeschränkt.",
  },
];

export function PricingFaq() {
  return (
    <MaxWidthWrapper>
      <section className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground mb-4">
            <HelpCircle className="h-4 w-4" />
            FAQ
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            Häufig gestellte Fragen
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            Finden Sie schnelle Antworten auf häufige Fragen. Bei weiteren Fragen kontaktieren Sie uns gerne.
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
