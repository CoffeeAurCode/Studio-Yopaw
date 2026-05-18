import { useEffect, useState } from 'react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { useI18n } from '../i18n/LanguageProvider'
import type { Lang } from '../i18n/siteStrings'

function canonicalWaiverPath(lang: Lang): string {
  return lang === 'fr' ? '/renonciation' : '/waiver'
}

function WaiverContentEn() {
  return (
    <>
      <section className="policy-section" aria-labelledby="waiver-s1">
        <h2 id="waiver-s1">1. Acknowledgment of Risks</h2>
        <p>
          I acknowledge that my participation in activities organized by Studio Yopaw, including but not
          limited to puppy yoga, interactions with animals, and any related activities, involves certain
          inherent, foreseeable, or unforeseeable risks.
        </p>
        <p>These risks include, but are not limited to:</p>
        <ul className="policy-list">
          <li>bites, scratches, or physical contact with puppies</li>
          <li>allergic reactions</li>
          <li>falls, slips, or physical injuries</li>
          <li>property damage</li>
          <li>unpredictable animal behavior</li>
          <li>possible transmission of illnesses or bacteria despite sanitary measures in place</li>
        </ul>
        <p>
          I understand that, despite all reasonable precautions taken by Studio Yopaw, it is impossible to
          completely eliminate all risks.
        </p>
      </section>

      <section className="policy-section" aria-labelledby="waiver-s2">
        <h2 id="waiver-s2">2. Voluntary Participation</h2>
        <p>I confirm that I am voluntarily participating in the activity and that I am physically fit to do so.</p>
        <p>
          I declare that I do not have any known medical condition that could compromise my safety or the
          safety of other participants.
        </p>
        <p>
          I understand that it is my responsibility to act in a prudent, respectful, and safe manner toward
          the animals, instructors, employees, and other participants.
        </p>
      </section>

      <section className="policy-section" aria-labelledby="waiver-s3">
        <h2 id="waiver-s3">3. Compliance with Rules and Instructions</h2>
        <p>I agree to comply at all times with:</p>
        <ul className="policy-list">
          <li>the instructions provided by Studio Yopaw</li>
          <li>all safety rules</li>
          <li>all animal welfare guidelines</li>
          <li>all interaction limits imposed regarding the puppies</li>
        </ul>
        <p>
          I understand that Studio Yopaw may immediately terminate my participation without refund if my
          behavior is deemed dangerous, disrespectful, or inappropriate.
        </p>
      </section>

      <section className="policy-section" aria-labelledby="waiver-s4">
        <h2 id="waiver-s4">4. Release of Liability</h2>
        <p>
          In consideration of my participation in activities organized by Studio Yopaw, I voluntarily waive
          and release any claim, lawsuit, action, or demand against Studio Yopaw, its owners, directors,
          employees, instructors, volunteers, partners, breeders, and representatives for any damage, injury,
          loss, accident, or harm that may occur during or as a result of my participation.
        </p>
        <p>This release applies, in particular, to:</p>
        <ul className="policy-list">
          <li>bodily injuries</li>
          <li>property damage</li>
          <li>financial losses</li>
          <li>allergic reactions</li>
          <li>incidents involving the puppies</li>
          <li>accidents occurring at the activity location</li>
        </ul>
        <p>
          However, this waiver does not apply in cases of gross negligence or willful misconduct by Studio
          Yopaw.
        </p>
      </section>

      <section className="policy-section" aria-labelledby="waiver-s5">
        <h2 id="waiver-s5">5. Personal Responsibility</h2>
        <p>I remain fully responsible for:</p>
        <ul className="policy-list">
          <li>my actions</li>
          <li>my personal belongings</li>
          <li>any damage I may cause to others, the facilities, or the animals</li>
        </ul>
        <p>I agree to reimburse any damage caused intentionally or through negligence.</p>
      </section>

      <section className="policy-section" aria-labelledby="waiver-s6">
        <h2 id="waiver-s6">6. Emergency Medical Authorization</h2>
        <p>
          In the event of an emergency, I authorize Studio Yopaw to contact emergency medical services and
          to take any reasonable measures necessary to ensure my safety.
        </p>
        <p>Any medical or transportation costs remain my responsibility.</p>
      </section>

      <section className="policy-section" aria-labelledby="waiver-s7">
        <h2 id="waiver-s7">7. Use of Image and Likeness</h2>
        <p>
          I authorize Studio Yopaw to use any photographs or videos taken during the activity for
          promotional, advertising, or social media purposes, without financial compensation.
        </p>
      </section>

      <section className="policy-section" aria-labelledby="waiver-s8">
        <h2 id="waiver-s8">8. Minors</h2>
        <p>
          For any minor participant, the signing parent or legal guardian acknowledges having read and
          accepted this waiver on behalf of the minor.
        </p>
      </section>

      <section className="policy-section policy-section--last" aria-labelledby="waiver-s9">
        <h2 id="waiver-s9">9. Acceptance</h2>
        <p>
          I acknowledge that I have carefully read this waiver, understand its contents, and freely accept
          all of its terms and conditions.
        </p>
      </section>
    </>
  )
}

