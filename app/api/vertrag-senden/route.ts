import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, getVertragEmailTemplate } from '@/lib/email';
import { logEvent } from '@/lib/lead-management';
import { existsSync } from 'fs';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Read field from lead, falling back to patient_data JSON
function lf(lead: any, field: string, fallback: any = null) {
  return lead?.[field] ?? lead?.patient_data?.[field] ?? fallback;
}

function buildContractHtml(lead: any): string {
  const kalk = lead.kalkulation || {};
  const bruttoGesamt = kalk.bruttopreis ?? kalk.totalGross ?? kalk.gesamtpreis ?? kalk.bruttoGesamt ?? 0;
  const tagessatzOverride = lf(lead, 'tagessatz_override');
  const tagessatz = tagessatzOverride
    ? parseFloat(tagessatzOverride)
    : bruttoGesamt > 0 ? bruttoGesamt / 30 : 0;
  const tagessatzFmt = tagessatz > 0
    ? tagessatz.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
    : '_______________';

  const fmtDate = (d: string) => d
    ? new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '_______________';

  const vertragsBeginn = fmtDate(lf(lead, 'vertrags_beginn'));
  const vertragsEnde = lf(lead, 'vertrags_ende');
  const vertragsDauer = vertragsEnde
    ? `bis zum ${fmtDate(vertragsEnde)} befristet`
    : 'auf unbestimmte Zeit';
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const ortUnterschrift = lf(lead, 'ort_unterzeichnung') || '________________________';

  const agName = [lead.anrede_text || lead.anrede, lead.vorname, lead.nachname].filter(Boolean).join(' ');
  const agStreet = lf(lead,'ag_street') || '';
  const agZipCity = [lf(lead,'ag_zip'), lf(lead,'ag_city')].filter(Boolean).join(' ');

  const pd = lead.patient_data || {};
  const leVorname = lead.patient_vorname || pd.patient_vorname || '';
  const leNachname = lead.patient_nachname || pd.patient_nachname || '';
  const leAnrede = lead.patient_anrede || pd.anrede || '';
  const leName = [leAnrede, leVorname, leNachname].filter(Boolean).join(' ');
  const leStreet = lead.patient_street || pd.strasse || '';
  const leZip = lead.patient_zip || pd.plz || '';
  const leCity = lead.patient_city || pd.ort || '';
  const leZipCity = [leZip, leCity].filter(Boolean).join(' ');
  const leIsAbweichend = !!(leVorname || leNachname);

  const fieldBlank = (val: string) =>
    `<span style="display:inline-block;min-width:110pt;border-bottom:1.5px solid #5C4A32;color:#5C4A32;font-style:italic;">${val}</span>`;

  const partyBlock = (label: string, name: string, details: string[], italic = false) => `
    <div style="border:1px solid #d4c5af;border-left:3px solid #5C4A32;background:#faf8f5;padding:10pt 14pt;margin-bottom:8pt;border-radius:0 3pt 3pt 0;">
      <div style="font-size:8.5pt;color:#7a6a56;font-style:italic;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4pt;">${label}</div>
      ${italic
        ? `<div style="font-size:11pt;color:#999;font-style:italic;padding-top:3pt;">${name}</div>`
        : `<div style="font-weight:bold;font-size:13pt;margin-bottom:3pt;">${name || '<span style="color:#ccc;font-weight:normal;font-style:italic;">Name nicht hinterlegt</span>'}</div>`}
      ${details.filter(Boolean).map(d => `<div style="font-size:12pt;color:#333;line-height:1.6;margin-top:2pt;">${d}</div>`).join('')}
    </div>`;

  const h2 = (text: string) =>
    `<h2 style="font-size:12pt;font-weight:bold;color:#5C4A32;margin:18pt 0 6pt 0;padding-bottom:3pt;border-bottom:1px solid #e8ddd0;">${text}</h2>`;

  const p = (text: string) =>
    `<p style="margin:0 0 6pt 0;text-align:justify;">${text}</p>`;

  const li = (items: string[]) =>
    `<ul style="margin:4pt 0 10pt 0;padding:0 0 0 18pt;list-style:none;">
      ${items.map(i => `<li style="margin-bottom:4pt;padding-left:10pt;position:relative;">
        <span style="position:absolute;left:0;color:#5C4A32;font-size:8pt;top:2pt;">▸</span>${i}
      </li>`).join('')}
    </ul>`;

  const sigRow = (sigs: { label: string }[]) =>
    `<div style="display:flex;gap:30pt;margin-top:28pt;">
      ${sigs.map(s => `<div style="flex:1;">
        <div style="border-top:1.5px solid #5C4A32;padding-top:6pt;font-size:10pt;color:#555;line-height:1.5;">${s.label}</div>
      </div>`).join('')}
    </div>`;

  const footer = (page: string) =>
    `<div style="display:flex;justify-content:space-between;font-size:9pt;color:#aaa;border-top:1px solid #e8ddd0;padding-top:6pt;margin-top:auto;">
      <span>PRIMUNDUS | www.primundus.de</span><span>Seite ${page}</span>
    </div>`;

  const page = (content: string, pageNum: string) =>
    `<div style="max-width:210mm;min-height:297mm;margin:0 auto 20px;padding:18mm 22mm 18mm 25mm;background:white;box-shadow:0 4px 24px rgba(0,0,0,0.1);display:flex;flex-direction:column;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:11.5pt;color:#1a1a1a;line-height:1.65;">
      ${content}
      ${footer(pageNum)}
    </div>`;

  const logoHeader = `
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:22pt;padding-bottom:12pt;border-bottom:2.5px solid #5C4A32;">
      <div style="font-size:18pt;font-weight:bold;color:#5C4A32;letter-spacing:2px;">PRIMUNDUS</div>
      <div style="font-size:10pt;color:#7a6a56;text-align:right;">Datum:<br/>${today}</div>
    </div>`;

  const p1 = page(`
    ${logoHeader}
    <div style="text-align:center;margin:18pt 0 22pt;">
      <h1 style="font-size:20pt;font-weight:bold;letter-spacing:1px;margin:0 0 4pt 0;">Dienstleistungsvertrag</h1>
      <hr style="border:none;border-top:1px solid #c8b89a;margin:8pt auto;width:60pt;"/>
      <p style="text-align:center;font-size:12pt;color:#555;margin:0 0 18pt;">geschlossen zwischen den folgenden Vertragsparteien</p>
    </div>
    ${partyBlock('Auftraggeber (AG)', agName, [agStreet, agZipCity, lead.email, lead.telefon].filter(Boolean))}
    <p style="text-align:center;font-size:11pt;color:#666;margin:5pt 0;">im Folgenden <strong>Auftraggeber (AG)</strong> genannt</p>
    ${leIsAbweichend
      ? partyBlock('Leistungsempfänger (LE)', leName, [leStreet, leZipCity].filter(Boolean))
      : partyBlock('Leistungsempfänger (LE) — identisch mit AG', leIsAbweichend ? leName : (agName || 'wie Auftraggeber'), [agStreet, agZipCity].filter(Boolean), true)}
    <p style="text-align:center;font-size:11pt;color:#666;margin:5pt 0;">im Folgenden <strong>Leistungsempfänger (LE)</strong> genannt</p>
    <p style="text-align:center;font-weight:bold;font-size:13pt;color:#5C4A32;margin:8pt 0;letter-spacing:1px;">— und —</p>
    ${partyBlock('Dienstleister (DL)', 'PRIMUNDUS Deutschland', ['VITANAS GROUP sp. z o. o · Poznanska 21/48, 00-685 Warszawa', 'Stat. Register: REGON 526823071'])}
    <p style="text-align:center;font-size:11pt;color:#666;margin:5pt 0;">Im Folgenden <strong>Dienstleister (DL oder PRIMUNDUS)</strong> genannt.</p>
  `, '1 von 8');

  const p2 = page(`
    ${h2('§ 1 Vertragsgegenstand')}
    ${p('1. Der DL erbringt zeitlich überwiegend Leistungen im Bereich der hauswirtschaftlichen Versorgung und unterstützt den LE bei der Ausübung alltäglicher Aktivitäten. Zusätzlich erbringt der DL in zeitlich geringerem Umfang Leistungen im Bereich der Grundpflege im Sinne des SGB XI. Eine detaillierte Beschreibung dieser Leistungen erfolgt in Anlage 2 dieses Vertrages, wobei die Art, Dauer und die Häufigkeit der Betreuung von dem jeweiligen Gesundheitszustand des Leistungsempfängers abhängen. Änderungen des Leistungsumfangs werden ausschließlich nach Absprache zwischen AG und DL vorgenommen. Beide Vertragspartner sind sich darüber einig, dass der zeitliche Aufwand der vereinbarten grundpflegerischen Leistungen 50 Prozent der gesamten Leistung nicht überschreiten darf.')}
    ${p('2. Der DL erklärt, dass notwendige medizinische Behandlungspflege nach SGB V (z. B. Injektionen, Wundversorgung, u. a.) sich ausdrücklich nicht im Umfang der Dienstleistungen befindet und nicht im Rahmen dieses Vertrages ausgeführt wird.')}
    ${p('3. Der DL verpflichtet sich, die ihm in Auftrag gegebenen Dienstleistungen mit höchster Sorgfalt sowie durch die volle Anwendung seiner Kenntnisse und Erfahrungen, zu erbringen. Der DL erbringt die Leistung durch seine Betreuungspersonen oder beauftragte Dritte.')}
    ${p('4. Im Fall einer Verhinderung der Betreuungsperson (z. B. wegen einer schwerwiegenden Krankheit oder aus anderem wichtigen Grund) ist der DL berechtigt, die Betreuungsperson schnellstmöglich (in der Regel innerhalb von 3 Tagen) zu wechseln und durch eine andere adäquate Betreuungsperson vertreten zu lassen.')}
    ${p('5. Bei begründetem und nachvollziehbarem Wunsch des AG wird der DL einen Austausch der Betreuungsperson vornehmen. Für die Ausführung wird dem DL ein Zeitraum von mindestens einer Woche gewährt.')}
    ${p('6. Die eingesetzten Betreuungspersonen des DL können nicht durch den AG zu anderen Zwecken eingeteilt oder an andere Leistungsorte verliehen werden.')}
    ${p('7. Mängel und Beschwerden müssen dem DL unverzüglich schriftlich angezeigt werden.')}
    ${p('8. Der DL erbringt seine Dienstleistungen gemäß den Vorschriften der EU am Leistungsort. Beide Vertragsparteien sind sich darüber einig:')}
    ${li(['der AG erstellt weder Dienst- noch Freizeitpläne', 'der AG übt keinen Einfluss auf Art und Weise der Aufgaben der Betreuungsperson aus', 'der AG erteilt keine direkten und bindenden Weisungen und übt kein Direktionsrecht aus', 'der AG bindet die Betreuungsperson nicht in eigene Betriebsabläufe ein'])}
    ${p('9. Die wöchentliche durchschnittliche Arbeitszeit darf 40 Stunden nicht überschreiten. Außerhalb der Arbeitszeit steht es der Betreuungsperson frei, den Leistungsort zu verlassen.')}
    ${p('10. Der AG stellt der Betreuungsperson die Mitbenutzung eines Telefons für nationale Festnetztelefonate sowie Festnetztelefonate ins Heimatland und Internet zur Verfügung.')}
    ${h2('§ 2 Unterbringung / Verpflegung / Transfer')}
    ${p('1. Der AG verpflichtet sich, der Betreuungsperson ausreichenden, unentgeltlichen Wohnraum (z. B. ein Zimmer) zur alleinigen, privaten und freiwilligen Nutzung zur Verfügung zu stellen. Der Wohnraum muss ausreichend möbliert, beheizt, verschließbar und hygienisch einwandfrei mit einem Tageslichtfenster versehen sein.')}
    ${p('2. Der AG trägt alle Kosten der Leistungserbringung, Ernährungs- und Lebenshaltungskosten sowie die Kosten für die mit der Betreuung verbundenen Mittel und Geräte.')}
    ${p('3. Der AG verpflichtet sich, am vorher vereinbarten Ankunftstag die Betreuungsperson am nächstgelegenen Ankunftsort auf eigene Kosten abzuholen. Der DL haftet nicht für Verspätungen infolge der Busreisedauer oder persönlicher Angelegenheiten der Betreuungspersonen.')}
  `, '2 von 8');

  const p3 = page(`
    ${h2('§ 3 Vertragsdauer / Vertragskündigung')}
    ${p(`1. Der Vertrag beginnt voraussichtlich am ${fieldBlank(vertragsBeginn)} und wird ${fieldBlank(vertragsDauer)} geschlossen.`)}
    ${p('2. Der AG verlangt vom DL ausdrücklich, dass dieser mit der Leistungserbringung bereits vor Ablauf der Widerrufsfrist gemäß § 8 beginnt.')}
    ${p('3. Der Vertrag kann von beiden Seiten ohne Einhaltung einer Kündigungsfrist gekündigt werden.')}
    ${p('4. Die Kündigung bedarf zu ihrer Wirksamkeit zwingend der Textform (Brief, Fax, E-Mail).')}
    ${p('5. Der Auftraggeber gewährt dem Dienstleister eine Frist von maximal 3 Tagen zur Organisation der Rückreise der Betreuungsperson sowie während dieser Frist weiterhin Unterkunft und Verpflegung.')}
    ${p('6. Die Abwesenheit des LE am Leistungsort bis zu 7 Tagen lässt den Vertragsbestand unberührt. Ab dem 8. Tag ruht der Vertrag kostenlos für den AG bis die Betreuung wieder fortgesetzt wird.')}
    ${p('7. Bei Beschwerden über die Erbringung der vereinbarten Leistungen ist der DL unverzüglich zu informieren. Eine Minderung kann nur erfolgen, wenn der Minderungsgrund innerhalb von 5 Tagen angezeigt wurde und zwischen den Parteien unstrittig ist.')}
    ${h2('§ 4 Vergütung')}
    ${p(`1. Der DL erhält für die vereinbarten Dienstleistungen eine Vergütung von <strong>${fieldBlank(tagessatzFmt)} pro Tag (Tagessatz)</strong> zzgl. einer Reisekostenpauschale i.H.v. EUR 125,00 pro Fahrt.`)}
    ${p('2. Die Vergütung wird berechnet ab dem Tag der Ankunft der Betreuungsperson am Leistungsort.')}
    ${p('3. Beginnt oder endet die Vertragslaufzeit im Laufe eines Monats, erfolgt eine anteilige Berechnung der vereinbarten Vergütung.')}
    ${p('4. Die Rechnungen werden monatlich zum 15. ausgestellt. Der Rechnungsbetrag ist bis spätestens 7 Tage nach Erhalt zu überweisen.')}
    ${p('5. Sollten sich die Betreuungsbedürfnisse der zu betreuenden Person ändern, behält sich der DL das Recht zur Anpassung des Honorars vor.')}
    ${p('6. Im Falle einer Arbeitsunfähigkeit der Betreuungsperson wird für die Zeit der Verhinderung kein Honorar berechnet.')}
    ${p('7. Der Anreisetag und der Abreisetag werden als volle Dienstleistungstage berechnet. Bei einem Personalwechsel wird der volle Tagessatz für beide Betreuungspersonen berechnet.')}
    ${p('8. An gesetzlichen Feiertagen (am Einsatzort des Leistungsempfängers) wird der doppelte Tagessatz berechnet.')}
    ${p('9. In den Sommermonaten Juli und August wird ein Sommerzuschlag von 6,67 € pro Tag berechnet.')}
    ${p('10. Nach der aktuellen Gesetzeslage ist auf die Dienstleistungen des DL keine gesetzliche Mehrwertsteuer zu entrichten.')}
    ${p('11. Bei Zahlungsverzug hat der DL das Recht, Dritte mit der Rechnungsabwicklung zu beauftragen und Verzugszinsen in Höhe von 5 Prozent p. a. über dem jeweiligen Basiszinssatz zu berechnen.')}
    ${p('12. Der DL ist berechtigt, bei ausbleibender Zahlung die Betreuungsperson ersatzlos abreisen zu lassen und den Vertrag außerordentlich fristlos zu kündigen.')}
  `, '3 von 8');

  const p4 = page(`
    ${h2('§ 5 Haftung des Dienstleisters')}
    ${p('1. Der DL erklärt, dass die von ihm beauftragten Betreuungspersonen über eine Haftpflichtversicherung verfügen.')}
    ${p('2. Der Dienstleister haftet für Schäden an Leib, Leben oder Gesundheit nach den gesetzlichen Vorschriften und jeweils bis zu EUR 1.000.000,00 pro Schadenfall. Die Haftung für Schäden und Folgeschäden wird ausgeschlossen, wenn der Schaden in geringen Beschädigungen (bis zu EUR 100,00) besteht, die bei der Verrichtung alltäglicher Haushaltspflichten entstanden sind, oder wenn der Schaden einen normalen Verschleiß der Ausstattung darstellt.')}
    ${p('3. Der DL und die Betreuungspersonen leisten keine medizinische Behandlungspflege im Sinne des SGB V und übernehmen keine Verantwortung für Umstände, die durch Nichteinhaltung ärztlicher Anordnungen durch den AG oder LE entstehen.')}
    ${p('4. Im Falle der Übergabe eines Kraftfahrzeugs an die Betreuungsperson können keine Ansprüche gegenüber dem DL geltend gemacht werden.')}
    ${h2('§ 6 Datenschutz / Vertraulichkeitsvereinbarung')}
    ${p('1. Beide Parteien verpflichten sich zum Schutz aller personenbezogenen Daten gemäß der EU-DSGVO. Der DL verpflichtet sich zur vertraulichen Behandlung der persönlichen Daten des AG und LE.')}
    ${p('2. Der DL verarbeitet anvertraute personenbezogene Daten nur soweit, als es zur Begründung, Durchführung oder Beendigung dieses Vertrages erforderlich ist.')}
    ${p('3. Der AG verpflichtet sich zur vollen Verschwiegenheit gegenüber Dritten in Bezug auf sämtliche Daten, die im Zusammenhang mit der Erbringung der Dienstleistung erlangt werden.')}
    ${p('4. Der AG und der LE willigen ein, dass die zur Erfüllung des Vertrages notwendigen Daten vom DL erhoben, gespeichert, verarbeitet und an seine Mitarbeiter und Betreuungspersonen weitergegeben werden dürfen.')}
    ${h2('§ 7 Wettbewerbsverbot')}
    ${p('1. Für die Betreuungspersonen gilt sowohl während der Vertragsdauer als auch bis 12 Monate nach Beendigung ein Konkurrenz- und Wettbewerbsverbot. Es ist nicht gestattet, ein mittelbares oder unmittelbares Rechtsverhältnis zu einer Betreuungsperson des DL zu begründen.')}
    ${p('2. Im Falle einer schuldhaften Annahme eines Auftrages durch eine Betreuungsperson beim AG mit Ausschließung des DL, verpflichtet sich der AG, eine Vertragsstrafe in Höhe von EUR 5.000,00 zu zahlen.')}
  `, '4 von 8');

  const p5 = page(`
    ${h2('§ 8 Widerrufsrecht')}
    ${p('1. Dem AG steht das Recht zu, diesen Vertrag ohne Angabe von Gründen innerhalb von 14 Tagen in Textform zu widerrufen. Die Widerrufsfrist beginnt mit Unterzeichnung dieses Vertrages. Widerruf an:')}
    ${p('Primundus Deutschland (VITANAS GROUP sp. z o. o), Poznanska 21/48, 00-685 Warszawa')}
    ${p('2. Im Falle eines wirksamen Widerrufs sind die beiderseits empfangenen Leistungen zurückzugewähren. Der AG ist verpflichtet, dem DL Wertersatz zu leisten (z. B. entstandene Reisekosten, pauschal EUR 125,00).')}
    ${p('3. Der AG bestätigt durch Unterzeichnung, dass er ausdrücklich verlangt, dass die Leistungserbringung vor Ablauf der Widerrufsfrist beginnt.')}
    ${h2('§ 9 Einhaltung der gültigen Sozialversicherungspflichten')}
    ${p('1. Der DL erklärt, dass er alle auszuführenden Tätigkeiten nach den gültigen Gesetzen, insbesondere der EU-Dienstleistungsrichtlinie und dem Arbeitnehmer-Entsendegesetz, rechtmäßig befolgt.')}
    ${p('2. Die Vergütung des Personals richtet sich nach dem deutschen Mindestlohn.')}
    ${p('3. Die von ihm beauftragten Betreuungspersonen sind ordnungsgemäß nach polnischem Sozialversicherungsrecht versichert und mit A1-Bescheinigungen der polnischen Sozialversicherungsanstalt (ZUS) entsandt.')}
    ${h2('§ 10 Schlussbestimmungen')}
    ${p('1. Änderungen und Ergänzungen bedürfen der Schriftform. 2. Rechnungen und Korrespondenz werden an die E-Mailadresse des AG auf Seite 1 gesendet. 3. Eine E-Mail ist gemäß diesem Vertrag ebenfalls Schriftform. 4. Sollten einzelne Bestimmungen unwirksam sein, gelten die übrigen fort. 5. Der AG bestätigt mit seiner Unterschrift den gesamten Inhalt des Vertrages gelesen zu haben. 6. Mündliche Nebenabreden bestehen nicht. 7. Der Vertrag unterliegt deutschem Recht.')}
    <hr style="border:none;border-top:1px solid #e0d5c8;margin:14pt 0;"/>
    <div style="font-size:11pt;color:#444;margin-bottom:22pt;">${ortUnterschrift}, den ___________________</div>
    ${sigRow([
      { label: 'Ort, Datum, Unterschrift Auftraggeber<br/>(bzw. Bevollmächtigter oder gesetzlicher Vertreter)' },
      { label: 'Ort, Datum, Unterschrift Dienstleister' },
    ])}
  `, '5 von 8');

  const p6 = page(`
    <div style="text-align:center;margin-bottom:20pt;padding-bottom:12pt;border-bottom:1px solid #e0d5c8;">
      <div style="font-size:14pt;font-weight:bold;margin-bottom:4pt;">Anlage 1 zum Dienstleistungsvertrag</div>
      <div style="font-size:11pt;color:#666;">Hinweise zum Datenschutz (EU-DSGVO) und Einwilligungserklärung</div>
    </div>
    ${p('PRIMUNDUS ist verantwortlich für den Schutz, Sicherheit und Verwaltung Ihrer Daten. Kontakt: <strong>datenschutz@primundus.de</strong>')}
    ${p('Die angegebenen personenbezogenen Daten, insbesondere Name, Anschrift, Telefonnummer, Bankdaten, Gesundheitsdaten und familiäre Daten, werden auf Grundlage der geltenden EU-DSGVO ausschließlich zum Zwecke der Durchführung des entstehenden Vertragsverhältnisses erhoben und verarbeitet.')}
    ${p('Ihre Vertragsdaten speichern wir gemäß den gesetzlichen Vorgaben. Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Sperrung, Einschränkung der Verarbeitung, Widerspruch und Datenübertragbarkeit sowie das Recht auf Beschwerde bei einer zuständigen Aufsichtsbehörde.')}
    ${p('Unsere Datenschutzerklärung finden Sie unter www.primundus-mallorca.de.')}
    <p style="margin:14pt 0 0 0;font-weight:bold;">Einwilligung zur Datennutzung zu Werbezwecken:</p>
    ${p('Ich bin damit einverstanden, dass PRIMUNDUS mir postalisch / per E-Mail / Telefon / Fax Informationen und Angebote zum Zwecke der Eigenwerbung zusendet.')}
    ${sigRow([{ label: 'Ort, Datum, Unterschrift Auftraggeber<br/>(bzw. Bevollmächtigter oder gesetzlicher Vertreter)' }])}
  `, '6 von 8');

  const p7 = page(`
    <div style="text-align:center;margin-bottom:20pt;padding-bottom:12pt;border-bottom:1px solid #e0d5c8;">
      <div style="font-size:14pt;font-weight:bold;margin-bottom:4pt;">Anlage 2 zum Dienstleistungsvertrag</div>
      <div style="font-size:11pt;color:#666;">Leistungsumfang</div>
    </div>
    ${p('Die Vertragspartner vereinbaren, dass folgende Leistungen im Rahmen des abgeschlossenen Dienstleistungsvertrages erbracht werden. Beide Parteien sind sich darüber einig, dass zeitlich überwiegend nur Leistungen im Bereich der hauswirtschaftlichen Versorgung erbracht werden.')}
    ${h2('Hauswirtschaftliche Leistungen (zeitlich überwiegend)')}
    ${li([
      'Alle notwendigen Maßnahmen zur Aufrechterhaltung einer eigenständigen Haushaltsführung',
      'Ordnung und Reinigung der vom LE genutzten Zimmer/Räume (Fensterreinigung, Garage, Heizräume und Außengebäude ausgeschlossen)',
      'Einkaufen', 'Spülen des alltäglichen Geschirrs', 'Waschen und Wechseln der Wäsche sowie Kleidung',
      'Zubereitung von Speisen und Getränken', 'Pflege von Zimmerpflanzen', 'Begleitung bei Spaziergängen',
      'Versorgung von Haustieren', 'Aktivierende Tätigkeiten und Besorgungen (z. B. Begleitung bei Kulturveranstaltungen, Spiele etc.)',
    ])}
    ${h2('Grundpflege nach § 14 Abs. 4 Nr. 1–3 SGB XI (zeitlich nicht überwiegend)')}
    ${li([
      'Körperpflege (z. B. Waschen, Duschen, Baden, Rasieren, Mund- und Zahnpflege, Hautpflege)',
      'Hilfe bei der Nahrungsaufnahme',
      'Hilfe bei der Mobilität (z. B. Aufstehen, Zubettgehen, An- und Auskleiden, Treppensteigen)',
      'Begleitung von Arztbesuchen',
    ])}
    <p style="margin:0 0 16pt 0;"><strong>Ausdrücklich ausgenommen:</strong> Leistungen der medizinischen Behandlungspflege nach SGB V.</p>
    ${sigRow([
      { label: 'Ort, Datum, Unterschrift Auftraggeber<br/>(bzw. Bevollmächtigter oder gesetzlicher Vertreter)' },
      { label: 'Ort, Datum, Unterschrift Dienstleister' },
    ])}
  `, '7 von 8');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Dienstleistungsvertrag – PRIMUNDUS</title>
  <style>
    @page { size: A4; margin: 0; }
    body { margin: 0; padding: 20px; background: #f0ece6; }
    @media print {
      body { background: white; padding: 0; }
      body > div { page-break-after: always; break-after: page; box-shadow: none !important; margin-bottom: 0 !important; }
      body > div:last-child { page-break-after: avoid; break-after: avoid; }
    }
  </style>
</head>
<body>${p1}${p2}${p3}${p4}${p5}${p6}${p7}</body>
</html>`;
}

async function htmlToPdf(html: string): Promise<Buffer> {
  const isDev = process.env.NODE_ENV === 'development';

  let executablePath: string;
  let launchArgs: string[];

  if (isDev) {
    const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    const macChromium = '/Applications/Chromium.app/Contents/MacOS/Chromium';
    if (existsSync(macChrome)) executablePath = macChrome;
    else if (existsSync(macChromium)) executablePath = macChromium;
    else throw new Error('Chrome nicht gefunden. Bitte Google Chrome installieren.');
    launchArgs = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'];
  } else {
    executablePath = await chromium.executablePath();
    launchArgs = chromium.args;
  }

  const browser = await puppeteer.launch({
    args: launchArgs,
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.emulateMediaType('print');
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, subject, anschreiben } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'leadId erforderlich' }, { status: 400 });
    }

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .maybeSingle();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead nicht gefunden' }, { status: 404 });
    }

    // Build contract variables for email summary
    const kalk = lead.kalkulation || {};
    const bruttoGesamt = kalk.bruttopreis ?? kalk.totalGross ?? kalk.gesamtpreis ?? kalk.bruttoGesamt ?? 0;
    const tagessatzOverride = lf(lead, 'tagessatz_override');
    const tagessatz = tagessatzOverride
      ? parseFloat(tagessatzOverride)
      : bruttoGesamt > 0 ? bruttoGesamt / 30 : 0;
    const tagessatzFmt = tagessatz > 0
      ? tagessatz.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
      : undefined;

    const fmtDate = (d: string) => d
      ? new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : undefined;

    const agName = [lead.anrede_text || lead.anrede, lead.vorname, lead.nachname].filter(Boolean).join(' ');
    const pd = lead.patient_data || {};
    const leVorname = lead.patient_vorname || pd.patient_vorname || '';
    const leNachname = lead.patient_nachname || pd.patient_nachname || '';
    const leAnrede = lead.patient_anrede || pd.anrede || '';
    const leName = [leAnrede, leVorname, leNachname].filter(Boolean).join(' ');
    const leIsAbweichend = !!(leVorname || leNachname);

    const vertragsEnde = lf(lead, 'vertrags_ende');
    const vertragsDauer = vertragsEnde
      ? `bis zum ${fmtDate(vertragsEnde)} befristet`
      : 'Auf unbestimmte Zeit';

    // Build email template
    const emailTemplate = getVertragEmailTemplate(lead, {
      subject,
      anschreiben,
      vertragsBeginn: fmtDate(lf(lead, 'vertrags_beginn')),
      vertragsDauer,
      tagessatz: tagessatzFmt,
      agName,
      leName: leIsAbweichend ? leName : undefined,
    });

    // Build contract HTML and convert to PDF
    const contractHtml = buildContractHtml(lead);
    const contractPdf = await htmlToPdf(contractHtml);
    const contractFilename = `Dienstleistungsvertrag_${(lead.nachname || lead.vorname || 'Primundus').replace(/\s+/g, '_')}.pdf`;

    // Collect recipients (primary + optional 2nd email)
    const email2 = lf(lead, 'email2');
    const recipients = [lead.email, email2].filter(Boolean);

    // Send email with PDF attachment
    const emailResult = await sendEmail(
      recipients.length > 1 ? recipients : lead.email,
      emailTemplate,
      [{ filename: contractFilename, content: contractPdf, contentType: 'application/pdf' }]
    );

    if (emailResult.success) {
      await logEvent(leadId, 'email_vertrag_gesendet', {
        to: lead.email,
        subject: emailTemplate.subject,
      });

      // Update lead status if not already contracted
      if (lead.status === 'angebot_requested' || lead.status === 'angebot_gesendet') {
        await supabase
          .from('leads')
          .update({ status: 'vertrag_gesendet' })
          .eq('id', leadId);
      }
    } else {
      await logEvent(leadId, 'email_vertrag_failed', {
        to: lead.email,
        error: emailResult.error,
      });
    }

    return NextResponse.json({
      success: emailResult.success,
      emailSent: emailResult.success,
      emailError: emailResult.error,
    });

  } catch (error) {
    console.error('Fehler beim Vertrag-Versand:', error);
    return NextResponse.json(
      { error: 'Fehler beim Versand', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
