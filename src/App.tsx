import { useState, useEffect, useLayoutEffect, useRef, useMemo, type FormEvent } from 'react'
import { CreditCard, PaymentForm } from 'react-square-web-payments-sdk'
import './App.css'
import type { Lang } from './i18n/siteStrings'
import { interpolate, useI18n } from './i18n/LanguageProvider'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { BookingWaiverModal } from './components/BookingWaiverModal'
import { RefundPolicyPage } from './pages/RefundPolicyPage'
import { WaiverPage } from './pages/WaiverPage'
import { useSquareAvailability, type SquareSlot } from './hooks/useSquareAvailability'
import { SQUARE_SERVICE_VARIATIONS } from './lib/squareServices'

const SQUARE_APP_ID = (import.meta.env.VITE_SQUARE_APP_ID as string | undefined) ?? ''
const SQUARE_LOCATION_ID = (import.meta.env.VITE_SQUARE_LOCATION_ID as string | undefined) ?? ''

// ── SVG Icons ──────────────────────────────────────────────

function PawIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="currentColor" className={className} aria-hidden="true">
      <ellipse cx="50" cy="72" rx="24" ry="20" />
      <ellipse cx="22" cy="48" rx="12" ry="14" />
      <ellipse cx="78" cy="48" rx="12" ry="14" />
      <ellipse cx="37" cy="28" rx="10" ry="12" />
      <ellipse cx="63" cy="28" rx="10" ry="12" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

/** Clock motif for confirmation states that await follow-up */
function PricingSuccessPendingClockIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="22" stroke="var(--sage)" strokeWidth="2" opacity="0.35" />
      <circle cx="24" cy="24" r="2.75" stroke="var(--sage-dark)" strokeWidth="1.75" />
      <path
        d="M24 15v10l9 7"
        stroke="var(--sage-dark)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Custom Hook ────────────────────────────────────────────

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold, rootMargin: '0px 0px 150px 0px' }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])
  return { ref, inView }
}

// ── Static Data ────────────────────────────────────────────

const GALLERY_IMAGES = [
  { src: '/IMG_7546.webp', tall: true as const },
  { src: '/IMG_2299_2.webp', tall: false as const },
  { src: '/IMG_7478_3c7b739e-7a8c-43b3-b104-99f3db44a731.webp', tall: false as const },
  { src: '/IMG_9045_b027fb31-b966-46ee-ac10-47bafc1ef696.webp', tall: false as const },
  { src: '/IMG_1167_ff8c28e8-ef39-491c-bf7c-ae0caa5fda75.webp', tall: false as const },
]

const CLASS_IMAGES = [
  '/magnific_change-the-dog-to-a-frenc_2935952488.png',
  '/IMG_7478_3c7b739e-7a8c-43b3-b104-99f3db44a731.webp',
  '/IMG_2299_2.webp',
  '/magnific_change-the-dog-to-a-poodl_2935981941.png',
]

/** Breed name displayed alongside each session date on the booking calendar */
const SESSION_BREEDS: Record<string, { en: string; fr: string }> = {
  '2026-06-14': { en: 'Fox Red Labrador', fr: 'Labrador roux' },
  '2026-06-21': { en: 'Silver Labrador', fr: 'Labrador argenté' },
  '2026-06-28': { en: 'Medium Goldendoodle', fr: 'Goldendoodle moyen' },
  '2026-07-04': { en: 'Goldendoodle', fr: 'Goldendoodle' },
  '2026-07-05': { en: 'Goldendoodle', fr: 'Goldendoodle' },
}


/** URL hashes that should scroll the booking card to the vertical center of the viewport */
const BOOKING_FORM_SCROLL_HASHES = new Set(['book', 'booking', 'pricing', 'corporate'])

function scrollBookingFormIntoView(behavior: ScrollBehavior = 'smooth') {
  document.getElementById('book')?.scrollIntoView({ behavior, block: 'center', inline: 'nearest' })
}

// ── Date/time helpers ──────────────────────────────────────

