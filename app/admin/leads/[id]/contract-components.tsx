"use client";

/* ── Contract Document ───────────────────────────────────────── */
export function ContractDocument({
  agName, agStreet, agZipCity, agEmail, agTelefon,
  leAbweichend, leName, leStreet, leZipCity, leAnrede,
  vertragsBeginn, vertragsDauer, tagessatzFmt, ortUnterzeichnung, today
}: any) {
  return (
    <>
      <style>{`
        .contract { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; font-size: 12pt; color: #1a1a1a; line-height: 1.65; }
        .contract-page { max-width: 210mm; min-height: 297mm; margin: 0 auto; padding: 20mm 24mm 20mm 27mm; background: white; box-shadow: 0 4px 32px rgba(0,0,0,0.12); margin-bottom: 20px; display: flex; flex-direction: column; box-sizing: border-box; }
        @media print {
          @page { size: A4; margin: 20mm 25mm 20mm 27mm; }
          .contract-page { box-shadow: none; margin: 0; padding: 0; max-width: none; width: 100%; page-break-after: always; min-height: 0; }
          .contract-page:last-child { page-break-after: avoid; }
        }
        .contract-page-spacer { flex: 1; }
        .contract .header-logo { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 22pt; padding-bottom: 12pt; border-bottom: 2.5px solid #5C4A32; }
        .contract .header-date { font-size: 10pt; color: #7a6a56; text-align: right; line-height: 1.4; }
        .contract .title-block { text-align: center; margin: 18pt 0 22pt; }
        .contract h1.doc-title { font-size: 20pt; font-weight: bold; letter-spacing: 1px; margin: 0 0 4pt 0; color: #1a1a1a; }
        .contract .title-rule { border: none; border-top: 1px solid #c8b89a; margin: 8pt auto; width: 60pt; }
        .contract .subtitle { text-align: center; font-size: 12pt; color: #555; margin: 0 0 18pt; }
        .contract .party-block { border: 1px solid #d4c5af; border-left: 3px solid #5C4A32; background: #faf8f5; padding: 10pt 14pt; margin-bottom: 6pt; border-radius: 0 3pt 3pt 0; }
        .contract .party-label { font-size: 8.5pt; color: #7a6a56; margin-bottom: 4pt; font-style: italic; text-transform: uppercase; letter-spacing: 0.5px; }
        .contract .party-name { font-weight: bold; font-size: 13pt; margin-bottom: 3pt; color: #1a1a1a; }
        .contract .party-detail { font-size: 12pt; color: #444; line-height: 1.45; }
        .contract .party-center { text-align: center; font-size: 11pt; color: #666; margin: 5pt 0; }
        .contract .party-and { text-align: center; font-weight: bold; font-size: 13pt; color: #5C4A32; margin: 8pt 0; letter-spacing: 1px; }
        .contract h2 { font-size: 12pt; font-weight: bold; color: #5C4A32; margin: 18pt 0 6pt 0; padding-bottom: 3pt; border-bottom: 1px solid #e8ddd0; }
        .contract p { margin: 0 0 6pt 0; text-align: justify; }
        .contract ul { margin: 4pt 0 10pt 0; padding: 0 0 0 18pt; list-style: none; }
        .contract li { margin-bottom: 4pt; padding-left: 10pt; position: relative; text-align: left; }
        .contract li::before { content: '▸'; position: absolute; left: 0; color: #5C4A32; font-size: 8pt; top: 2pt; }
        .contract .field-blank { display: inline-block; min-width: 110pt; border-bottom: 1.5px solid #5C4A32; color: #5C4A32; font-style: italic; }
        .contract .divider { border: none; border-top: 1px solid #e0d5c8; margin: 14pt 0; }
        .contract .sig-place { font-size: 11pt; color: #444; margin-bottom: 22pt; }
        .contract .sig-row { display: flex; gap: 30pt; margin-top: 28pt; }
        .contract .sig-box { flex: 1; }
        .contract .sig-line { border-top: 1.5px solid #5C4A32; padding-top: 6pt; font-size: 10pt; color: #555; line-height: 1.5; }
        .contract .page-footer { display: flex; justify-content: space-between; font-size: 9pt; color: #aaa; border-top: 1px solid #e8ddd0; padding-top: 6pt; margin-top: 0; }
        .contract .annexe-block { text-align: center; margin-bottom: 20pt; padding-bottom: 12pt; border-bottom: 1px solid #e0d5c8; }
        .contract .annexe-title { font-size: 14pt; font-weight: bold; color: #1a1a1a; margin-bottom: 4pt; }
        .contract .annexe-subtitle { font-size: 11pt; color: #666; margin: 0; }
      `}</style>

      <div className="contract">

        {/* PAGE 1 */}
        <div className="contract-page">
          <div className="header-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/Primundus-Logo_V6.png" alt="Primundus" style={{ height: '42px', objectFit: 'contain' }} />
            <div className="header-date">Datum:<br />{today}</div>
          </div>
          <div className="title-block">
            <h1 className="doc-title">Dienstleistungsvertrag</h1>
            <hr className="title-rule" />
            <p className="subtitle">geschlossen zwischen den folgenden Vertragsparteien</p>
          </div>
          <div className="party-block">
            <div className="party-label">Auftraggeber (AG)</div>
            <div className="party-name">{agName || <span style={{color:'#bbb',fontWeight:'normal',fontStyle:'italic'}}>Name nicht hinterlegt</span>}</div>
            {agStreet && <div className="party-detail">{agStreet}</div>}
            {agZipCity && <div className="party-detail">{agZipCity}</div>}
            {agEmail && <div className="party-detail">{agEmail}</div>}
            {agTelefon && <div className="party-detail">{agTelefon}</div>}
          </div>
          <p className="party-center">im Folgenden <strong>Auftraggeber (AG)</strong> genannt</p>
          <div className="party-block">
            <div className="party-label">Leistungsempfänger (LE){!leAbweichend && ' — identisch mit AG'}</div>
            {leAbweichend && leName ? (
              <>
                <div className="party-name">{leName}</div>
                {leStreet && <div className="party-detail">{leStreet}</div>}
                {leZipCity && <div className="party-detail">{leZipCity}</div>}
              </>
            ) : (
              <div className="party-detail" style={{color:'#999',fontStyle:'italic',paddingTop:'3pt'}}>
                <div>{agName || 'wie Auftraggeber'}</div>
                {agStreet && <div>{agStreet}</div>}
                {agZipCity && <div>{agZipCity}</div>}
              </div>
            )}
          </div>
          <p className="party-center">im Folgenden <strong>Leistungsempfänger (LE)</strong> genannt</p>
          <p className="party-and">— und —</p>
          <div className="party-block">
            <div className="party-label">Dienstleister (DL)</div>
            <div className="party-name">PRIMUNDUS Deutschland</div>
            <div className="party-detail">VITANAS GROUP sp. z o. o · Poznanska 21/48, 00-685 Warszawa</div>
            <div className="party-detail">Stat. Register: REGON 526823071</div>
          </div>
          <p className="party-center">Im Folgenden <strong>Dienstleister (DL oder PRIMUNDUS)</strong> genannt.</p>
          <div className="contract-page-spacer" /><div className="page-footer"><span>PRIMUNDUS | www.primundus.de</span><span>Seite 1 von 8</span></div>
        </div>

        {/* PAGE 2 — §1–2 */}
        <div className="contract-page">
          <h2>§ 1 Vertragsgegenstand</h2>
          <p>1. Der DL erbringt zeitlich überwiegend Leistungen im Bereich der hauswirtschaftlichen Versorgung und unterstützt den LE bei der Ausübung alltäglicher Aktivitäten. Zusätzlich erbringt der DL in zeitlich geringerem Umfang Leistungen im Bereich der Grundpflege im Sinne des SGB XI. Eine detaillierte Beschreibung dieser Leistungen erfolgt in Anlage 2 dieses Vertrages, wobei die Art, Dauer und die Häufigkeit der Betreuung von dem jeweiligen Gesundheitszustand des Leistungsempfängers abhängen. Änderungen des Leistungsumfangs werden ausschließlich nach Absprache zwischen AG und DL vorgenommen. Beide Vertragspartner sind sich darüber einig, dass der zeitliche Aufwand der vereinbarten grundpflegerischen Leistungen 50 Prozent der gesamten Leistung nicht überschreiten darf.</p>
          <p>2. Der DL erklärt, dass notwendige medizinische Behandlungspflege nach SGB V (z. B. Injektionen, Wundversorgung, u. a.) sich ausdrücklich nicht im Umfang der Dienstleistungen befindet und nicht im Rahmen dieses Vertrages ausgeführt wird.</p>
          <p>3. Der DL verpflichtet sich, die ihm in Auftrag gegebenen Dienstleistungen mit höchster Sorgfalt sowie durch die volle Anwendung seiner Kenntnisse und Erfahrungen, zu erbringen. Der DL erbringt die Leistung durch seine Betreuungspersonen oder beauftragte Dritte.</p>
          <p>4. Im Fall einer Verhinderung der Betreuungsperson (z. B. wegen einer schwerwiegenden Krankheit oder aus anderem wichtigen Grund) ist der DL berechtigt, die Betreuungsperson schnellstmöglich (in der Regel innerhalb von 3 Tagen) zu wechseln und durch eine andere adäquate Betreuungsperson vertreten zu lassen.</p>
          <p>5. Bei begründetem und nachvollziehbarem Wunsch des AG wird der DL einen Austausch der Betreuungsperson vornehmen. Für die Ausführung wird dem DL ein Zeitraum von mindestens einer Woche gewährt.</p>
          <p>6. Die eingesetzten Betreuungspersonen des DL können nicht durch den AG zu anderen Zwecken eingeteilt oder an andere Leistungsorte verliehen werden.</p>
          <p>7. Mängel und Beschwerden müssen dem DL unverzüglich schriftlich angezeigt werden.</p>
          <p>8. Der DL erbringt seine Dienstleistungen gemäß den Vorschriften der EU am Leistungsort. Beide Vertragsparteien sind sich darüber einig:</p>
          <ul>
            <li>der AG erstellt weder Dienst- noch Freizeitpläne</li>
            <li>der AG übt keinen Einfluss auf Art und Weise der Aufgaben der Betreuungsperson aus</li>
            <li>der AG erteilt keine direkten und bindenden Weisungen und übt kein Direktionsrecht aus</li>
            <li>der AG bindet die Betreuungsperson nicht in eigene Betriebsabläufe ein</li>
          </ul>
          <p>9. Die wöchentliche durchschnittliche Arbeitszeit darf 40 Stunden nicht überschreiten. Außerhalb der Arbeitszeit steht es der Betreuungsperson frei, den Leistungsort zu verlassen.</p>
          <p>10. Der AG stellt der Betreuungsperson die Mitbenutzung eines Telefons für nationale Festnetztelefonate sowie Festnetztelefonate ins Heimatland und Internet zur Verfügung.</p>
          <h2>§ 2 Unterbringung / Verpflegung / Transfer</h2>
          <p>1. Der AG verpflichtet sich, der Betreuungsperson ausreichenden, unentgeltlichen Wohnraum (z. B. ein Zimmer) zur alleinigen, privaten und freiwilligen Nutzung zur Verfügung zu stellen. Der Wohnraum muss ausreichend möbliert, beheizt, verschließbar und hygienisch einwandfrei mit einem Tageslichtfenster versehen sein.</p>
          <p>2. Der AG trägt alle Kosten der Leistungserbringung, Ernährungs- und Lebenshaltungskosten sowie die Kosten für die mit der Betreuung verbundenen Mittel und Geräte.</p>
          <p>3. Der AG verpflichtet sich, am vorher vereinbarten Ankunftstag die Betreuungsperson am nächstgelegenen Ankunftsort auf eigene Kosten abzuholen. Der DL haftet nicht für Verspätungen infolge der Busreisedauer oder persönlicher Angelegenheiten der Betreuungspersonen.</p>
          <div className="contract-page-spacer" /><div className="page-footer"><span>PRIMUNDUS | www.primundus.de</span><span>Seite 2 von 8</span></div>
        </div>

        {/* PAGE 3 — §3–4 */}
        <div className="contract-page">
          <h2>§ 3 Vertragsdauer / Vertragskündigung</h2>
          <p>1. Der Vertrag beginnt voraussichtlich am <span className="field-blank">{vertragsBeginn}</span> und wird <span className="field-blank" style={{minWidth:'160pt'}}>{vertragsDauer}</span> geschlossen.</p>
          <p>2. Der AG verlangt vom DL ausdrücklich, dass dieser mit der Leistungserbringung bereits vor Ablauf der Widerrufsfrist gemäß § 8 beginnt.</p>
          <p>3. Der Vertrag kann von beiden Seiten ohne Einhaltung einer Kündigungsfrist gekündigt werden.</p>
          <p>4. Die Kündigung bedarf zu ihrer Wirksamkeit zwingend der Textform (Brief, Fax, E-Mail).</p>
          <p>5. Der Auftraggeber gewährt dem Dienstleister eine Frist von maximal 3 Tagen zur Organisation der Rückreise der Betreuungsperson sowie während dieser Frist weiterhin Unterkunft und Verpflegung.</p>
          <p>6. Die Abwesenheit des LE am Leistungsort bis zu 7 Tagen lässt den Vertragsbestand unberührt. Ab dem 8. Tag ruht der Vertrag kostenlos für den AG bis die Betreuung wieder fortgesetzt wird.</p>
          <p>7. Bei Beschwerden über die Erbringung der vereinbarten Leistungen ist der DL unverzüglich zu informieren. Eine Minderung kann nur erfolgen, wenn der Minderungsgrund innerhalb von 5 Tagen angezeigt wurde und zwischen den Parteien unstrittig ist.</p>
          <h2>§ 4 Vergütung</h2>
          <p>1. Der DL erhält für die vereinbarten Dienstleistungen eine Vergütung von <strong><span className="field-blank">{tagessatzFmt}</span> pro Tag (Tagessatz)</strong> zzgl. Reisekostenvergütung i.H.v. EUR 125,00 pro Fahrt.</p>
          <p>2. Die Vergütung wird berechnet ab dem Tag der Ankunft der Betreuungsperson am Leistungsort.</p>
          <p>3. Beginnt oder endet die Vertragslaufzeit im Laufe eines Monats, erfolgt eine anteilige Berechnung der vereinbarten Vergütung.</p>
          <p>4. Die Rechnungen werden monatlich zum 15. ausgestellt. Der Rechnungsbetrag ist bis spätestens 7 Tage nach Erhalt zu überweisen.</p>
          <p>5. Sollten sich die Betreuungsbedürfnisse der zu betreuenden Person ändern, behält sich der DL das Recht zur Anpassung des Honorars vor.</p>
          <p>6. Im Falle einer Arbeitsunfähigkeit der Betreuungsperson wird für die Zeit der Verhinderung kein Honorar berechnet.</p>
          <p>7. Der Anreisetag und der Abreisetag werden als volle Dienstleistungstage berechnet. Bei einem Personalwechsel wird der volle Tagessatz für beide Betreuungspersonen berechnet.</p>
          <p>8. An gesetzlichen Feiertagen wird der doppelte Tagessatz berechnet.</p>
          <p>9. In den Sommermonaten Juli und August wird ein Sommerzuschlag von 200,00 € pro Monat (entspricht ca. 6,67 € pro Tag) berechnet.</p>
          <p>10. Nach der aktuellen Gesetzeslage ist auf die Dienstleistungen des DL keine gesetzliche Mehrwertsteuer zu entrichten.</p>
          <p>11. Bei Zahlungsverzug hat der DL das Recht, Dritte mit der Rechnungsabwicklung zu beauftragen und Verzugszinsen in Höhe von 5 Prozent p. a. über dem jeweiligen Basiszinssatz zu berechnen.</p>
          <p>12. Der DL ist berechtigt, bei ausbleibender Zahlung die Betreuungsperson ersatzlos abreisen zu lassen und den Vertrag außerordentlich fristlos zu kündigen.</p>
          <div className="contract-page-spacer" /><div className="page-footer"><span>PRIMUNDUS | www.primundus.de</span><span>Seite 3 von 8</span></div>
        </div>

        {/* PAGE 4 — §5–7 */}
        <div className="contract-page">
          <h2>§ 5 Haftung des Dienstleisters</h2>
          <p>1. Der DL erklärt, dass die von ihm beauftragten Betreuungspersonen über eine Haftpflichtversicherung verfügen.</p>
          <p>2. Der Dienstleister haftet für Schäden an Leib, Leben oder Gesundheit nach den gesetzlichen Vorschriften und jeweils bis zu EUR 1.000.000,00 pro Schadenfall. Die Haftung für Schäden und Folgeschäden wird ausgeschlossen, wenn der Schaden in geringen Beschädigungen (bis zu EUR 100,00) besteht, die bei der Verrichtung alltäglicher Haushaltspflichten entstanden sind, oder wenn der Schaden einen normalen Verschleiß der Ausstattung darstellt.</p>
          <p>3. Der DL und die Betreuungspersonen leisten keine medizinische Behandlungspflege im Sinne des SGB V und übernehmen keine Verantwortung für Umstände, die durch Nichteinhaltung ärztlicher Anordnungen durch den AG oder LE entstehen.</p>
          <p>4. Im Falle der Übergabe eines Kraftfahrzeugs an die Betreuungsperson können keine Ansprüche gegenüber dem DL geltend gemacht werden.</p>
          <h2>§ 6 Datenschutz / Vertraulichkeitsvereinbarung</h2>
          <p>1. Beide Parteien verpflichten sich zum Schutz aller personenbezogenen Daten gemäß der EU-DSGVO. Der DL verpflichtet sich zur vertraulichen Behandlung der persönlichen Daten des AG und LE.</p>
          <p>2. Der DL verarbeitet anvertraute personenbezogene Daten nur soweit, als es zur Begründung, Durchführung oder Beendigung dieses Vertrages erforderlich ist.</p>
          <p>3. Der AG verpflichtet sich zur vollen Verschwiegenheit gegenüber Dritten in Bezug auf sämtliche Daten, die im Zusammenhang mit der Erbringung der Dienstleistung erlangt werden.</p>
          <p>4. Der AG und der LE willigen ein, dass die zur Erfüllung des Vertrages notwendigen Daten vom DL erhoben, gespeichert, verarbeitet und an seine Mitarbeiter und Betreuungspersonen weitergegeben werden dürfen.</p>
          <h2>§ 7 Wettbewerbsverbot</h2>
          <p>1. Für die Betreuungspersonen gilt sowohl während der Vertragsdauer als auch bis 12 Monate nach Beendigung ein Konkurrenz- und Wettbewerbsverbot. Es ist nicht gestattet, ein mittelbares oder unmittelbares Rechtsverhältnis zu einer Betreuungsperson des DL zu begründen.</p>
          <p>2. Im Falle einer schuldhaften Annahme eines Auftrages durch eine Betreuungsperson beim AG mit Ausschließung des DL, verpflichtet sich der AG, eine Vertragsstrafe in Höhe von EUR 5.000,00 zu zahlen.</p>
          <div className="contract-page-spacer" /><div className="page-footer"><span>PRIMUNDUS | www.primundus.de</span><span>Seite 4 von 8</span></div>
        </div>

        {/* PAGE 5 — §8–10 + Unterschriften */}
        <div className="contract-page">
          <h2>§ 8 Widerrufsrecht</h2>
          <p>1. Dem AG steht das Recht zu, diesen Vertrag ohne Angabe von Gründen innerhalb von 14 Tagen in Textform zu widerrufen. Die Widerrufsfrist beginnt mit Unterzeichnung dieses Vertrages. Widerruf an:</p>
          <p style={{marginLeft:'15pt'}}>Primundus Deutschland (VITANAS GROUP sp. z o. o), Poznanska 21/48, 00-685 Warszawa</p>
          <p>2. Im Falle eines wirksamen Widerrufs sind die beiderseits empfangenen Leistungen zurückzugewähren. Der AG ist verpflichtet, dem DL Wertersatz zu leisten (z. B. entstandene Reisekosten, pauschal EUR 125,00).</p>
          <p>3. Der AG bestätigt durch Unterzeichnung, dass er ausdrücklich verlangt, dass die Leistungserbringung vor Ablauf der Widerrufsfrist beginnt.</p>
          <h2>§ 9 Einhaltung der gültigen Sozialversicherungspflichten</h2>
          <p>1. Der DL erklärt, dass er alle auszuführenden Tätigkeiten nach den gültigen Gesetzen, insbesondere der EU-Dienstleistungsrichtlinie und dem Arbeitnehmer-Entsendegesetz, rechtmäßig befolgt.</p>
          <p>2. Die Vergütung des Personals richtet sich nach dem deutschen Mindestlohn.</p>
          <p>3. Die von ihm beauftragten Betreuungspersonen sind ordnungsgemäß nach polnischem Sozialversicherungsrecht versichert und mit A1-Bescheinigungen der polnischen Sozialversicherungsanstalt (ZUS) entsandt.</p>
          <h2>§ 10 Schlussbestimmungen</h2>
          <p>1. Änderungen und Ergänzungen bedürfen der Schriftform. 2. Rechnungen und Korrespondenz werden an die E-Mailadresse des AG auf Seite 1 gesendet. 3. Eine E-Mail ist gemäß diesem Vertrag ebenfalls Schriftform. 4. Sollten einzelne Bestimmungen unwirksam sein, gelten die übrigen fort. 5. Der AG bestätigt mit seiner Unterschrift den gesamten Inhalt des Vertrages gelesen zu haben. 6. Mündliche Nebenabreden bestehen nicht. 7. Der Vertrag unterliegt deutschem Recht.</p>
          <hr className="divider" />
          <div className="sig-place">{ortUnterzeichnung || '________________________'}, den ___________________</div>
          <div className="sig-row">
            <div className="sig-box"><div className="sig-line">Ort, Datum, Unterschrift Auftraggeber<br />(bzw. Bevollmächtigter oder gesetzlicher Vertreter)</div></div>
            <div className="sig-box"><div className="sig-line">Ort, Datum, Unterschrift Dienstleister</div></div>
          </div>
          <div className="contract-page-spacer" /><div className="page-footer"><span>PRIMUNDUS | www.primundus.de</span><span>Seite 5 von 8</span></div>
        </div>

        {/* PAGE 6 — Anlage 1 */}
        <div className="contract-page">
          <div className="annexe-block">
            <p className="annexe-title">Anlage 1 zum Dienstleistungsvertrag</p>
            <p className="annexe-subtitle">Hinweise zum Datenschutz (EU-DSGVO) und Einwilligungserklärung</p>
          </div>
          <p>PRIMUNDUS ist verantwortlich für den Schutz, Sicherheit und Verwaltung Ihrer Daten. Kontakt: <strong>datenschutz@primundus.de</strong></p>
          <p>Die angegebenen personenbezogenen Daten, insbesondere Name, Anschrift, Telefonnummer, Bankdaten, Gesundheitsdaten und familiäre Daten, werden auf Grundlage der geltenden EU-DSGVO ausschließlich zum Zwecke der Durchführung des entstehenden Vertragsverhältnisses erhoben und verarbeitet.</p>
          <p>Ihre Vertragsdaten speichern wir gemäß den gesetzlichen Vorgaben. Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Sperrung, Einschränkung der Verarbeitung, Widerspruch und Datenübertragbarkeit sowie das Recht auf Beschwerde bei einer zuständigen Aufsichtsbehörde.</p>
          <p>Unsere Datenschutzerklärung finden Sie unter www.primundus-mallorca.de.</p>
          <p style={{marginTop:'14pt',fontWeight:'bold'}}>Einwilligung zur Datennutzung zu Werbezwecken:</p>
          <p>Ich bin damit einverstanden, dass PRIMUNDUS mir postalisch / per E-Mail / Telefon / Fax Informationen und Angebote zum Zwecke der Eigenwerbung zusendet.</p>
          <div className="sig-row" style={{marginTop:'40pt'}}>
            <div className="sig-box"><div className="sig-line">Ort, Datum, Unterschrift Auftraggeber<br />(bzw. Bevollmächtigter oder gesetzlicher Vertreter)</div></div>
          </div>
          <div className="contract-page-spacer" /><div className="page-footer"><span>PRIMUNDUS | www.primundus.de</span><span>Seite 6 von 8</span></div>
        </div>

        {/* PAGE 7 — Anlage 2 */}
        <div className="contract-page">
          <div className="annexe-block">
            <p className="annexe-title">Anlage 2 zum Dienstleistungsvertrag</p>
            <p className="annexe-subtitle">Leistungsumfang</p>
          </div>
          <p>Die Vertragspartner vereinbaren, dass folgende Leistungen im Rahmen des abgeschlossenen Dienstleistungsvertrages erbracht werden. Beide Parteien sind sich darüber einig, dass zeitlich überwiegend nur Leistungen im Bereich der hauswirtschaftlichen Versorgung erbracht werden.</p>
          <h2>Hauswirtschaftliche Leistungen (zeitlich überwiegend)</h2>
          <ul>
            <li>Alle notwendigen Maßnahmen zur Aufrechterhaltung einer eigenständigen Haushaltsführung</li>
            <li>Ordnung und Reinigung der vom LE genutzten Zimmer/Räume (Fensterreinigung, Garage, Heizräume und Außengebäude ausgeschlossen)</li>
            <li>Einkaufen</li>
            <li>Spülen des alltäglichen Geschirrs</li>
            <li>Waschen und Wechseln der Wäsche sowie Kleidung</li>
            <li>Zubereitung von Speisen und Getränken</li>
            <li>Pflege von Zimmerpflanzen</li>
            <li>Begleitung bei Spaziergängen</li>
            <li>Versorgung von Haustieren</li>
            <li>Aktivierende Tätigkeiten und Besorgungen (z. B. Begleitung bei Kulturveranstaltungen, Spiele etc.)</li>
          </ul>
          <h2>Grundpflege nach § 14 Abs. 4 Nr. 1–3 SGB XI (zeitlich nicht überwiegend)</h2>
          <ul>
            <li>Körperpflege (z. B. Waschen, Duschen, Baden, Rasieren, Mund- und Zahnpflege, Hautpflege)</li>
            <li>Hilfe bei der Nahrungsaufnahme</li>
            <li>Hilfe bei der Mobilität (z. B. Aufstehen, Zubettgehen, An- und Auskleiden, Treppensteigen)</li>
            <li>Begleitung von Arztbesuchen</li>
          </ul>
          <p><strong>Ausdrücklich ausgenommen:</strong> Leistungen der medizinischen Behandlungspflege nach SGB V.</p>
          <div className="sig-row" style={{marginTop:'40pt'}}>
            <div className="sig-box"><div className="sig-line">Ort, Datum, Unterschrift Auftraggeber<br />(bzw. Bevollmächtigter oder gesetzlicher Vertreter)</div></div>
            <div className="sig-box"><div className="sig-line">Ort, Datum, Unterschrift Dienstleister</div></div>
          </div>
          <div className="contract-page-spacer" /><div className="page-footer"><span>PRIMUNDUS | www.primundus.de</span><span>Seite 7 von 8</span></div>
        </div>

      </div>
    </>
  );
}

