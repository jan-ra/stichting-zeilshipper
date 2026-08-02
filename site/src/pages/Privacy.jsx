import { useLanguage } from '../context/LanguageContext.jsx'
import { SITE_SETTINGS } from '../data/content.js'

export default function PrivacyPage({ navigate }) {
  const { lang } = useLanguage()
  const isNl = lang !== 'en'

  return (
    <div style={{ paddingTop: 68 }}>
      <div style={{ background: '#0f2238', padding: '64px 2rem 48px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>
            {isNl ? 'Juridisch' : 'Legal'}
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 48px)', color: '#f4ede1', fontWeight: 400, lineHeight: 1.15 }}>
            {isNl ? 'Privacybeleid' : 'Privacy Policy'}
          </h1>
        </div>
      </div>

      <div style={{ background: '#f4ede1', padding: '64px 2rem 96px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg, #c19a52, rgba(193,154,82,0.2))', marginBottom: 48 }} />

          {isNl ? <NlContent settings={SITE_SETTINGS} navigate={navigate} /> : <EnContent settings={SITE_SETTINGS} navigate={navigate} />}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#0f2238', marginBottom: 16, fontWeight: 400, borderBottom: '1px solid rgba(15,34,56,0.12)', paddingBottom: 10 }}>
        {title}
      </h2>
      <div style={{ fontSize: 15, color: '#3a4f65', lineHeight: 1.9 }}>
        {children}
      </div>
    </section>
  )
}

function NlContent({ settings, navigate }) {
  return (
    <>
      <p style={{ fontSize: 15, color: '#3a4f65', lineHeight: 1.9, marginBottom: 40 }}>
        Stichting Zeilschipper hecht grote waarde aan de bescherming van uw persoonsgegevens. In dit privacybeleid informeren wij u over hoe wij omgaan met persoonsgegevens op onze website, in overeenstemming met de Algemene Verordening Gegevensbescherming (AVG) en de Nederlandse uitvoeringswetgeving (UAVG).
      </p>

      <Section title="1. Verantwoordelijke">
        <p>De verwerkingsverantwoordelijke voor uw persoonsgegevens is:</p>
        <p style={{ marginTop: 12, paddingLeft: 20, borderLeft: '3px solid #c19a52' }}>
          <strong style={{ color: '#0f2238' }}>{settings.orgName}</strong><br />
          {settings.addressLine1 && <>{settings.addressLine1}<br /></>}
          {settings.addressLine2 && <>{settings.addressLine2}<br /></>}
          E-mail: <a href={`mailto:${settings.contactEmail}`} style={{ color: '#c19a52' }}>{settings.contactEmail}</a>
        </p>
      </Section>

      <Section title="2. Welke gegevens verwerken wij?">
        <p>Onze website verwerkt <strong>geen persoonsgegevens</strong> van bezoekers via cookies of analytics-tools. Er worden geen trackingcookies geplaatst en er worden geen gegevens doorgestuurd naar derden voor marketingdoeleinden.</p>
        <p style={{ marginTop: 16 }}>De website maakt uitsluitend gebruik van technisch noodzakelijke opslag in uw browser:</p>
        <ul style={{ marginTop: 8, paddingLeft: 24 }}>
          <li style={{ marginBottom: 8 }}><strong>localStorage</strong> — opslaan van uw taalvoorkeur (Nederlands of Engels). Deze voorkeur blijft bewaard totdat u uw browseropslag leegt.</li>
          <li><strong>sessionStorage</strong> — bijhouden van de actieve pagina tijdens uw bezoek. Deze gegevens worden verwijderd zodra u het browsertabblad sluit.</li>
        </ul>
        <p style={{ marginTop: 16 }}>Deze gegevens verlaten nooit uw eigen apparaat en worden nooit naar onze servers verzonden.</p>
      </Section>

      <Section title="3. Steunbrieven">
        <p>Als u via onze website een steunbrief instuurt, worden de door u ingevulde gegevens (naam, organisatie, e-mailadres, verklaring) uitsluitend gebruikt voor:</p>
        <ul style={{ marginTop: 8, paddingLeft: 24 }}>
          <li style={{ marginBottom: 8 }}>Het opstellen van het UNESCO-nominatiedossier;</li>
          <li>Het bijhouden van de lijst van ondersteuners van de nominatie.</li>
        </ul>
        <p style={{ marginTop: 16 }}>Uw gegevens worden niet gedeeld met derden en worden niet langer bewaard dan noodzakelijk voor het UNESCO-traject.</p>
      </Section>

      <Section title="4. Grondslag voor verwerking">
        <p>De verwerking van persoonsgegevens via steunbrieven geschiedt op basis van <strong>toestemming</strong> (artikel 6, lid 1, sub a AVG). U kunt uw toestemming altijd intrekken door contact met ons op te nemen.</p>
      </Section>

      <Section title="5. Uw rechten">
        <p>Op grond van de AVG heeft u de volgende rechten:</p>
        <ul style={{ marginTop: 8, paddingLeft: 24 }}>
          <li style={{ marginBottom: 6 }}><strong>Recht op inzage</strong> — u kunt opvragen welke gegevens wij van u bewaren.</li>
          <li style={{ marginBottom: 6 }}><strong>Recht op rectificatie</strong> — u kunt onjuiste gegevens laten corrigeren.</li>
          <li style={{ marginBottom: 6 }}><strong>Recht op verwijdering</strong> — u kunt verzoeken uw gegevens te laten verwijderen.</li>
          <li style={{ marginBottom: 6 }}><strong>Recht op beperking</strong> — u kunt de verwerking van uw gegevens laten beperken.</li>
          <li style={{ marginBottom: 6 }}><strong>Recht op dataportabiliteit</strong> — u kunt uw gegevens in een gangbaar formaat opvragen.</li>
          <li><strong>Recht om bezwaar te maken</strong> — u kunt bezwaar maken tegen de verwerking van uw gegevens.</li>
        </ul>
        <p style={{ marginTop: 16 }}>Neem hiervoor contact op via <a href={`mailto:${settings.contactEmail}`} style={{ color: '#c19a52' }}>{settings.contactEmail}</a>. Wij reageren binnen vier weken.</p>
        <p style={{ marginTop: 16 }}>U heeft tevens het recht een klacht in te dienen bij de <strong>Autoriteit Persoonsgegevens</strong> (autoriteitpersoonsgegevens.nl).</p>
      </Section>

      <Section title="6. Externe diensten">
        <p>Onze website maakt gebruik van de volgende externe diensten, die eigen privacybeleid hanteren:</p>
        <ul style={{ marginTop: 8, paddingLeft: 24 }}>
          <li style={{ marginBottom: 8 }}><strong>Google Fonts</strong> — lettertypen worden geladen van Google-servers. Google kan hierbij uw IP-adres registreren.</li>
          <li><strong>Stadia Maps</strong> — kaart- en globetegels worden geladen van Stadia Maps-servers voor de kaartweergave. Stadia Maps kan hierbij uw IP-adres registreren.</li>
        </ul>
      </Section>

      <Section title="7. Beveiliging">
        <p>Wij nemen passende technische en organisatorische maatregelen om uw persoonsgegevens te beschermen tegen verlies, misbruik en onbevoegde toegang. De website wordt aangeboden via een beveiligde HTTPS-verbinding.</p>
      </Section>

      <Section title="8. Wijzigingen">
        <p>Wij behouden ons het recht voor dit privacybeleid te wijzigen. Wijzigingen worden op deze pagina gepubliceerd. Wij adviseren u dit beleid regelmatig te raadplegen.</p>
        <p style={{ marginTop: 12, fontSize: 13, color: 'rgba(15,34,56,0.45)' }}>Laatste update: mei 2025</p>
      </Section>

      <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(15,34,56,0.12)' }}>
        <button onClick={() => navigate('home')} style={{
          background: 'none', border: '1px solid rgba(193,154,82,0.5)', cursor: 'pointer',
          fontSize: 12, color: '#c19a52', padding: '10px 20px', borderRadius: 2, letterSpacing: '0.08em',
        }}>
          ← Terug naar home
        </button>
      </div>
    </>
  )
}

function EnContent({ settings, navigate }) {
  return (
    <>
      <p style={{ fontSize: 15, color: '#3a4f65', lineHeight: 1.9, marginBottom: 40 }}>
        Stichting Zeilschipper is committed to protecting your personal data. This privacy policy explains how we handle personal data on our website, in accordance with the General Data Protection Regulation (GDPR) and applicable Dutch law (UAVG).
      </p>

      <Section title="1. Data Controller">
        <p>The controller responsible for your personal data is:</p>
        <p style={{ marginTop: 12, paddingLeft: 20, borderLeft: '3px solid #c19a52' }}>
          <strong style={{ color: '#0f2238' }}>{settings.orgName}</strong><br />
          {settings.addressLine1 && <>{settings.addressLine1}<br /></>}
          {settings.addressLine2 && <>{settings.addressLine2}<br /></>}
          Email: <a href={`mailto:${settings.contactEmail}`} style={{ color: '#c19a52' }}>{settings.contactEmail}</a>
        </p>
      </Section>

      <Section title="2. Data We Process">
        <p>Our website does <strong>not process personal data</strong> via cookies or analytics tools. No tracking cookies are placed and no data is forwarded to third parties for marketing purposes.</p>
        <p style={{ marginTop: 16 }}>The website uses only technically necessary browser storage:</p>
        <ul style={{ marginTop: 8, paddingLeft: 24 }}>
          <li style={{ marginBottom: 8 }}><strong>localStorage</strong> — stores your language preference (Dutch or English). This preference persists until you clear your browser storage.</li>
          <li><strong>sessionStorage</strong> — tracks the active page during your visit. This data is deleted when you close the browser tab.</li>
        </ul>
        <p style={{ marginTop: 16 }}>These values never leave your device and are never sent to our servers.</p>
      </Section>

      <Section title="3. Support Letters">
        <p>If you submit a support letter through our website, the information you provide (name, organisation, email address, declaration) is used exclusively for:</p>
        <ul style={{ marginTop: 8, paddingLeft: 24 }}>
          <li style={{ marginBottom: 8 }}>Compiling the UNESCO nomination dossier;</li>
          <li>Maintaining the list of supporters of the nomination.</li>
        </ul>
        <p style={{ marginTop: 16 }}>Your data is not shared with third parties and is retained no longer than necessary for the UNESCO process.</p>
      </Section>

      <Section title="4. Legal Basis">
        <p>Processing of personal data via support letters is based on <strong>consent</strong> (Article 6(1)(a) GDPR). You may withdraw your consent at any time by contacting us.</p>
      </Section>

      <Section title="5. Your Rights">
        <p>Under the GDPR you have the following rights:</p>
        <ul style={{ marginTop: 8, paddingLeft: 24 }}>
          <li style={{ marginBottom: 6 }}><strong>Right of access</strong> — request what data we hold about you.</li>
          <li style={{ marginBottom: 6 }}><strong>Right to rectification</strong> — have inaccurate data corrected.</li>
          <li style={{ marginBottom: 6 }}><strong>Right to erasure</strong> — request deletion of your data.</li>
          <li style={{ marginBottom: 6 }}><strong>Right to restriction</strong> — request that processing be limited.</li>
          <li style={{ marginBottom: 6 }}><strong>Right to data portability</strong> — receive your data in a common format.</li>
          <li><strong>Right to object</strong> — object to the processing of your data.</li>
        </ul>
        <p style={{ marginTop: 16 }}>To exercise these rights contact us at <a href={`mailto:${settings.contactEmail}`} style={{ color: '#c19a52' }}>{settings.contactEmail}</a>. We will respond within four weeks.</p>
        <p style={{ marginTop: 16 }}>You also have the right to lodge a complaint with the <strong>Dutch Data Protection Authority</strong> (autoriteitpersoonsgegevens.nl).</p>
      </Section>

      <Section title="6. Third-Party Services">
        <p>Our website uses the following external services, each with their own privacy policies:</p>
        <ul style={{ marginTop: 8, paddingLeft: 24 }}>
          <li style={{ marginBottom: 8 }}><strong>Google Fonts</strong> — typefaces are loaded from Google servers. Google may log your IP address in this process.</li>
          <li><strong>Stadia Maps</strong> — map and globe tiles are loaded from Stadia Maps servers for the map views. Stadia Maps may log your IP address in the process.</li>
        </ul>
      </Section>

      <Section title="7. Security">
        <p>We take appropriate technical and organisational measures to protect your personal data against loss, misuse and unauthorised access. The website is served over a secure HTTPS connection.</p>
      </Section>

      <Section title="8. Changes">
        <p>We reserve the right to amend this privacy policy. Changes will be published on this page. We recommend reviewing this policy periodically.</p>
        <p style={{ marginTop: 12, fontSize: 13, color: 'rgba(15,34,56,0.45)' }}>Last updated: May 2025</p>
      </Section>

      <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(15,34,56,0.12)' }}>
        <button onClick={() => navigate('home')} style={{
          background: 'none', border: '1px solid rgba(193,154,82,0.5)', cursor: 'pointer',
          fontSize: 12, color: '#c19a52', padding: '10px 20px', borderRadius: 2, letterSpacing: '0.08em',
        }}>
          ← Back to home
        </button>
      </div>
    </>
  )
}
