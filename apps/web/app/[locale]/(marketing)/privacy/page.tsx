import { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { constructMetadata } from "@/lib/utils";
import { Button } from "@/components/alignui/actions/button";

export const metadata: Metadata = constructMetadata({
  title: "Datenschutzerklärung",
  description: "DSGVO-konforme Datenschutzerklärung für Cenety",
});

export default async function PrivacyPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations("Privacy");
  const locale = params.locale || "de";

  return (
    <div className="container mx-auto max-w-4xl py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">
            Stand:{" "}
            {new Date().toLocaleDateString(locale, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 rounded-lg border bg-muted/30 p-6">
          <Link href="/dashboard/settings">
            <Button variant="outline" size="sm">
              📥 Meine Daten exportieren
            </Button>
          </Link>
          <Link href="/dashboard/settings">
            <Button variant="outline" size="sm">
              🗑️ Account löschen
            </Button>
          </Link>
          <a href="mailto:privacy@cenety.com">
            <Button variant="outline" size="sm">
              ✉️ Kontakt Datenschutz
            </Button>
          </a>
        </div>

        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              1. Name und Kontaktdaten des Verantwortlichen
            </h2>
            <div className="rounded-lg border bg-muted/30 p-6">
              <p className="mb-2">
                <strong>Verantwortlich für die Datenverarbeitung:</strong>
              </p>
              <p>[Ihr Firmenname]</p>
              <p>[Straße und Hausnummer]</p>
              <p>[PLZ Stadt]</p>
              <p>E-Mail: privacy@cenety.com</p>
              <p>Telefon: [Ihre Telefonnummer]</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              2. Erhebung und Verarbeitung personenbezogener Daten
            </h2>
            <p className="text-muted-foreground">
              Wir verarbeiten personenbezogene Daten unserer Nutzer
              grundsätzlich nur, soweit dies zur Bereitstellung einer
              funktionsfähigen Website sowie unserer Inhalte und Leistungen
              erforderlich ist.
            </p>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">
                2.1 Registrierung und Accountverwaltung
              </h3>
              <p className="text-sm text-muted-foreground">
                Bei der Registrierung eines Nutzeraccounts erheben wir folgende
                Daten:
              </p>
              <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
                <li>E-Mail-Adresse (erforderlich)</li>
                <li>Name und Vorname (optional)</li>
                <li>Firmenname (optional)</li>
                <li>Passwort (verschlüsselt gespeichert)</li>
                <li>Zeitpunkt der Registrierung</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO
                (Vertragserfüllung)
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">
                2.2 Kundenverwaltung (CRM)
              </h3>
              <p className="text-sm text-muted-foreground">
                Im Rahmen unserer CRM-Funktion speichern Sie als Nutzer
                Kundendaten. Diese Daten werden ausschließlich in Ihrem Account
                gespeichert und nicht von uns ausgewertet:
              </p>
              <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
                <li>Kundennamen und Kontaktdaten</li>
                <li>Adressinformationen</li>
                <li>Steuer-ID und Firmendaten</li>
                <li>Notizen und Dokumente</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO
                (Vertragserfüllung)
                <br />
                <strong>Hinweis:</strong> Sie sind als Nutzer selbst
                Verantwortlicher für die Verarbeitung der Kundendaten in Ihrem
                Account.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">2.3 Zahlungsabwicklung</h3>
              <p className="text-sm text-muted-foreground">
                Für die Zahlungsabwicklung nutzen wir den Dienstleister Stripe.
                Folgende Zahlungsdaten werden verarbeitet:
              </p>
              <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
                <li>Name des Karteninhabers</li>
                <li>Kreditkartennummer (verschlüsselt bei Stripe)</li>
                <li>Rechnungsadresse</li>
                <li>Transaktionshistorie</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO
                (Vertragserfüllung)
                <br />
                <strong>Dienstleister:</strong> Stripe Payments Europe, Ltd., 1
                Grand Canal Street Lower, Grand Canal Dock, Dublin, Irland
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Cookies und Tracking</h2>
            <p className="text-muted-foreground">
              Unsere Website verwendet Cookies. Cookies sind kleine Textdateien,
              die auf Ihrem Endgerät gespeichert werden.
            </p>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">
                3.1 Technisch notwendige Cookies
              </h3>
              <p className="text-sm text-muted-foreground">
                Diese Cookies sind für den Betrieb der Website erforderlich
                (Session-Management, Sicherheit, Authentifizierung).
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO
                (berechtigtes Interesse)
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">
                3.2 Analyse-Cookies (optional)
              </h3>
              <p className="text-sm text-muted-foreground">
                Wir verwenden eigene Analytics zur Verbesserung unserer Website.
                Diese sind standardmäßig deaktiviert und werden nur mit Ihrer
                Einwilligung aktiviert.
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a DSGVO
                (Einwilligung)
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              4. Ihre Rechte als betroffene Person
            </h2>
            <p className="text-muted-foreground">
              Sie haben jederzeit folgende Rechte bezüglich Ihrer
              personenbezogenen Daten:
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">
                  📋 Recht auf Auskunft (Art. 15 DSGVO)
                </h3>
                <p className="text-sm text-muted-foreground">
                  Sie können Auskunft über Ihre gespeicherten Daten verlangen.
                  Nutzen Sie dafür die Export-Funktion in den Einstellungen.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">
                  ✏️ Recht auf Berichtigung (Art. 16 DSGVO)
                </h3>
                <p className="text-sm text-muted-foreground">
                  Sie können die Berichtigung unrichtiger Daten verlangen. Dies
                  können Sie direkt in Ihrem Account vornehmen.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">
                  🗑️ Recht auf Löschung (Art. 17 DSGVO)
                </h3>
                <p className="text-sm text-muted-foreground">
                  Sie können die Löschung Ihrer Daten verlangen. Nutzen Sie die
                  Account-Löschung in den Einstellungen.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">
                  🔒 Recht auf Einschränkung (Art. 18 DSGVO)
                </h3>
                <p className="text-sm text-muted-foreground">
                  Sie können die Einschränkung der Verarbeitung Ihrer Daten
                  verlangen.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">
                  📤 Recht auf Datenübertragbarkeit (Art. 20 DSGVO)
                </h3>
                <p className="text-sm text-muted-foreground">
                  Sie können Ihre Daten in einem strukturierten Format
                  exportieren (JSON/CSV).
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">
                  ⛔ Widerspruchsrecht (Art. 21 DSGVO)
                </h3>
                <p className="text-sm text-muted-foreground">
                  Sie können der Verarbeitung Ihrer Daten jederzeit
                  widersprechen.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              5. Datenspeicherung und Löschfristen
            </h2>
            <p className="text-muted-foreground">
              Wir speichern Ihre Daten nur so lange, wie dies für die jeweiligen
              Zwecke erforderlich ist:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
              <li>
                <strong>Account-Daten:</strong> Bis zur Löschung des Accounts
              </li>
              <li>
                <strong>Rechnungsdaten:</strong> 10 Jahre (gesetzliche
                Aufbewahrungspflicht nach § 147 AO)
              </li>
              <li>
                <strong>Zahlungsdaten:</strong> Bis zur vollständigen Abwicklung
                + Gewährleistungsfristen
              </li>
              <li>
                <strong>Server-Logs:</strong> 90 Tage
              </li>
              <li>
                <strong>Cookie-Einwilligungen:</strong> 12 Monate
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Datensicherheit</h2>
            <p className="text-muted-foreground">
              Wir setzen technische und organisatorische Sicherheitsmaßnahmen
              ein, um Ihre Daten gegen Manipulation, Verlust, Zerstörung und
              Zugriff unberechtigter Personen zu schützen:
            </p>
            <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
              <li>SSL/TLS-Verschlüsselung für alle Datenübertragungen</li>
              <li>Verschlüsselte Speicherung von Passwörtern (bcrypt)</li>
              <li>Regelmäßige Sicherheits-Updates und Backups</li>
              <li>Zugriffskontrolle und Berechtigungskonzepte</li>
              <li>Hosting in ISO 27001 zertifizierten Rechenzentren</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              7. Drittanbieter und internationale Datentransfers
            </h2>
            <p className="text-muted-foreground">
              Wir nutzen folgende Drittanbieter für den Betrieb unserer
              Plattform:
            </p>
            <div className="space-y-3">
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">
                  Supabase (Database & Auth)
                </h3>
                <p className="text-sm text-muted-foreground">
                  Supabase Inc., USA - Hosting in EU-Rechenzentren,
                  Standardvertragsklauseln gemäß Art. 46 DSGVO
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">
                  Stripe (Zahlungsabwicklung)
                </h3>
                <p className="text-sm text-muted-foreground">
                  Stripe Payments Europe, Ltd., Irland - EU-basiert,
                  DSGVO-konform
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">Vercel (Hosting)</h3>
                <p className="text-sm text-muted-foreground">
                  Vercel Inc., USA - Hosting in EU-Rechenzentren verfügbar, DPA
                  vorhanden
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              8. Beschwerderecht bei Aufsichtsbehörde
            </h2>
            <p className="text-muted-foreground">
              Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde
              über die Verarbeitung Ihrer personenbezogenen Daten durch uns zu
              beschweren.
            </p>
            <div className="rounded-lg border bg-blue-50 p-6 dark:bg-blue-900/20">
              <p className="text-sm">
                <strong>Zuständige Aufsichtsbehörde in Deutschland:</strong>
              </p>
              <p className="mt-2 text-sm">
                Die Bundesbeauftragte für den Datenschutz und die
                Informationsfreiheit
                <br />
                Graurheindorfer Str. 153
                <br />
                53117 Bonn
                <br />
                Website:{" "}
                <a
                  href="https://www.bfdi.bund.de"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  www.bfdi.bund.de
                </a>
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              9. Änderungen dieser Datenschutzerklärung
            </h2>
            <p className="text-muted-foreground">
              Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit
              sie stets den aktuellen rechtlichen Anforderungen entspricht oder
              um Änderungen unserer Leistungen umzusetzen. Bei wesentlichen
              Änderungen werden wir Sie per E-Mail informieren.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">10. Kontakt Datenschutz</h2>
            <div className="rounded-lg border bg-muted/30 p-6">
              <p className="mb-4 text-muted-foreground">
                Bei Fragen zur Verarbeitung Ihrer Daten oder zur Ausübung Ihrer
                Rechte wenden Sie sich bitte an:
              </p>
              <p>
                <strong>E-Mail:</strong>{" "}
                <a
                  href="mailto:privacy@cenety.com"
                  className="text-primary hover:underline"
                >
                  privacy@cenety.com
                </a>
              </p>
              <p>
                <strong>Post:</strong> [Ihre Firmenadresse]
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Wir werden Ihre Anfrage innerhalb von 30 Tagen beantworten.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