function formatLongSessionDate(iso: string, lang: Lang): string {
  const [y, m, day] = iso.split('-').map(Number)
  const d = new Date(y, m - 1, day)
  const loc = lang === 'fr' ? 'fr-CA' : 'en-CA'
  return d.toLocaleDateString(loc, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatShortSessionDate(iso: string, lang: Lang): string {
  const [y, m, day] = iso.split('-').map(Number)
  const d = new Date(y, m - 1, day)
  const loc = lang === 'fr' ? 'fr-CA' : 'en-CA'
  return d.toLocaleDateString(loc, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatSquareSlotTime(startAt: string | null, lang: Lang): string {
  if (!startAt) return '—'
  const d = new Date(startAt)
  return d.toLocaleTimeString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Toronto',
  })
}

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function plusDaysIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── Sections ───────────────────────────────────────────────

function HeroSection() {
  const { s } = useI18n()
  return (
    <section className="hero-section" id="hero">
      <video
        autoPlay muted loop playsInline
        className="hero-video"
        src="/182991340eeb459d952466dcb9f2d778.mp4"
      />
      <div className="hero-overlay" />
      <div className="hero-content">
        <h1 className="hero-title">
          {s.heroTitleL1}<br />
          {s.heroTitleL2Prefix}<em>{s.heroTitleItalic}</em>
        </h1>
        <p className="hero-sub">
          {s.heroSub}
        </p>
        <div className="hero-ctas">
          <a href="#book" className="btn-primary btn-lg">{s.heroBook}</a>
          <a href="#classes" className="btn-ghost   btn-lg">{s.heroClasses}</a>
        </div>
      </div>
      <div className="hero-scroll">
        <span>{s.heroScroll}</span>
        <div className="scroll-chevron" />
      </div>
    </section>
  )
}

function MarqueeTicker() {
  const { s } = useI18n()
  const doubled = [...s.marqueeItems, ...s.marqueeItems]
  return (
    <div className="marquee-wrapper" aria-hidden="true">
      <div className="marquee-track">
        {doubled.map((item, i) => (
          <span key={i} className="marquee-item">{item}</span>
        ))}
      </div>
    </div>
  )
}

function AboutSection() {
  const { ref, inView } = useInView(0.2)
  const { s } = useI18n()
  return (
    <section className="about-section" id="about">
      <div className={`about-inner${inView ? ' visible' : ''}`} ref={ref}>
        <div className="about-text">
          <span className="section-badge">{s.aboutBadge}</span>
          <h2>
            {s.aboutHeadingL1}
            <br />
            {s.aboutHeadingEmPrefix}
            <em>{s.aboutHeadingItalic}</em>.
          </h2>
          <p>{s.aboutP1}</p>
          <p>{s.aboutP2}</p>
          <p>{s.aboutP3}</p>
          <a href="#classes" className="link-arrow">{s.aboutLink}</a>
        </div>
        <div className="about-image">
          <img src="/IMG_1167_ff8c28e8-ef39-491c-bf7c-ae0caa5fda75.webp" alt={s.aboutImgAlt} />
          <div className="paw-float paw-float-1"><PawIcon size={46} /></div>
          <div className="paw-float paw-float-2"><PawIcon size={32} /></div>
          <div className="paw-float paw-float-3"><PawIcon size={22} /></div>
        </div>
      </div>
    </section>
  )
}

function ClassesSection() {
  const { ref, inView } = useInView(0.12)
  const { s } = useI18n()
  return (
    <section className="classes-section" id="classes">
      <div className="section-header">
        <span className="section-badge">{s.classesBadge}</span>
        <h2>{s.classesHeading}<em>{s.classesHeadingEm}</em>.</h2>
        {s.classesSub ? <p>{s.classesSub}</p> : null}
      </div>
      <div
        className={`classes-grid${inView ? ' visible' : ''}`}
        ref={ref}
        data-class-count={s.classCards.length}
      >
        {s.classCards.map((cls, i) => (
          <div
            key={cls.title}
            className="class-card"
            style={{ transitionDelay: `${i * 0.13}s` }}
          >
            <div className="card-image">
              <img src={CLASS_IMAGES[i]} alt={cls.title} loading="lazy" />
              <span className="duration-badge">{cls.duration}</span>
            </div>
            <div className="card-body">
              <h3>{cls.title}</h3>
              <p>{cls.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '2.75rem', width: '100%', textAlign: 'center' }}>
        <a href="#book" className="btn-primary btn-lg">
          {s.classesBook}
        </a>
      </div>
    </section>
  )
}

function ExperienceSection() {
  const { ref, inView } = useInView(0.1)
  const { s } = useI18n()
  /** Bump this when replacing step PNGs in /public under the same filename (forces browsers/CDNs to reload). */
  const stepLogoV = '2'
  const stepSrc = [`/step1Logo.png?v=${stepLogoV}`, `/step2Logo.png?v=${stepLogoV}`, `/step3Logo.png?v=${stepLogoV}`]

  return (
    <section className="experience-section" id="experience">
      <div className="section-header">
        {s.experienceBadge ? <span className="section-badge">{s.experienceBadge}</span> : null}
        <h2>
          {s.experienceHeadingPre}
          <em>{s.experienceHeadingEm}</em>
        </h2>
        <p>{s.experienceSub}</p>
      </div>
      <div className={`experience-grid${inView ? ' visible' : ''}`} ref={ref}>
        {s.experienceSteps.map((step, i) => (
          <div
            key={step.title}
            className="experience-card"
            style={{ transitionDelay: `${i * 0.15}s` }}
          >
            <div className={i === 0 ? 'exp-icon exp-icon--step1' : 'exp-icon'}>
              <img src={stepSrc[i]} alt={step.logoAlt} loading="lazy" />
            </div>
            <div className="exp-time">{step.time}</div>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '2.75rem', textAlign: 'center' }}>
        <a href="#book" className="btn-primary btn-lg">
          {s.experienceBook}
        </a>
      </div>
    </section>
  )
}

type YogaStyle = 'yin' | 'gentle'

function PricingStepBack({ onClick }: { onClick: () => void }) {
  const { s } = useI18n()
  return (
    <button type="button" className="pricing-step-back" onClick={onClick} aria-label={s.commonBackAria}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M15 6l-6 6 6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

function PricingSection() {
  const { lang, s } = useI18n()

  const bookingClassChoices = useMemo(
    () =>
      [
        { id: 'yin' as const, label: s.bookingChoiceYin },
        { id: 'gentle' as const, label: s.bookingChoiceGentle },
        { id: 'corporate' as const, label: s.bookingChoiceCorporate },
      ] as const,
    [s]
  )

  type Flow =
    | { kind: 'chooseClass' }
    | { kind: 'public'; step: 'mat' | 'people' | 'date' | 'contact' | 'payment'; yoga: YogaStyle }
    | { kind: 'publicSuccess'; source: 'regular' | 'private' }
    | { kind: 'corporate'; step: 'people' | 'date' | 'contact' | 'payment' }
    | { kind: 'corporateSuccess' }

  const [flow, setFlow] = useState<Flow>({ kind: 'chooseClass' })
  const [selectedSessionIso, setSelectedSessionIso] = useState<string | null>(null)
  const [pendingSessionIso, setPendingSessionIso] = useState<string | null>(null)
  // Stores the full Square startAt ISO string (e.g. "2025-03-01T14:30:00Z") for the selected time slot
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [corpName, setCorpName] = useState('')
  const [corpEmail, setCorpEmail] = useState('')
  const [corpPhone, setCorpPhone] = useState('')
  const [privateGroupCount, setPrivateGroupCount] = useState('')
  const [needsMatRental, setNeedsMatRental] = useState(false)
  const [waiverAccepted, setWaiverAccepted] = useState(false)
  const [waiverModalOpen, setWaiverModalOpen] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)

  // Square availability
  const startDate = useMemo(todayIso, [])
  const endDate = useMemo(() => plusDaysIso(50), [])

  const currentServiceVariationId = useMemo(() => {
    if (flow.kind === 'public') return SQUARE_SERVICE_VARIATIONS[flow.yoga]?.serviceVariationId ?? ''
    if (flow.kind === 'corporate') return SQUARE_SERVICE_VARIATIONS.corporate?.serviceVariationId ?? ''
    return ''
  }, [flow])

  const currentTeamMemberId = useMemo(() => {
    if (flow.kind === 'public') return SQUARE_SERVICE_VARIATIONS[flow.yoga]?.teamMemberId ?? ''
    if (flow.kind === 'corporate') return SQUARE_SERVICE_VARIATIONS.corporate?.teamMemberId ?? ''
    return ''
  }, [flow])

  const { slots: squareSlots, loading: availabilityLoading } = useSquareAvailability(
    currentServiceVariationId,
    startDate,
    endDate,
    currentTeamMemberId || undefined,
  )

  const slotsByDate = useMemo(() => {
    const map: Record<string, SquareSlot[]> = {}
    for (const slot of squareSlots) {
      const date = slot.startAt.split('T')[0]
      if (!map[date]) map[date] = []
      map[date].push(slot)
    }
    return map
  }, [squareSlots])

  const effectiveSlotsByDate = slotsByDate
  const effectiveDates = useMemo(() => Object.keys(effectiveSlotsByDate).sort(), [effectiveSlotsByDate])

  const pricingCardRef = useRef<HTMLDivElement>(null)
  const hasInteractedWithBookingFormRef = useRef(false)
  const pendingPricingStepScrollRef = useRef(false)
  const flowTransitionKey =
    flow.kind === 'chooseClass'
      ? 'choose'
      : flow.kind === 'publicSuccess'
        ? `pub-success-${flow.source}`
        : flow.kind === 'corporateSuccess'
          ? 'corp-success'
          : flow.kind === 'corporate'
            ? `corp-${flow.step}`
            : `pub-${flow.step}-${flow.yoga}`

  const requestScrollPricingCardAfterAdvance = () => {
    hasInteractedWithBookingFormRef.current = true
    pendingPricingStepScrollRef.current = true
  }

  /** Mat + session-date steps: align card top with viewport (readable under navbar via scroll-margin). Other steps keep centered. */
  const pricingCardScrollBlock = (): ScrollLogicalPosition => {
    if (
      (flow.kind === 'public' && (flow.step === 'mat' || flow.step === 'people' || flow.step === 'date')) ||
      (flow.kind === 'corporate' && (flow.step === 'people' || flow.step === 'date'))
    )
      return 'start'
    return 'center'
  }

  useEffect(() => {
    if (!hasInteractedWithBookingFormRef.current || !pendingPricingStepScrollRef.current) return
    const card = pricingCardRef.current
    if (!card || !hasInteractedWithBookingFormRef.current) return
    pendingPricingStepScrollRef.current = false
    const block = pricingCardScrollBlock()
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!hasInteractedWithBookingFormRef.current) return
        card.scrollIntoView({ behavior: 'smooth', block, inline: 'nearest' })
      })
    })
  }, [flowTransitionKey, flow])

  useEffect(() => {
    if (pendingSessionIso === null) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPendingSessionIso(null)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [pendingSessionIso])

  const progressPercent = (): number => {
    if (flow.kind === 'chooseClass') return 25
    if (flow.kind === 'publicSuccess') return 100
    if (flow.kind === 'public') {
      if (flow.step === 'mat') return 45
      if (flow.step === 'people') return 45
      if (flow.step === 'date') return 62
      if (flow.step === 'contact') return 80
      if (flow.step === 'payment') return 95
    }
    if (flow.kind === 'corporate') {
      if (flow.step === 'people') return 45
      if (flow.step === 'date') return 62
      if (flow.step === 'contact') return 80
      if (flow.step === 'payment') return 95
    }
    if (flow.kind === 'corporateSuccess') return 100
    return 0
  }

  const showProgress =
    flow.kind !== 'publicSuccess' && flow.kind !== 'corporateSuccess'

  const goBack = () => {
    if (pendingSessionIso !== null) {
      setPendingSessionIso(null)
      return
    }
    if (flow.kind === 'public') {
      if (flow.step === 'mat') {
        setFlow({ kind: 'chooseClass' })
        return
      }
      if (flow.step === 'people') {
        setPrivateGroupCount('')
        setFlow({ kind: 'chooseClass' })
        return
      }
      if (flow.step === 'date') {
        setPendingSessionIso(null)
        const backStep: 'mat' | 'people' = flow.yoga === 'gentle' ? 'people' : 'mat'
        setFlow({ kind: 'public', step: backStep, yoga: flow.yoga })
        setSelectedSessionIso(null)
        setSelectedTimeSlotId(null)
        return
      }
      if (flow.step === 'contact') {
        setWaiverAccepted(false)
        setWaiverModalOpen(false)
        setFlow({ kind: 'public', step: 'date', yoga: flow.yoga })
        setSelectedSessionIso(null)
        setSelectedTimeSlotId(null)
        return
      }
      if (flow.step === 'payment') {
        setBookingError(null)
        setFlow({ kind: 'public', step: 'contact', yoga: flow.yoga })
        return
      }
    }
    if (flow.kind === 'corporate') {
      if (flow.step === 'people') {
        setPrivateGroupCount('')
        setCorpName('')
        setCorpEmail('')
        setCorpPhone('')
        setFlow({ kind: 'chooseClass' })
        return
      }
      if (flow.step === 'date') {
        setPendingSessionIso(null)
        setFlow({ kind: 'corporate', step: 'people' })
        setSelectedSessionIso(null)
        setSelectedTimeSlotId(null)
        return
      }
      if (flow.step === 'contact') {
        setFlow({ kind: 'corporate', step: 'date' })
        setSelectedSessionIso(null)
        setSelectedTimeSlotId(null)
        return
      }
      if (flow.step === 'payment') {
        setBookingError(null)
        setFlow({ kind: 'corporate', step: 'contact' })
        return
      }
    }
  }

  const chooseClass = (id: (typeof bookingClassChoices)[number]['id']) => {
    requestScrollPricingCardAfterAdvance()
    if (id === 'corporate') {
      setPendingSessionIso(null)
      setSelectedSessionIso(null)
      setSelectedTimeSlotId(null)
      setCorpName('')
      setCorpEmail('')
      setCorpPhone('')
      setPrivateGroupCount('2')
      setFlow({ kind: 'corporate', step: 'people' })
      return
    }
    const firstStep = id === 'gentle' ? 'people' : 'mat'
    setFlow({ kind: 'public', step: firstStep, yoga: id })
    if (id === 'gentle') setPrivateGroupCount('2')
    else setPrivateGroupCount('')
    setSelectedSessionIso(null)
    setPendingSessionIso(null)
    setSelectedTimeSlotId(null)
  }

  const bumpPrivatePeopleCount = (delta: number) => {
    const n = parseInt(privateGroupCount, 10)
    const base = Number.isNaN(n) ? 2 : n
    setPrivateGroupCount(String(Math.min(20, Math.max(2, base + delta))))
  }

  const advanceInquiryPeopleStep = () => {
    const parsed = parseInt(privateGroupCount, 10)
    const n = Number.isNaN(parsed) ? 2 : Math.min(20, Math.max(2, parsed))
    setPrivateGroupCount(String(n))
    requestScrollPricingCardAfterAdvance()
    setFlow(prev => {
      if (prev.kind === 'public' && prev.step === 'people') return { ...prev, step: 'date' }
      if (prev.kind === 'corporate' && prev.step === 'people') return { ...prev, step: 'date' }
      return prev
    })
    setSelectedSessionIso(null)
    setPendingSessionIso(null)
    setSelectedTimeSlotId(null)
  }

  const pickMat = (renting: boolean) => {
    setNeedsMatRental(renting)
    requestScrollPricingCardAfterAdvance()
    setFlow(prev =>
      prev.kind === 'public' && prev.step === 'mat'
        ? { ...prev, step: 'date' }
        : prev
    )
    setSelectedSessionIso(null)
    setPendingSessionIso(null)
    setSelectedTimeSlotId(null)
  }

  const submitPublic = async (e: FormEvent) => {
    e.preventDefault()
    if (flow.kind !== 'public') return

    const needsWaiver = flow.yoga !== 'gentle'
    if (needsWaiver && !waiverAccepted) return

    // Both yin and gentle advance to Square payment step
    requestScrollPricingCardAfterAdvance()
    setFlow({ kind: 'public', step: 'payment', yoga: flow.yoga })
  }

  const submitCorporate = (e: FormEvent) => {
    e.preventDefault()
    requestScrollPricingCardAfterAdvance()
    setFlow({ kind: 'corporate', step: 'payment' })
  }

  const submitBookingWithPayment = async (nonce: string) => {
    if (flow.kind !== 'public' && flow.kind !== 'corporate') return
    setBookingLoading(true)
    setBookingError(null)

    let serviceInfo: typeof SQUARE_SERVICE_VARIATIONS[keyof typeof SQUARE_SERVICE_VARIATIONS]
    let givenName: string, familyName: string, bookingEmail: string, bookingPhone: string
    let amountCents: number

    if (flow.kind === 'corporate') {
      serviceInfo = SQUARE_SERVICE_VARIATIONS.corporate
      const parts = corpName.trim().split(' ')
      givenName = parts[0] ?? corpName
      familyName = parts.slice(1).join(' ') || givenName
      bookingEmail = corpEmail
      bookingPhone = corpPhone
      const groupSize = Math.max(2, parseInt(privateGroupCount, 10) || 2)
      amountCents = serviceInfo.amountCents * groupSize
    } else {
      serviceInfo = SQUARE_SERVICE_VARIATIONS[flow.yoga]
      const parts = fullName.trim().split(' ')
      givenName = parts[0] ?? fullName
      familyName = parts.slice(1).join(' ') || givenName
      bookingEmail = email
      bookingPhone = phone
      if (flow.yoga === 'gentle') {
        const groupSize = Math.max(2, parseInt(privateGroupCount, 10) || 2)
        amountCents = serviceInfo.amountCents * groupSize
      } else {
        amountCents = serviceInfo.amountCents + (needsMatRental ? 500 : 0)
      }
    }

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          givenName,
          familyName,
          email: bookingEmail,
          phone: bookingPhone,
          serviceVariationId: serviceInfo.serviceVariationId,
          serviceVariationVersion: serviceInfo.serviceVariationVersion,
          teamMemberId: serviceInfo.teamMemberId,
          startAt: selectedTimeSlotId,
          cardNonce: nonce,
          amountCents,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setBookingError((data as { error?: string }).error ?? 'Booking failed. Please try again.')
        return
      }

      requestScrollPricingCardAfterAdvance()
      if (flow.kind === 'corporate') {
        setFlow({ kind: 'corporateSuccess' })
      } else {
        setFlow({ kind: 'publicSuccess', source: flow.yoga === 'gentle' ? 'private' : 'regular' })
      }
    } catch {
      setBookingError('Network error. Please try again.')
    } finally {
      setBookingLoading(false)
    }
  }

  const restartPublicBooking = () => {
    setFlow({ kind: 'chooseClass' })
    setSelectedSessionIso(null)
    setPendingSessionIso(null)
    setSelectedTimeSlotId(null)
    setFullName('')
    setEmail('')
    setPhone('')
    setPrivateGroupCount('')
    setNeedsMatRental(false)
    setWaiverAccepted(false)
    setWaiverModalOpen(false)
    setBookingError(null)
  }

  const renderRegularClassPublicSuccess = () => (
    <div className="pricing-success">
      <div className="pricing-success-icon" aria-hidden>
        <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" stroke="var(--sage)" strokeWidth="2" opacity="0.35" />
          <path d="M14 24l8 8 13-17" stroke="var(--sage-dark)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="pricing-step-title">{s.pricingSuccessPublicTitle}</h3>
      <p className="pricing-success-body">
        {interpolate(s.pricingSuccessPublicBody, {
          email,
          date: selectedSessionIso
            ? formatLongSessionDate(selectedSessionIso, lang)
            : s.pricingSuccessChosenDayFallback,
          time: formatSquareSlotTime(selectedTimeSlotId, lang),
        })}
      </p>
      <p className="pricing-success-foot">{s.pricingSuccessPublicFoot}</p>
      <button type="button" className="pricing-success-restart" onClick={restartPublicBooking}>
        {s.pricingSuccessRestart}
      </button>
    </div>
  )

  const renderPrivateOrCorporateRequestSuccess = (clientPhone: string) => (
    <div className="pricing-success">
      <div className="pricing-success-icon" aria-hidden>
        <PricingSuccessPendingClockIcon />
      </div>
      <h3 className="pricing-step-title">{s.pricingSuccessRequestReceivedTitle}</h3>
      <p className="pricing-success-body">{s.pricingSuccessRequestReceivedBody}</p>
      {clientPhone.trim() !== '' && (
        <p className="pricing-success-body">
          {interpolate(s.pricingSuccessRequestReachOutPhone, { phone: clientPhone.trim() })}
        </p>
      )}
      <p className="pricing-success-foot">{s.pricingSuccessPublicFoot}</p>
      <a href="/" className="pricing-success-restart">
        {s.pricingSuccessBackHome}
      </a>
    </div>
  )

  let showBack = false
  if (flow.kind === 'public' && flow.step === 'mat') showBack = true
  else if (flow.kind === 'public' && flow.step === 'people') showBack = true
  else if (flow.kind === 'public' && flow.step === 'date') showBack = true
  else if (flow.kind === 'public' && flow.step === 'contact') showBack = true
  else if (flow.kind === 'public' && flow.step === 'payment') showBack = true
  else if (flow.kind === 'corporate' && flow.step === 'people') showBack = true
  else if (flow.kind === 'corporate' && flow.step === 'date') showBack = true
  else if (flow.kind === 'corporate' && flow.step === 'contact') showBack = true

  const isBookingSuccessScreen = flow.kind === 'publicSuccess' || flow.kind === 'corporateSuccess'
  const showFullPricingCardHeader = flow.kind === 'chooseClass'

  const inquiryPeopleStep =
    (flow.kind === 'public' && flow.step === 'people') || (flow.kind === 'corporate' && flow.step === 'people')
  let privatePeopleQtyDisplay = 2
  if (inquiryPeopleStep) {
    const q = parseInt(privateGroupCount, 10)
    privatePeopleQtyDisplay = Number.isNaN(q) ? 2 : Math.min(20, Math.max(2, q))
  }
  const privatePeopleQtyAtMin = inquiryPeopleStep && privatePeopleQtyDisplay <= 2
  const privatePeopleQtyAtMax = inquiryPeopleStep && privatePeopleQtyDisplay >= 20

  const isDateStep =
    (flow.kind === 'public' && flow.step === 'date') ||
    (flow.kind === 'corporate' && flow.step === 'date')

  return (
    <>
    <section className="pricing-section" id="pricing">
      <div className="pricing-inner">
        <div className="section-header">
          <span className="section-badge badge-light">{s.pricingSectionBadge}</span>
          <h2 style={{ color: '#fff' }}>
            {lang === 'fr' ? (
              <>
                {s.pricingHeadingPre}
                <br />
                {s.pricingHeadingMidLead}
                <em style={{ color: '#F9A8D4', fontStyle: 'italic' }}>{s.pricingHeadingEm}</em>
                {s.pricingHeadingMidTrail}
              </>
            ) : (
              <>
                {s.pricingHeadingPre}
                <em style={{ color: '#F9A8D4', fontStyle: 'italic' }}>{s.pricingHeadingEm}</em>
                {s.pricingHeadingMidTrail}
              </>
            )}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)' }}>{s.pricingSub}</p>
        </div>
        <div ref={pricingCardRef} id="book" className="pricing-card">
          {showFullPricingCardHeader ? (
            <>
              <div className="pricing-amount">
                <span className="price-value">{s.pricingAmount}</span>
                <span className="price-suffix">{s.pricingPlusTaxes}</span>
              </div>
              <div className="price-type">{s.pricingDropInRow}</div>
              <ul className="price-features">
                {[s.pricingFeat1, s.pricingFeat2, s.pricingFeat3, s.pricingFeat4, s.pricingFeat5]
                  .filter((line) => line.trim().length > 0)
                  .map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
              </ul>

              <hr className="pricing-card-divider" />
            </>
          ) : (
            !isBookingSuccessScreen && <p className="pricing-header-summary">{s.pricingHeaderSummary}</p>
          )}

          <div className="pricing-multi-flow">
            {showProgress && (
              <div className="pricing-progress-wrap" aria-hidden>
                <div className="pricing-progress-track">
                  <div className="pricing-progress-fill" style={{ width: `${progressPercent()}%` }} />
                </div>
              </div>
            )}

            {showBack && (
              <div className="pricing-step-toolbar">
                <PricingStepBack onClick={goBack} />
              </div>
            )}

            {flow.kind === 'chooseClass' && (
              <div className="pricing-step-block">
                <h3 className="pricing-step-title">{s.pricingAskClassType}</h3>
                <div className="pricing-choice-stack">
                  {bookingClassChoices.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      className="pricing-choice-card"
                      onClick={() => chooseClass(opt.id)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {flow.kind === 'public' && flow.step === 'mat' && (
              <div className="pricing-step-block">
                <h3 className="pricing-step-title">{s.pricingAskMat}</h3>
                <div className="pricing-choice-stack pricing-choice-stack--pair">
                    <button type="button" className="pricing-choice-card" onClick={() => pickMat(true)}>
                    {s.pricingMatYes}
                  </button>
                  <button type="button" className="pricing-choice-card" onClick={() => pickMat(false)}>
                    {s.pricingMatNo}
                  </button>
                </div>
                <p className="pricing-helper-text">{s.pricingMatHelper}</p>
              </div>
            )}

            {inquiryPeopleStep && (
              <div className="pricing-step-block">
                <h3 className="pricing-step-title" id="pricing-private-group-heading">
                  {s.pricingAskPrivateGroupSize}
                </h3>
                <div
                  className="pricing-private-qty-selector"
                  role="group"
                  aria-labelledby="pricing-private-group-heading"
                  aria-describedby="pricing-private-group-max-hint"
                >
                  <button
                    type="button"
                    className="pricing-private-qty-btn"
                    onClick={() => bumpPrivatePeopleCount(-1)}
                    disabled={privatePeopleQtyAtMin}
                    aria-label={s.pricingPrivateQtyDecAria}
                  >
                    <span aria-hidden>−</span>
                  </button>
                  <div className="pricing-private-qty-value" aria-live="polite">
                    {privatePeopleQtyDisplay}
                  </div>
                  <button
                    type="button"
                    className="pricing-private-qty-btn"
                    onClick={() => bumpPrivatePeopleCount(1)}
                    disabled={privatePeopleQtyAtMax}
                    aria-label={s.pricingPrivateQtyIncAria}
                  >
                    <span aria-hidden>+</span>
                  </button>
                </div>
                <p className="pricing-private-qty-max-hint" id="pricing-private-group-max-hint">
                  {s.pricingPrivateGroupMaxHint}
                </p>
                <button type="button" className="btn-primary btn-lg pricing-submit" onClick={advanceInquiryPeopleStep}>
                  {s.pricingPrivateGroupContinue}
                </button>
              </div>
            )}

            {isDateStep && (
              <div className="pricing-step-block">
                <h3 className="pricing-step-title">{s.pricingChooseSession}</h3>
                {availabilityLoading && (
                  <p className="pricing-helper-text">Loading available sessions…</p>
                )}
                {!availabilityLoading && effectiveDates.length === 0 && (
                  <p className="pricing-helper-text">No sessions available right now. Please check back soon.</p>
                )}
                <div className="pricing-session-list">
                  {effectiveDates.map(dateIso => {
                    const sel =
                      pendingSessionIso === dateIso ||
                      (selectedSessionIso === dateIso &&
                        ((flow.kind === 'public' && flow.step === 'contact') ||
                          (flow.kind === 'corporate' && flow.step === 'contact')))
                    const breed = SESSION_BREEDS[dateIso]
                    return (
                      <button
                        key={dateIso}
                        type="button"
                        className={`pricing-session-row${sel ? ' is-selected' : ''}`}
                        onClick={() => setPendingSessionIso(dateIso)}
                      >
                        <span className="pricing-session-date">
                          {formatShortSessionDate(dateIso, lang)}
                          {breed && (
                            <span className="pricing-session-breed">
                              {lang === 'fr' ? breed.fr : breed.en}
                            </span>
                          )}
                        </span>
                        <span className="pricing-session-spots">{s.pricingSessionPickTime}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {flow.kind === 'public' && flow.step === 'contact' && (
              <>
              <form className="pricing-booking-form" onSubmit={submitPublic}>
                <h3 className="pricing-step-title">{s.pricingContactHeading}</h3>
                <div className="pricing-form-field">
                  <label className="pricing-form-label" htmlFor="pub-fullname">
                    {s.pricingLblFullName}{' '}
                    <abbr className="pricing-req-mark" title={s.abbrevRequiredTitle}>*</abbr>
                  </label>
                  <input
                    id="pub-fullname"
                    type="text"
                    name="fullName"
                    className="pricing-input"
                    autoComplete="name"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="pricing-form-field">
                  <label className="pricing-form-label" htmlFor="pub-email">
                    {s.pricingLblEmail}{' '}
                    <abbr className="pricing-req-mark" title={s.abbrevRequiredTitle}>*</abbr>
                  </label>
                  <input
                    id="pub-email"
                    type="email"
                    name="email"
                    className="pricing-input"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="pricing-form-field">
                  <label className="pricing-form-label" htmlFor="pub-phone">
                    {s.pricingLblPhone}{' '}
                    <abbr className="pricing-req-mark" title={s.abbrevRequiredTitle}>*</abbr>
                  </label>
                  <input
                    id="pub-phone"
                    type="tel"
                    name="phone"
                    className="pricing-input"
                    autoComplete="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                  />
                </div>
                {flow.yoga === 'gentle' ? (
                  <>
                    <p className="pricing-helper-text">
                      {lang === 'fr'
                        ? `Total : ${parseInt(privateGroupCount || '2', 10)} × 46 $ = ${parseInt(privateGroupCount || '2', 10) * 46} $ + taxes`
                        : `Total: ${parseInt(privateGroupCount || '2', 10)} × $46 = $${parseInt(privateGroupCount || '2', 10) * 46} + taxes`}
                    </p>
                    <button type="submit" className="btn-primary btn-lg pricing-submit">
                      {lang === 'fr' ? 'Passer au paiement' : 'Proceed to payment'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="pricing-form-field pricing-form-field--checkbox">
                      <label htmlFor="pub-waiver" className="pricing-checkbox-row">
                        <input
                          id="pub-waiver"
                          name="waiverAccepted"
                          type="checkbox"
                          className="pricing-checkbox"
                          checked={waiverAccepted}
                          onChange={e => setWaiverAccepted(e.target.checked)}
                        />
                        <span className="pricing-checkbox-text">
                          {s.pricingWaiverConsentPrefix}
                          <button
                            type="button"
                            className="pricing-waiver-inline-link"
                            onClick={e => {
                              e.preventDefault()
                              e.stopPropagation()
                              setWaiverModalOpen(true)
                            }}
                          >
                            {s.pricingWaiverConsentLinkText}
                          </button>
                          {s.pricingWaiverConsentSuffix}
                        </span>
                      </label>
                      {waiverAccepted && (
                        <div className="pricing-waiver-accepted-badge">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <circle cx="8" cy="8" r="8" fill="#16a34a" />
                            <path d="M4.5 8l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {lang === 'fr' ? 'Accepté' : 'Agreed'}
                        </div>
                      )}
                    </div>
                    <p className="pricing-waiver-age-note">{s.pricingWaiverAgeNote}</p>
                    <button
                      type="submit"
                      className="btn-primary btn-lg pricing-submit"
                      disabled={!waiverAccepted}
                    >
                      {s.pricingSubmitBookSpot}
                    </button>
                  </>
                )}
              </form>
              {flow.yoga !== 'gentle' && (
                <BookingWaiverModal
                  lang={lang}
                  open={waiverModalOpen}
                  onClose={() => setWaiverModalOpen(false)}
                  closeAriaLabel={s.waiverModalCloseAria}
                />
              )}
              </>
            )}

            {flow.kind === 'public' && flow.step === 'payment' && (
              <div className="pricing-step-block">
                <h3 className="pricing-step-title">
                  {lang === 'fr' ? 'Paiement sécurisé' : 'Secure Payment'}
                </h3>
                <div className="pricing-payment-summary">
                  <div className="pricing-payment-summary-row">
                    <span className="pricing-payment-summary-label">
                      {flow.yoga === 'gentle'
                        ? (lang === 'fr'
                            ? `${parseInt(privateGroupCount || '2', 10)} × Événement privé`
                            : `${parseInt(privateGroupCount || '2', 10)} × Private Event`)
                        : (lang === 'fr' ? '1 × Cours de yoga avec chiots' : '1 × Puppy Yoga Class')}
                    </span>
                    <span className="pricing-payment-summary-amount">
                      {flow.yoga === 'gentle'
                        ? (lang === 'fr'
                            ? `${parseInt(privateGroupCount || '2', 10) * 46} $`
                            : `$${parseInt(privateGroupCount || '2', 10) * 46}`)
                        : (lang === 'fr' ? '46 $' : '$46')}
                    </span>
                  </div>
                  {flow.yoga !== 'gentle' && needsMatRental && (
                    <div className="pricing-payment-summary-row">
                      <span className="pricing-payment-summary-label">
                        {lang === 'fr' ? '1 × Location de tapis' : '1 × Mat rental'}
                      </span>
                      <span className="pricing-payment-summary-amount">
                        {lang === 'fr' ? '5 $' : '$5'}
                      </span>
                    </div>
                  )}
                  <div className="pricing-payment-summary-row pricing-payment-summary-total">
                    <span className="pricing-payment-summary-label">
                      {lang === 'fr' ? 'Total (+ taxes applicables)' : 'Total (+ applicable taxes)'}
                    </span>
                    <span className="pricing-payment-summary-amount">
                      {flow.yoga === 'gentle'
                        ? (lang === 'fr'
                            ? `${parseInt(privateGroupCount || '2', 10) * 46} $ + taxes`
                            : `$${parseInt(privateGroupCount || '2', 10) * 46} + taxes`)
                        : (lang === 'fr'
                            ? `${46 + (needsMatRental ? 5 : 0)} $ + taxes`
                            : `$${46 + (needsMatRental ? 5 : 0)} + taxes`)}
                    </span>
                  </div>
                  {selectedSessionIso && (
                    <p className="pricing-payment-summary-meta">
                      {formatLongSessionDate(selectedSessionIso, lang)}
                      {selectedTimeSlotId && ` · ${formatSquareSlotTime(selectedTimeSlotId, lang)}`}
                    </p>
                  )}
                </div>
                <div className="pricing-payment-security">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6l-8-4z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {lang === 'fr'
                    ? 'Paiement sécurisé par Square. Nous ne conservons jamais vos informations de carte.'
                    : 'Payment secured by Square. We never store your card information.'}
                </div>
                {bookingError && (
                  <p style={{ color: 'var(--rose, #e11d48)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    {bookingError}
                  </p>
                )}
                {SQUARE_APP_ID ? (
                  <PaymentForm
                    applicationId={SQUARE_APP_ID}
                    locationId={SQUARE_LOCATION_ID}
                    cardTokenizeResponseReceived={(token) => {
                      if (token.status === 'OK' && token.token) {
                        void submitBookingWithPayment(token.token)
                      }
                    }}
                  >
                    <CreditCard>
                      {bookingLoading
                        ? (lang === 'fr' ? 'Traitement…' : 'Processing…')
                        : s.pricingSubmitBookSpot}
                    </CreditCard>
                  </PaymentForm>
                ) : (
                  <p className="pricing-helper-text">
                    Square credentials not configured. Add <code>VITE_SQUARE_APP_ID</code> to your environment.
                  </p>
                )}
              </div>
            )}

            {flow.kind === 'publicSuccess' &&
              flow.source === 'regular' &&
              renderRegularClassPublicSuccess()}
            {flow.kind === 'publicSuccess' &&
              flow.source === 'private' &&
              renderPrivateOrCorporateRequestSuccess(phone)}

            {flow.kind === 'corporate' && flow.step === 'contact' && (
              <form className="pricing-booking-form" onSubmit={submitCorporate}>
                <h3 className="pricing-step-title">{s.pricingContactHeading}</h3>
                <div className="pricing-form-field">
                  <label className="pricing-form-label" htmlFor="corp-fullname">
                    {s.pricingLblFullName}{' '}
                    <abbr className="pricing-req-mark" title={s.abbrevRequiredTitle}>*</abbr>
                  </label>
                  <input
                    id="corp-fullname"
                    type="text"
                    name="corpFullName"
                    className="pricing-input"
                    autoComplete="name"
                    value={corpName}
                    onChange={e => setCorpName(e.target.value)}
                    required
                  />
                </div>
                <div className="pricing-form-field">
                  <label className="pricing-form-label" htmlFor="corp-email">
                    {s.pricingLblEmail}{' '}
                    <abbr className="pricing-req-mark" title={s.abbrevRequiredTitle}>*</abbr>
                  </label>
                  <input
                    id="corp-email"
                    type="email"
                    name="corpEmail"
                    className="pricing-input"
                    autoComplete="email"
                    value={corpEmail}
                    onChange={e => setCorpEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="pricing-form-field">
                  <label className="pricing-form-label" htmlFor="corp-phone">
                    {s.pricingLblPhone}{' '}
                    <abbr className="pricing-req-mark" title={s.abbrevRequiredTitle}>*</abbr>
                  </label>
                  <input
                    id="corp-phone"
                    type="tel"
                    name="corpPhone"
                    className="pricing-input"
                    autoComplete="tel"
                    value={corpPhone}
                    onChange={e => setCorpPhone(e.target.value)}
                    required
                  />
                </div>
                <p className="pricing-helper-text">
                  {lang === 'fr'
                    ? `Total : ${parseInt(privateGroupCount || '2', 10)} × 46 $ = ${parseInt(privateGroupCount || '2', 10) * 46} $ + taxes`
                    : `Total: ${parseInt(privateGroupCount || '2', 10)} × $46 = $${parseInt(privateGroupCount || '2', 10) * 46} + taxes`}
                </p>
                <button type="submit" className="btn-primary btn-lg pricing-submit">
                  {lang === 'fr' ? 'Passer au paiement' : 'Proceed to payment'}
                </button>
              </form>
            )}

            {flow.kind === 'corporate' && flow.step === 'payment' && (
              <div className="pricing-step-block">
                <h3 className="pricing-step-title">
                  {lang === 'fr' ? 'Paiement sécurisé' : 'Secure Payment'}
                </h3>
                <div className="pricing-payment-summary">
                  <div className="pricing-payment-summary-row">
                    <span className="pricing-payment-summary-label">
                      {lang === 'fr'
                        ? `${parseInt(privateGroupCount || '2', 10)} × Expérience corporative`
                        : `${parseInt(privateGroupCount || '2', 10)} × Corporate Experience`}
                    </span>
                    <span className="pricing-payment-summary-amount">
                      {lang === 'fr'
                        ? `${parseInt(privateGroupCount || '2', 10) * 46} $`
                        : `$${parseInt(privateGroupCount || '2', 10) * 46}`}
                    </span>
                  </div>
                  <div className="pricing-payment-summary-row pricing-payment-summary-total">
                    <span className="pricing-payment-summary-label">
                      {lang === 'fr' ? 'Total (+ taxes applicables)' : 'Total (+ applicable taxes)'}
                    </span>
                    <span className="pricing-payment-summary-amount">
                      {lang === 'fr'
                        ? `${parseInt(privateGroupCount || '2', 10) * 46} $ + taxes`
                        : `$${parseInt(privateGroupCount || '2', 10) * 46} + taxes`}
                    </span>
                  </div>
                  {selectedSessionIso && (
                    <p className="pricing-payment-summary-meta">
                      {formatLongSessionDate(selectedSessionIso, lang)}
                      {selectedTimeSlotId && ` · ${formatSquareSlotTime(selectedTimeSlotId, lang)}`}
                    </p>
                  )}
                </div>
                <div className="pricing-payment-security">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6l-8-4z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {lang === 'fr'
                    ? 'Paiement sécurisé par Square. Nous ne conservons jamais vos informations de carte.'
                    : 'Payment secured by Square. We never store your card information.'}
                </div>
                {bookingError && (
                  <p style={{ color: 'var(--rose, #e11d48)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    {bookingError}
                  </p>
                )}
                {SQUARE_APP_ID ? (
                  <PaymentForm
                    applicationId={SQUARE_APP_ID}
                    locationId={SQUARE_LOCATION_ID}
                    cardTokenizeResponseReceived={(token) => {
                      if (token.status === 'OK' && token.token) {
                        void submitBookingWithPayment(token.token)
                      }
                    }}
                  >
                    <CreditCard>
                      {bookingLoading
                        ? (lang === 'fr' ? 'Traitement…' : 'Processing…')
                        : s.pricingSubmitBookSpot}
                    </CreditCard>
                  </PaymentForm>
                ) : (
                  <p className="pricing-helper-text">Square credentials not configured.</p>
                )}
              </div>
            )}

            {flow.kind === 'corporateSuccess' && (
              <div className="pricing-success">
                <div className="pricing-success-icon" aria-hidden>
                  <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="22" stroke="var(--sage)" strokeWidth="2" opacity="0.35" />
                    <path d="M14 24l8 8 13-17" stroke="var(--sage-dark)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="pricing-step-title">{s.pricingSuccessPublicTitle}</h3>
                <p className="pricing-success-body">
                  {interpolate(s.pricingSuccessPublicBody, {
                    email: corpEmail,
                    date: selectedSessionIso ? formatLongSessionDate(selectedSessionIso, lang) : s.pricingSuccessChosenDayFallback,
                    time: formatSquareSlotTime(selectedTimeSlotId, lang),
                  })}
                </p>
                <p className="pricing-success-foot">{s.pricingSuccessPublicFoot}</p>
                <button type="button" className="pricing-success-restart" onClick={restartPublicBooking}>
                  {s.pricingSuccessRestart}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>

    {pendingSessionIso !== null && (
      <div
        className="pricing-time-overlay"
        role="presentation"
        onClick={() => setPendingSessionIso(null)}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pricing-time-modal-title"
          className="pricing-time-modal"
          onClick={e => e.stopPropagation()}
        >
          <h3 id="pricing-time-modal-title" className="pricing-time-modal-title">
            {s.pricingChooseTimeTitle}
          </h3>
          <p className="pricing-time-modal-date">{formatLongSessionDate(pendingSessionIso, lang)}</p>
          <div className="pricing-time-slot-list">
            {(effectiveSlotsByDate[pendingSessionIso] ?? []).map(slot => (
              <button
                key={slot.startAt}
                type="button"
                className="pricing-time-slot-row"
                onClick={() => {
                  const iso = pendingSessionIso
                  setSelectedSessionIso(iso)
                  setSelectedTimeSlotId(slot.startAt)
                  setPendingSessionIso(null)
                  requestScrollPricingCardAfterAdvance()
                  setFlow(prev => {
                    if (prev.kind === 'public' && prev.step === 'date')
                      return { kind: 'public', step: 'contact', yoga: prev.yoga }
                    if (prev.kind === 'corporate' && prev.step === 'date')
                      return { kind: 'corporate', step: 'contact' }
                    return prev
                  })
                }}
              >
                <span className="pricing-time-slot-label">{formatSquareSlotTime(slot.startAt, lang)}</span>
                <span className="pricing-session-spots">{interpolate(s.pricingSpotsRemain, { count: String(slot.seatsRemaining) })}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn-ghost pricing-time-modal-cancel"
            onClick={() => setPendingSessionIso(null)}
          >
            {s.pricingTimeModalCancel}
          </button>
        </div>
      </div>
    )}
    </>
  )
}

function GallerySection() {
  const { ref, inView } = useInView(0.08)
  const { s } = useI18n()
  const galleryAlts = [
    s.galleryAlts.session,
    s.galleryAlts.classSession,
    s.galleryAlts.happyMoment,
    s.galleryAlts.yogaFlow,
    s.galleryAlts.highlight,
  ]
  return (
    <section className="gallery-section" id="gallery">
      <div className="section-header">
        <span className="section-badge">{s.galleryBadge}</span>
        <h2>{s.galleryHeading}<em>{s.galleryHeadingEm}</em></h2>
        <p>{s.gallerySub}</p>
      </div>
      <div className={`gallery-grid${inView ? ' visible' : ''}`} ref={ref}>
        {GALLERY_IMAGES.map((img, i) => (
          <div
            key={img.src}
            className={`gallery-item${img.tall ? ' tall' : ''}`}
            style={{ transitionDelay: `${i * 0.1}s` }}
          >
            <img src={img.src} alt={galleryAlts[i] ?? s.galleryAlts.highlight} loading="lazy" />
            <div className="gallery-overlay">
              <PawIcon size={42} className="overlay-paw" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function TestimonialCarouselArrow({
  dir,
}: {
  dir: 'prev' | 'next'
}) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={dir === 'prev' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TestimonialsSection() {
  const { s } = useI18n()
  const [active, setActive] = useState(0)
  const cards = s.testimonialCards
  const len = cards.length

  useEffect(() => {
    const id = setInterval(() => setActive(a => (a + 1) % len), 4500)
    return () => clearInterval(id)
  }, [len])

  const goPrev = () => setActive(a => (a - 1 + len) % len)
  const goNext = () => setActive(a => (a + 1) % len)

  return (
    <section className="testimonials-section" id="testimonials">
      <div
        className="testimonials-bg"
        style={{ backgroundImage: "url('/magnific_change-the-dog-to-a-poodl_2935981941.png')" }}
        aria-hidden
      />
      <div className="testimonials-overlay" aria-hidden />
      <div className="testimonials-inner">
        <div className="section-header">
          <span className="section-badge">{s.testimonialsBadge}</span>
          <h2 style={{ color: '#fff' }}>
            {s.testimonialsHeadingPre}
            <em style={{ color: '#F9A8D4', fontStyle: 'italic' }}>{s.testimonialsHeadingEm}</em>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)' }}>{s.testimonialsSub}</p>
        </div>

        <div className="testimonial-carousel">
          <button
            type="button"
            className="testimonial-arrow testimonial-arrow--prev"
            onClick={goPrev}
            aria-label={s.testimonialsPrevAria}
          >
            <TestimonialCarouselArrow dir="prev" />
          </button>

          <div className="testimonial-track-shell">
            <div className="testimonial-track">
              {cards.map((t, i) => (
                <div key={t.name} className={`testimonial-card${i === active ? ' active' : ''}`}>
                  <div className="stars">
                    {Array.from({ length: 5 }).map((_, j) => <StarIcon key={j} />)}
                  </div>
                  <blockquote>&ldquo;{t.quote}&rdquo;</blockquote>
                  <div className="testimonial-author">
                    <strong>{t.name}</strong>
                    <span>{t.since}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="testimonial-arrow testimonial-arrow--next"
            onClick={goNext}
            aria-label={s.testimonialsNextAria}
          >
            <TestimonialCarouselArrow dir="next" />
          </button>
        </div>

        <div className="testimonial-dots">
          {cards.map((_, i) => (
            <button
              key={i}
              className={`dot${i === active ? ' active' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`${s.testimonialsDotAria} ${i + 1}`}
            />
          ))}
        </div>

        <div className="testimonials-cta">
          <a href="#book" className="btn-primary btn-lg">
            {s.testimonialsCta}
          </a>
        </div>
      </div>
    </section>
  )
}

const FAQ_REFUND_POLICY_LINK_TOKEN = '<<REFUND_POLICY_LINK>>'

function FaqAnswerBody({ text }: { text: string }) {
  const { lang } = useI18n()
  if (text.includes(FAQ_REFUND_POLICY_LINK_TOKEN)) {
    const i = text.indexOf(FAQ_REFUND_POLICY_LINK_TOKEN)
    const before = text.slice(0, i)
    const after = text.slice(i + FAQ_REFUND_POLICY_LINK_TOKEN.length)
    const linkLabel = lang === 'fr' ? 'Politique de remboursement' : 'Refund policy'
    const refundHref = lang === 'fr' ? '/politique-remboursement' : '/refund-policy'
    return (
      <>
        {before}
        <a
          href={refundHref}
          className="faq-refund-policy-placeholder-link"
          onClick={(e) => e.stopPropagation()}
        >
          {linkLabel}
        </a>
        {after}
      </>
    )
  }
  return <>{text}</>
}

function FAQSection() {
  const { s } = useI18n()
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="faq-section" id="faq">
      <div className="section-header">
        <span className="section-badge">{s.faqBadge}</span>
        <h2>{s.faqHeading}<em>{s.faqHeadingEm}</em></h2>
        <p>{s.faqSub}</p>
      </div>
      <div className="faq-list">
        {s.faqItems.map((faq, i) => (
          <div
            key={i}
            className={`faq-item${open === i ? ' open' : ''}`}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <div className="faq-question">
              <span>{faq.q}</span>
              <span className="faq-chevron">{open === i ? '−' : '+'}</span>
            </div>
            {open === i && (
              <div className="faq-answer">
                <FaqAnswerBody text={faq.a} />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

// ── App ────────────────────────────────────────────────────

function normalizeSitePathname(): string {
  const raw = window.location.pathname.replace(/\/$/, '') || '/'
  return raw
}

export default function App() {
  const path = normalizeSitePathname()
  if (path === '/refund-policy' || path === '/politique-remboursement') return <RefundPolicyPage />
  if (path === '/waiver' || path === '/renonciation') return <WaiverPage />

  return <MarketingSite />
}

function MarketingSite() {
  const [scrolled, setScrolled] = useState(false)

  useLayoutEffect(() => {
    const hash = window.location.hash.slice(1).split('?')[0]
    if (BOOKING_FORM_SCROLL_HASHES.has(hash)) {
      queueMicrotask(() => scrollBookingFormIntoView('instant'))
      return
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return
      const el = e.target
      if (!(el instanceof Element)) return
      const a = el.closest('a[href^="#"]')
      if (!a || !(a instanceof HTMLAnchorElement)) return
      const href = a.getAttribute('href')
      if (!href || href === '#') return
      const hash = href.slice(1).split('?')[0]
      if (!BOOKING_FORM_SCROLL_HASHES.has(hash)) return
      if (!document.getElementById('book')) return
      e.preventDefault()
      scrollBookingFormIntoView('smooth')
      const next = `#${hash}`
      if (window.location.hash !== next) {
        window.history.replaceState(null, '', next)
      }
    }
    document.addEventListener('click', onDocClick, true)
    return () => document.removeEventListener('click', onDocClick, true)
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="site-wrapper">
      <Navbar scrolled={scrolled} />
      <HeroSection />
      <MarqueeTicker />
      <ExperienceSection />
      <ClassesSection />
      <PricingSection />
      <TestimonialsSection />
      <GallerySection />
      <AboutSection />
      <FAQSection />
      <Footer />
    </div>
  )
}
