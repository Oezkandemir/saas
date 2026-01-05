import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { constructMetadata } from "@/lib/utils";

export const metadata: Metadata = constructMetadata({
  title: "Impressum",
  description: "Impressum und Angaben gemäß § 5 TMG",
});

export default async function ImprintPage() {
  const t = await getTranslations("Imprint");

  return (
    <div className="container mx-auto max-w-4xl py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">{t("company.title")}</h2>
            <div className="rounded-lg border bg-muted/30 p-6">
              <div className="space-y-2">
                <p className="font-medium">[Ihr Firmenname]</p>
                <p>[Rechtsform, z.B. GmbH, UG, Einzelunternehmen]</p>
                <p>[Straße und Hausnummer]</p>
                <p>[PLZ Stadt]</p>
                <p>[Land]</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">{t("contact.title")}</h2>
            <div className="rounded-lg border bg-muted/30 p-6">
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Telefon:</span> [Ihre
                  Telefonnummer]
                </p>
                <p>
                  <span className="font-medium">E-Mail:</span>{" "}
                  <a
                    href="mailto:info@cenety.com"
                    className="text-primary hover:underline"
                  >
                    info@cenety.com
                  </a>
                </p>
                <p>
                  <span className="font-medium">Website:</span>{" "}
                  <a
                    href="https://cenety.com"
                    className="text-primary hover:underline"
                  >
                    https://cenety.com
                  </a>
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">
              {t("registration.title")}
            </h2>
            <div className="rounded-lg border bg-muted/30 p-6">
              <div className="space-y-2">
                <p>
                  <span className="font-medium">
                    {t("registration.registrationCourt")}:
                  </span>{" "}
                  [z.B. Amtsgericht München]
                </p>
                <p>
                  <span className="font-medium">
                    {t("registration.registrationNumber")}:
                  </span>{" "}
                  [z.B. HRB 123456]
                </p>
                <p>
                  <span className="font-medium">
                    {t("registration.vatId")}:
                  </span>{" "}
                  [DE123456789]
                </p>
                <p>
                  <span className="font-medium">
                    {t("registration.managingDirector")}:
                  </span>{" "}
                  [Name des Geschäftsführers]
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">{t("responsible.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("responsible.description")}
            </p>
            <div className="rounded-lg border bg-muted/30 p-6">
              <div className="space-y-2">
                <p className="font-medium">[Name des Verantwortlichen]</p>
                <p>[Straße und Hausnummer]</p>
                <p>[PLZ Stadt]</p>
                <p>
                  E-Mail:{" "}
                  <a
                    href="mailto:info@cenety.com"
                    className="text-primary hover:underline"
                  >
                    info@cenety.com
                  </a>
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">{t("dispute.title")}</h2>
            <div className="rounded-lg border bg-yellow-50 p-6 dark:bg-yellow-900/20">
              <p className="text-sm">{t("dispute.euPlatform")}</p>
              <p className="mt-2">
                <a
                  href="https://ec.europa.eu/consumers/odr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  https://ec.europa.eu/consumers/odr
                </a>
              </p>
              <p className="mt-4 text-sm">{t("dispute.participation")}</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">{t("liability.title")}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">
                  {t("liability.contentTitle")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("liability.contentText")}
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">
                  {t("liability.linksTitle")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("liability.linksText")}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">{t("copyright.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("copyright.text")}
            </p>
          </section>

          <section className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              ⚠️ Hinweis: Bitte ersetzen Sie alle Platzhalter in eckigen
              Klammern [wie diese] mit Ihren tatsächlichen Firmendaten. Lassen
              Sie das Impressum von einem Rechtsanwalt prüfen, um die
              vollständige Konformität mit § 5 TMG sicherzustellen.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
