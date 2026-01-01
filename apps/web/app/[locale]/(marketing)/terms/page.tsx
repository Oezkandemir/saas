import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { constructMetadata } from "@/lib/utils";

export const metadata: Metadata = constructMetadata({
  title: "Allgemeine Geschäftsbedingungen (AGB)",
  description: "Allgemeine Geschäftsbedingungen für Cenety SaaS-Dienste",
});

export default async function TermsPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations("Terms");
  const locale = params.locale || "de";

  return (
    <div className="container mx-auto max-w-4xl py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">
            Stand: {new Date().toLocaleDateString(locale, { 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Version 1.0
          </p>
        </div>

        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Geltungsbereich und Vertragsgegenstand</h2>
            <p className="text-muted-foreground">
              Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der Software-as-a-Service (SaaS) Plattform Cenety, die von [Ihr Firmenname] betrieben wird.
            </p>
            <p className="text-muted-foreground">
              Cenety stellt eine Cloud-basierte Plattform zur Verwaltung von Kunden, Erstellung von Angeboten und Rechnungen sowie zur Generierung und Verwaltung von QR-Codes bereit.
            </p>
            <div className="rounded-lg border bg-yellow-50 p-4 dark:bg-yellow-900/20">
              <p className="text-sm">
                <strong>Wichtig:</strong> Entgegenstehende oder abweichende Bedingungen des Nutzers werden nicht Vertragsbestandteil, es sei denn, wir stimmen ihrer Geltung ausdrücklich schriftlich zu.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Vertragsschluss und Registrierung</h2>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">2.1 Registrierung</h3>
              <p className="text-sm text-muted-foreground">
                Die Nutzung von Cenety erfordert eine Registrierung. Mit der Registrierung gibt der Nutzer ein verbindliches Angebot zum Abschluss eines Nutzungsvertrages ab.
              </p>
              <h3 className="text-lg font-semibold">2.2 Vertragsannahme</h3>
              <p className="text-sm text-muted-foreground">
                Der Vertrag kommt durch die Bestätigung der Registrierung per E-Mail zustande. Ein Anspruch auf Vertragsschluss besteht nicht.
              </p>
              <h3 className="text-lg font-semibold">2.3 Volljährigkeit</h3>
              <p className="text-sm text-muted-foreground">
                Die Registrierung ist nur für voll geschäftsfähige natürliche Personen und juristische Personen zulässig. Minderjährige dürfen sich nur mit Zustimmung ihrer Erziehungsberechtigten registrieren.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Leistungsumfang</h2>
            <p className="text-muted-foreground">
              Der konkrete Leistungsumfang ergibt sich aus der gewählten Preisstufe (Free, Starter, Pro):
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">Free</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>✓ 3 Kunden</li>
                  <li>✓ 3 QR-Codes</li>
                  <li>✓ 3 Dokumente/Monat</li>
                  <li>✓ Basis-Funktionen</li>
                </ul>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">Starter</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>✓ Unbegrenzte Kunden</li>
                  <li>✓ 10 QR-Codes</li>
                  <li>✓ Unbegrenzte Dokumente</li>
                  <li>✓ E-Mail Support</li>
                </ul>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">Pro</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>✓ Alle Starter Features</li>
                  <li>✓ Unbegrenzte QR-Codes</li>
                  <li>✓ QR-Scan-Tracking</li>
                  <li>✓ Prioritäts-Support</li>
                </ul>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Wir behalten uns vor, den Leistungsumfang jederzeit zu ändern oder zu erweitern. Wesentliche Einschränkungen werden Bestandsnutzern rechtzeitig mitgeteilt.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Preise und Zahlungsbedingungen</h2>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">4.1 Preise</h3>
              <p className="text-sm text-muted-foreground">
                Die aktuellen Preise sind auf unserer <Link href="/pricing" className="text-primary hover:underline">Preisseite</Link> einsehbar. Alle Preise verstehen sich zzgl. der gesetzlichen Umsatzsteuer.
              </p>
              <h3 className="text-lg font-semibold">4.2 Zahlungsweise</h3>
              <p className="text-sm text-muted-foreground">
                Die Zahlung erfolgt je nach gewähltem Abrechnungsintervall (monatlich oder jährlich) im Voraus per Kreditkarte oder SEPA-Lastschrift über unseren Zahlungsdienstleister Stripe.
              </p>
              <h3 className="text-lg font-semibold">4.3 Zahlungsverzug</h3>
              <p className="text-sm text-muted-foreground">
                Bei Zahlungsverzug sind wir berechtigt, den Zugang zur Plattform zu sperren. Verzugszinsen werden in Höhe von 9 Prozentpunkten über dem Basiszinssatz (bei Verbrauchern) bzw. 9 Prozentpunkten über dem Basiszinssatz (bei Unternehmern) berechnet.
              </p>
              <h3 className="text-lg font-semibold">4.4 Preisänderungen</h3>
              <p className="text-sm text-muted-foreground">
                Preisänderungen für Bestandskunden werden mindestens 6 Wochen vor Inkrafttreten per E-Mail angekündigt. Widerspricht der Nutzer nicht innerhalb von 4 Wochen, gelten die neuen Preise als akzeptiert.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Widerrufsrecht für Verbraucher</h2>
            <div className="rounded-lg border bg-blue-50 p-6 dark:bg-blue-900/20">
              <h3 className="mb-3 font-semibold">Widerrufsbelehrung</h3>
              <p className="mb-2 text-sm">
                <strong>Widerrufsrecht:</strong> Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.
              </p>
              <p className="mb-2 text-sm">
                Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses.
              </p>
              <p className="mb-2 text-sm">
                Um Ihr Widerrufsrecht auszuüben, müssen Sie uns mittels einer eindeutigen Erklärung (z.B. per E-Mail an support@cenety.com) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren.
              </p>
              <p className="mb-3 text-sm">
                <strong>Folgen des Widerrufs:</strong> Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen zurückzuzahlen.
              </p>
              <p className="text-sm">
                <strong>Vorzeitiger Erlös des Widerrufsrechts:</strong> Das Widerrufsrecht erlischt vorzeitig, wenn wir mit der Ausführung des Vertrages erst begonnen haben, nachdem Sie dazu Ihre ausdrückliche Zustimmung gegeben und gleichzeitig Ihre Kenntnis davon bestätigt haben, dass Sie Ihr Widerrufsrecht bei vollständiger Vertragserfüllung verlieren.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Vertragslaufzeit und Kündigung</h2>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">6.1 Vertragslaufzeit</h3>
              <p className="text-sm text-muted-foreground">
                Der Vertrag wird für die gewählte Laufzeit (monatlich oder jährlich) geschlossen und verlängert sich automatisch um die gleiche Laufzeit, sofern nicht gekündigt wird.
              </p>
              <h3 className="text-lg font-semibold">6.2 Ordentliche Kündigung</h3>
              <p className="text-sm text-muted-foreground">
                Beide Parteien können den Vertrag mit einer Frist von 30 Tagen zum Ende der jeweiligen Laufzeit kündigen. Die Kündigung muss in Textform (E-Mail ausreichend) an support@cenety.com erfolgen.
              </p>
              <h3 className="text-lg font-semibold">6.3 Außerordentliche Kündigung</h3>
              <p className="text-sm text-muted-foreground">
                Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt. Ein wichtiger Grund liegt insbesondere vor bei:
              </p>
              <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
                <li>Verstoß gegen diese AGB trotz Abmahnung</li>
                <li>Zahlungsverzug von mehr als 30 Tagen</li>
                <li>Missbrauch der Plattform für illegale Zwecke</li>
              </ul>
              <h3 className="text-lg font-semibold">6.4 Datenexport</h3>
              <p className="text-sm text-muted-foreground">
                Nach Vertragsende steht dem Nutzer eine Frist von 30 Tagen für den Export seiner Daten zur Verfügung. Danach werden alle Daten unwiderruflich gelöscht.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Pflichten des Nutzers</h2>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">7.1 Account-Sicherheit</h3>
              <p className="text-sm text-muted-foreground">
                Der Nutzer ist verpflichtet, seine Zugangsdaten geheim zu halten und vor dem Zugriff Dritter zu schützen. Bei Verdacht auf Missbrauch ist der Nutzer verpflichtet, uns unverzüglich zu informieren.
              </p>
              <h3 className="text-lg font-semibold">7.2 Datenrichtigkeit</h3>
              <p className="text-sm text-muted-foreground">
                Der Nutzer ist verantwortlich für die Richtigkeit und Rechtmäßigkeit der von ihm eingegebenen Daten, insbesondere bei Rechnungen und Dokumenten.
              </p>
              <h3 className="text-lg font-semibold">7.3 Verbotene Nutzung</h3>
              <p className="text-sm text-muted-foreground">
                Der Nutzer verpflichtet sich, die Plattform nicht für folgende Zwecke zu nutzen:
              </p>
              <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
                <li>Illegale, betrügerische oder irreführende Aktivitäten</li>
                <li>Versand von Spam oder unerwünschten Nachrichten</li>
                <li>Verbreitung von Malware oder schädlicher Software</li>
                <li>Verletzung von Rechten Dritter (Urheberrecht, Markenrecht, etc.)</li>
                <li>Reverse Engineering oder Dekompilierung der Software</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Verfügbarkeit und Wartung</h2>
            <p className="text-muted-foreground">
              Wir sind bemüht, eine Verfügbarkeit der Plattform von 99% im Jahresdurchschnitt zu gewährleisten. Ausgenommen sind:
            </p>
            <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
              <li>Geplante Wartungsarbeiten (werden 48h im Voraus angekündigt)</li>
              <li>Notfallwartungen zur Behebung kritischer Sicherheitslücken</li>
              <li>Ereignisse höherer Gewalt</li>
              <li>DDoS-Angriffe und andere Cyberattacken</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9. Datenschutz</h2>
            <p className="text-muted-foreground">
              Der Schutz Ihrer personenbezogenen Daten ist uns wichtig. Details zur Datenverarbeitung finden Sie in unserer <Link href="/privacy" className="text-primary hover:underline">Datenschutzerklärung</Link>.
            </p>
            <p className="text-sm text-muted-foreground">
              Der Nutzer ist selbst Verantwortlicher im Sinne der DSGVO für die von ihm in Cenety gespeicherten Kundendaten und verpflichtet sich, die datenschutzrechtlichen Bestimmungen einzuhalten.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">10. Haftung und Gewährleistung</h2>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">10.1 Haftungsbeschränkung</h3>
              <p className="text-sm text-muted-foreground">
                Wir haften unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit sowie für Vorsatz und grobe Fahrlässigkeit.
              </p>
              <p className="text-sm text-muted-foreground">
                Bei leichter Fahrlässigkeit haften wir nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten). Die Haftung ist in diesem Fall auf den vertragstypischen, vorhersehbaren Schaden begrenzt.
              </p>
              <h3 className="text-lg font-semibold">10.2 Datenverlust</h3>
              <p className="text-sm text-muted-foreground">
                Wir führen täglich automatische Backups durch. Dennoch empfehlen wir dem Nutzer, regelmäßig eigene Backups seiner Daten durchzuführen. Eine Haftung für Datenverlust besteht nur, wenn der Nutzer durch regelmäßige Datensicherung dafür gesorgt hat, dass Daten mit vertretbarem Aufwand wiederhergestellt werden können.
              </p>
              <h3 className="text-lg font-semibold">10.3 Gewährleistung</h3>
              <p className="text-sm text-muted-foreground">
                Wir gewährleisten, dass die Software im Wesentlichen die vereinbarten Funktionen erfüllt. Unwesentliche Mängel begründen keine Gewährleistungsansprüche.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">11. Geistiges Eigentum</h2>
            <p className="text-muted-foreground">
              Alle Rechte an der Plattform, einschließlich des Quellcodes, Designs und der Dokumentation, liegen bei uns. Dem Nutzer wird lediglich ein nicht-exklusives, nicht übertragbares Nutzungsrecht eingeräumt.
            </p>
            <p className="text-sm text-muted-foreground">
              Der Nutzer behält alle Rechte an den von ihm erstellten Inhalten (Kundendaten, Dokumente, etc.).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">12. Änderungen der AGB</h2>
            <p className="text-muted-foreground">
              Wir behalten uns vor, diese AGB mit einer Ankündigungsfrist von 6 Wochen zu ändern. Die Änderungen werden dem Nutzer per E-Mail mitgeteilt.
            </p>
            <p className="text-muted-foreground">
              Widerspricht der Nutzer nicht innerhalb von 4 Wochen nach Zugang der Änderungsmitteilung, gelten die geänderten AGB als angenommen. Im Widerspruchsfall kann der Nutzer den Vertrag außerordentlich zum Zeitpunkt des Inkrafttretens der Änderungen kündigen.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">13. Schlussbestimmungen</h2>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">13.1 Anwendbares Recht</h3>
              <p className="text-sm text-muted-foreground">
                Es gilt ausschließlich das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
              </p>
              <h3 className="text-lg font-semibold">13.2 Gerichtsstand</h3>
              <p className="text-sm text-muted-foreground">
                Ist der Nutzer Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen, ist ausschließlicher Gerichtsstand für alle Streitigkeiten aus diesem Vertrag unser Geschäftssitz.
              </p>
              <h3 className="text-lg font-semibold">13.3 Salvatorische Klausel</h3>
              <p className="text-sm text-muted-foreground">
                Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen hiervon unberührt.
              </p>
            </div>
          </section>

          <section className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              ⚠️ Rechtlicher Hinweis: Diese AGB-Vorlage sollte von einem Fachanwalt für IT-Recht geprüft und an Ihre spezifischen Geschäftsbedingungen angepasst werden. Ersetzen Sie alle Platzhalter in eckigen Klammern mit Ihren tatsächlichen Firmendaten.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