function WaiverContentFr() {
  return (
    <>
      <section className="policy-section" aria-labelledby="waiver-s1">
        <h2 id="waiver-s1">1. Reconnaissance des risques</h2>
        <p>
          Je reconnais que ma participation aux activités organisées par Studio Yopaw, incluant notamment le
          yoga avec chiots, les interactions avec des animaux et toute activité connexe, comporte certains
          risques inhérents, prévisibles ou imprévisibles.
        </p>
        <p>Ces risques incluent notamment, sans s&apos;y limiter :</p>
        <ul className="policy-list">
          <li>morsures, griffures ou contacts physiques avec les chiots</li>
          <li>réactions allergiques</li>
          <li>chutes, glissades ou blessures physiques</li>
          <li>dommages matériels</li>
          <li>comportements imprévisibles d&apos;animaux</li>
          <li>transmission possible de maladies ou bactéries malgré les mesures sanitaires en place</li>
        </ul>
        <p>
          Je comprends que, malgré toutes les précautions raisonnables prises par Studio Yopaw, il est
          impossible d&apos;éliminer complètement tous les risques.
        </p>
      </section>

      <section className="policy-section" aria-labelledby="waiver-s2">
        <h2 id="waiver-s2">2. Participation volontaire</h2>
        <p>
          Je confirme participer volontairement à l&apos;activité et être physiquement apte à y participer.
        </p>
        <p>
          Je déclare ne présenter aucune condition médicale connue pouvant compromettre ma sécurité ou celle
          des autres participants.
        </p>
        <p>
          Je comprends qu&apos;il est de ma responsabilité d&apos;agir de façon prudente, respectueuse et
          sécuritaire envers les animaux, les instructeurs, les employés et les autres participants.
        </p>
      </section>

      <section className="policy-section" aria-labelledby="waiver-s3">
        <h2 id="waiver-s3">3. Respect des consignes et instructions</h2>
        <p>Je m&apos;engage à respecter en tout temps :</p>
        <ul className="policy-list">
          <li>les directives données par Studio Yopaw</li>
          <li>les règles de sécurité</li>
          <li>les consignes relatives au bien-être animal</li>
          <li>les limites d&apos;interaction imposées avec les chiots</li>
        </ul>
        <p>
          Je comprends que Studio Yopaw peut mettre fin immédiatement à ma participation sans remboursement
          si mon comportement est jugé dangereux, irrespectueux ou inapproprié.
        </p>
      </section>

      <section className="policy-section" aria-labelledby="waiver-s4">
        <h2 id="waiver-s4">4. Décharge de responsabilité</h2>
        <p>
          En contrepartie de ma participation aux activités de Studio Yopaw, je renonce volontairement à
          toute réclamation, poursuite, action ou demande contre Studio Yopaw, ses propriétaires,
          administrateurs, employés, instructeurs, bénévoles, partenaires, éleveurs et représentants pour
          tout dommage, blessure, perte, accident ou préjudice pouvant survenir durant ou à la suite de ma
          participation.
        </p>
        <p>Cette décharge s&apos;applique notamment :</p>
        <ul className="policy-list">
          <li>aux blessures corporelles</li>
          <li>aux dommages matériels</li>
          <li>aux pertes financières</li>
          <li>aux réactions allergiques</li>
          <li>aux incidents impliquant les chiots</li>
          <li>aux accidents sur les lieux de l&apos;activité</li>
        </ul>
        <p>
          La présente décharge ne s&apos;applique toutefois pas en cas de faute lourde ou de négligence
          grave de Studio Yopaw.
        </p>
      </section>

      <section className="policy-section" aria-labelledby="waiver-s5">
        <h2 id="waiver-s5">5. Responsabilité personnelle</h2>
        <p>Je demeure entièrement responsable de :</p>
        <ul className="policy-list">
          <li>mes gestes</li>
          <li>mes effets personnels</li>
          <li>tout dommage que je pourrais causer à autrui, aux installations ou aux animaux</li>
        </ul>
        <p>J&apos;accepte de rembourser tout dommage causé volontairement ou par négligence.</p>
      </section>

      <section className="policy-section" aria-labelledby="waiver-s6">
        <h2 id="waiver-s6">6. Autorisation de soins d&apos;urgence</h2>
        <p>
          En cas d&apos;urgence, j&apos;autorise Studio Yopaw à communiquer avec les services médicaux
          d&apos;urgence et à prendre les mesures raisonnables nécessaires pour assurer ma sécurité.
        </p>
        <p>Tous les frais médicaux ou de transport demeurent ma responsabilité.</p>
      </section>

      <section className="policy-section" aria-labelledby="waiver-s7">
        <h2 id="waiver-s7">7. Utilisation d&apos;image</h2>
        <p>
          J&apos;autorise Studio Yopaw à utiliser toute photo ou vidéo prise durant l&apos;activité à des
          fins promotionnelles, publicitaires ou sur les réseaux sociaux, sans compensation financière.
        </p>
      </section>

      <section className="policy-section" aria-labelledby="waiver-s8">
        <h2 id="waiver-s8">8. Mineurs</h2>
        <p>
          Pour tout participant mineur, le parent ou tuteur légal signataire reconnaît avoir lu et accepté
          la présente décharge au nom du mineur.
        </p>
      </section>

      <section className="policy-section policy-section--last" aria-labelledby="waiver-s9">
        <h2 id="waiver-s9">9. Acceptation</h2>
        <p>
          Je reconnais avoir lu attentivement la présente décharge, en comprendre le contenu et accepter
          librement l&apos;ensemble des conditions.
        </p>
      </section>
    </>
  )
}

export function WaiverPage() {
  const { lang } = useI18n()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const want = canonicalWaiverPath(lang)
    const raw = window.location.pathname.replace(/\/$/, '') || '/'
    if (raw !== want) {
      window.history.replaceState(null, '', `${want}${window.location.search}${window.location.hash}`)
    }
  }, [lang])

  useEffect(() => {
    document.title = lang === 'fr' ? 'Décharge de responsabilité | Studio Yopaw' : 'Liability Waiver | Studio Yopaw'
  }, [lang])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const title = lang === 'fr' ? 'Décharge de responsabilité' : 'Liability Waiver'
  const subtitle =
    lang === 'fr'
      ? 'Veuillez lire attentivement avant de participer.'
      : 'Please read carefully before participating.'

  return (
    <div className="site-wrapper policy-page-root">
      <Navbar scrolled={scrolled} variant="solid" />
      <main className="policy-page">
        <header className="policy-page-header">
          <h1>{title}</h1>
          <p className="policy-page-subtitle">{subtitle}</p>
        </header>
        {lang === 'fr' ? <WaiverContentFr /> : <WaiverContentEn />}
      </main>
      <Footer />
    </div>
  )
}