/* ── Email Preview ───────────────────────────────────────────── */
export function EmailPreviewFrame({ lead, agName, versandBetreff, versandAnschreiben, tagessatzFmt, vertragsBeginnFmt, vertragsDauerFmt }: any) {
  const anrede = lead.anrede_text || lead.anrede || '';
  const nachname = lead.nachname || '';
  const vorname = lead.vorname || '';
  let anredeText = 'Guten Tag';
  if (anrede === 'Frau' && nachname) anredeText = `Sehr geehrte Frau ${nachname}`;
  else if (anrede === 'Herr' && nachname) anredeText = `Sehr geehrter Herr ${nachname}`;
  else if (anrede === 'Familie' && nachname) anredeText = `Sehr geehrte Familie ${nachname}`;
  else if (vorname && nachname) anredeText = `Guten Tag ${vorname} ${nachname}`;
  else if (vorname) anredeText = `Guten Tag ${vorname}`;

  const defaultText = `anbei finden Sie Ihren Dienstleistungsvertrag mit PRIMUNDUS Deutschland zur Durchsicht. Bitte prüfen Sie alle Angaben sorgfältig und senden Sie uns den unterzeichneten Vertrag zurück – per Post, Fax oder eingescannt per E-Mail.\n\nBei Fragen stehen wir Ihnen jederzeit gerne zur Verfügung.`;
  const bodyText = versandAnschreiben || defaultText;

  const detailRows = [
    agName ? { label: 'Auftraggeber', val: agName } : null,
    vertragsBeginnFmt && vertragsBeginnFmt !== '_______________' ? { label: 'Vertragsbeginn', val: vertragsBeginnFmt } : null,
    vertragsDauerFmt ? { label: 'Vertragsdauer', val: vertragsDauerFmt } : null,
    tagessatzFmt && tagessatzFmt !== '_______________' ? { label: 'Tagessatz (§ 4)', val: `${tagessatzFmt}/Tag` } : null,
  ].filter(Boolean) as { label: string; val: string }[];

  return (
    <div className="bg-[#f0ece6] p-6">
      <div className="max-w-[600px] mx-auto bg-white rounded overflow-hidden shadow-md text-sm" style={{fontFamily:"'Helvetica Neue', Arial, sans-serif"}}>
        <div className="px-10 py-7" style={{backgroundColor:'#5C4A32'}}>
          <div className="flex items-center justify-between">
            <div><span className="text-white font-bold text-lg tracking-wide">PRIMUNDUS</span><span className="text-[#c8b89a] text-xs ml-2">Deutschland</span></div>
            <span className="text-[#c8b89a] text-xs">24h-Pflege und Betreuung</span>
          </div>
        </div>
        <div className="px-10 py-3.5" style={{backgroundColor:'#4a3928'}}>
          <span className="text-[#e8ddd0] text-sm">📄 {versandBetreff || 'Ihr Dienstleistungsvertrag – PRIMUNDUS Deutschland'}</span>
        </div>
        <div className="px-10 py-8">
          <p className="text-base text-gray-800 mb-5">{anredeText},</p>
          <div className="text-[15px] text-gray-600 leading-relaxed mb-6">
            {bodyText.split('\n\n').map((para: string, i: number) => <p key={i} className="mb-4">{para}</p>)}
          </div>
          {detailRows.length > 0 && (
            <div className="rounded-r border border-[#e8ddd0] border-l-4 border-l-[#5C4A32] p-5 mb-6" style={{backgroundColor:'#faf8f5'}}>
              <p className="text-xs text-[#7a6a56] uppercase tracking-wider font-semibold mb-3">Vertragsdetails</p>
              <table className="w-full text-sm"><tbody>
                {detailRows.map((row, i) => (
                  <tr key={i}><td className="pr-4 py-1 text-gray-400 whitespace-nowrap">{row.label}</td><td className="py-1 font-semibold text-gray-800">{row.val}</td></tr>
                ))}
              </tbody></table>
            </div>
          )}
          <p className="text-sm text-gray-500 leading-relaxed">Den vollständigen Vertrag finden Sie im Anhang dieser E-Mail.</p>
        </div>
        <div className="px-10 pb-7">
          <p className="text-xs text-gray-400 mb-1">Fragen? Wir sind für Sie da:</p>
          <p className="text-sm font-semibold" style={{color:'#5C4A32'}}>089 200 000 830 · info@primundus.de</p>
        </div>
        <div className="px-10 pb-8 border-t border-gray-100 pt-5">
          <p className="text-sm text-gray-600 mb-1">Mit freundlichen Grüßen</p>
          <p className="text-sm font-semibold text-gray-800">Ihr PRIMUNDUS-Team</p>
        </div>
        <div className="px-10 py-4 border-t border-[#e8ddd0] text-center" style={{backgroundColor:'#f7f4f0'}}>
          <p className="text-xs text-gray-400 leading-relaxed">PRIMUNDUS Deutschland (VITANAS GROUP sp. z o. o) · Poznanska 21/48, 00-685 Warszawa<br />Telefon: 089 200 000 830 · E-Mail: info@primundus.de · www.primundus.de</p>
        </div>
      </div>
      <div className="max-w-[600px] mx-auto mt-3 flex items-center gap-2 text-xs text-gray-500 px-1">
        <span>📎</span><span>Anhang: <strong>Dienstleistungsvertrag_{lead.nachname || lead.vorname || 'Primundus'}.html</strong></span>
      </div>
    </div>
  );
}
