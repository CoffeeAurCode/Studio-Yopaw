export type Lang = 'en' | 'fr'

export const LANG_STORAGE_KEY = 'studio-yopaw-lang'

export interface ExperienceStepStrings {
  logoAlt: string
  time: string
  title: string
  description: string
}

export interface ClassCardStrings {
  title: string
  duration: string
  description: string
}

export interface GalleryAltStrings {
  session: string
  classSession: string
  happyMoment: string
  yogaFlow: string
  highlight: string
}

export interface TestimonialStrings {
  name: string
  since: string
  quote: string
}

export interface FaqStrings {
  q: string
  a: string
}

export interface SiteStrings {
  metaTitle: string
  metaDescription: string
  navBrand: string
  navToggle: string
  navBook: string
  navLangShort: string
  navLangOtherHint: string
  navSwitchToEnAria: string
  navSwitchToFrAria: string
  navMobileBook: string
  navLinks: {
    howItWorks: string
    classes: string
    reviews: string
    pricing: string
    corporate: string
    faq: string
    /** About / values; shown in FR nav only (EN keeps Corporate in nav instead). */
    values: string
  }
  langPickerEnglish: string
  langPickerFrench: string
  heroTitleL1: string
  heroTitleL2Prefix: string
  heroTitleItalic: string
  heroSub: string
  heroBook: string
  heroClasses: string
  heroScroll: string
  marqueeItems: string[]
  aboutBadge: string
  aboutHeadingL1: string
  /** e.g. English "Pure " before the italic word; empty in French when the whole phrase is italicized */
  aboutHeadingEmPrefix: string
  aboutHeadingItalic: string
  aboutP1: string
  aboutP2: string
  aboutP3: string
  aboutLink: string
  aboutImgAlt: string
  classesBadge: string
  classesHeading: string
  classesHeadingEm: string
  classesSub: string
  classesBook: string
  classCards: ClassCardStrings[]
  experienceBadge: string
  experienceHeadingPre: string
  experienceHeadingEm: string
  experienceSub: string
  experienceBook: string
  experienceSteps: ExperienceStepStrings[]
  bookingChoiceYin: string
  bookingChoiceGentle: string
  bookingChoiceCorporate: string
  pricingSectionBadge: string
  pricingHeadingPre: string
  /** Plain text before the accented pricing word on the FR second line (“les ”). Empty in EN. */
  pricingHeadingMidLead: string
  pricingHeadingEm: string
  /** Plain text after the accented word on the FR second line (“?”). Empty in EN. */
  pricingHeadingMidTrail: string
  pricingSub: string
  /** Main price figure as shown in the hero card */
  pricingAmount: string
  pricingPlusTaxes: string
  pricingDropInRow: string
  pricingFeat1: string
  pricingFeat2: string
  pricingFeat3: string
  pricingFeat4: string
  pricingFeat5: string
  pricingHeaderSummary: string
  pricingAskClassType: string
  pricingAskMat: string
  pricingMatYes: string
  pricingMatNo: string
  pricingMatHelper: string
  pricingAskPrivateGroupSize: string
  pricingPrivateGroupMaxHint: string
  pricingPrivateQtyDecAria: string
  pricingPrivateQtyIncAria: string
  pricingPrivateGroupContinue: string
  pricingChooseSession: string
  pricingChooseTimeTitle: string
  pricingTimeModalCancel: string
  pricingSessionPickTime: string
  pricingSpotFull: string
  pricingSpotsRemain: string
  pricingContactHeading: string
  pricingLblFullName: string
  pricingLblEmail: string
  pricingLblPhone: string
  pricingTermsCheckboxLabel: string
  /** French public booking waiver label segments (empty for EN). */
  pricingWaiverConsentPrefix: string
  pricingWaiverConsentLinkText: string
  pricingWaiverConsentSuffix: string
  pricingWaiverAgeNote: string
  /** Shown instead of waiver checkbox on private-event contact step. */
  pricingPrivateEventSubmitNote: string
  waiverModalCloseAria: string
  pricingSubmitBookSpot: string
  pricingCorporateTitle: string
  pricingCorporateIntro: string
  pricingLblGroupSize: string
  pricingLblEventDetails: string
  pricingCorpPlaceholder: string
  pricingCorporateSubmit: string
  pricingSuccessPublicTitle: string
  pricingSuccessPublicBody: string
  pricingSuccessChosenDayFallback: string
  pricingSuccessPublicFoot: string
  pricingSuccessRestart: string
  pricingSuccessRequestReceivedTitle: string
  pricingSuccessRequestReceivedBody: string
  pricingSuccessRequestReachOutPhone: string
  pricingSuccessBackHome: string
  abbrevRequiredTitle: string
  galleryBadge: string
  galleryHeading: string
  galleryHeadingEm: string
  gallerySub: string
  galleryAlts: GalleryAltStrings
  testimonialsBadge: string
  testimonialsHeadingPre: string
  testimonialsHeadingEm: string
  testimonialsSub: string
  testimonialsPrevAria: string
  testimonialsNextAria: string
  testimonialsDotAria: string
  testimonialsCta: string
  testimonialCards: TestimonialStrings[]
  faqBadge: string
  faqHeading: string
  faqHeadingEm: string
  faqSub: string
  faqItems: FaqStrings[]
  footerTaglineL1: string
  footerTaglineL2: string
  footerIgAria: string
  footerFbAria: string
  footerNavigate: string
  footerFindUs: string
  footerAddressL1: string
  footerAddressL2: string
  footerSite: string
  footerWaiver: string
  footerRefundPolicy: string
  footerBottom: string
  commonBackAria: string
}

const MARQUEE_SEP = '·'

const enMarqueeBodies = [
  'No Dog Required',
  'Saint-Lazare, QC',
  '60-Minute Sessions',
  'All Levels Welcome',
  'Up To 20 Spots Available Per Session',
  'All the Photos You Want',
  'Gentle Flow — Open to Everyone',
  'Stress Relief Guaranteed',
  'Namaste & Play',
  'Book Online In Minutes',
  '72-Hour Cancellation Policy',
] as const

function buildMarquee(items: readonly string[]): string[] {
  const out: string[] = []
  for (const line of items) {
    out.push(line, MARQUEE_SEP)
  }
  return out
}

export const siteStrings: Record<Lang, SiteStrings> = {
  en: {
    metaTitle: 'Studio Yopaw · Puppy Yoga Studio',
    metaDescription:
      'Studio Yopaw, where puppies and people find their flow. Mindful movement, unconditional love.',
    navBrand: 'Studio Yopaw',
    navToggle: 'Toggle navigation',
    navBook: 'Book a Session',
    navLangOtherHint: 'Switch language',
    navSwitchToEnAria: 'Show site in English',
    navSwitchToFrAria: 'Afficher en français',
    navMobileBook: 'Book a Session',
    navLangShort: 'EN',
    langPickerEnglish: 'English',
    langPickerFrench: 'Français',
    heroTitleL1: 'Yoga. Puppies.',
    heroTitleL2Prefix: '',
    heroTitleItalic: 'Happiness guaranteed.',
    heroSub:
      'Join us for yoga in a room full of puppies, right here in Saint-Lazare,',
    heroBook: 'Book a Session',
    heroClasses: 'Our Classes',
    heroScroll: 'Scroll',
    marqueeItems: buildMarquee([...enMarqueeBodies]),
    aboutBadge: 'Our Values',
    aboutHeadingL1: 'Yoga. Puppies.',
    aboutHeadingEmPrefix: '',
    aboutHeadingItalic: 'Happiness guaranteed',
    aboutP1:
      'Studio Yopaw grew out of a love for dogs and the grounding calm that yoga brings. Founded in 2026 by Joëlle Castonguay in Saint-Lazare, our studio offers dog-assisted wellness that welcomes everyone.',
    aboutP2:
      'Our yoga teachers lead every session with care and skill—whether it is your first class or you have been practicing for years, our four-legged co-teachers make everything feel that much more magical.',
    aboutP3:
      'At Studio Yopaw, the health, safety, and well-being of our puppies are our top priority. We are committed to providing a safe, clean, and respectful environment, in collaboration with responsible breeders who care deeply for each puppy\'s needs. All puppies are vaccinated and are given adequate time to rest, eat, and hydrate between each session to ensure their comfort and well-being at all times.',
    aboutLink: 'Explore our classes →',
    aboutImgAlt: 'Studio Yopaw puppy yoga session',
    classesBadge: 'WHAT WE OFFER',
    classesHeading: 'Less Stress. ',
    classesHeadingEm: 'More Puppies',
    classesSub: '',
    classesBook: 'Reserve my spot',
    classCards: [
      {
        title: 'Regular Class',
        duration: '60 min',
        description:
          'Accessible movement in a warm, welcoming space. Move at your own pace surrounded by puppies.',
      },
      {
        title: 'Private Event',
        duration: 'Flexible',
        description:
          "Book a private puppy yoga session for your group. Birthdays, girls' night, retirement send-offs—any excuse works for an exclusive experience built around you.",
      },
      {
        title: 'Corporate',
        duration: 'Flexible',
        description:
          'Turn your next team-building day into a feel-good, puppy-filled experience people will actually remember.',
      },
    ],
    experienceBadge: '',
    experienceHeadingPre: 'The 60 most delightful ',
    experienceHeadingEm: 'minutes of your week!',
    experienceSub: 'Gentle yoga, a room full of puppies, zero stress.',
    experienceBook: 'Reserve my spot',
    experienceSteps: [
      {
        logoAlt: 'Warm up',
        time: '15 min',
        title: 'Warm Up',
        description:
          'Breathe, settle, and forget about your day. Gentle movement, soft music, just you and your mat.',
      },
      {
        logoAlt: 'Flow with puppies',
        time: '15 min',
        title: 'Gentle flow with the pups',
        description:
          "This is the puppies' big entrance—our team brings them out for you. Good luck staying focused and keeping a straight face!",
      },
      {
        logoAlt: 'Play and connect',
        time: '30 min',
        title: 'Play & Connect',
        description:
          'Mats rolled away, phones out. Free play, cuddles, and as many photos as you want. Total chaos. Pure joy.',
      },
    ],
    bookingChoiceYin: 'Regular Class',
    bookingChoiceGentle: 'Private Event',
    bookingChoiceCorporate: 'Corporate',
    pricingSectionBadge: 'Book your session',
    pricingHeadingPre: 'Ready to Meet the ',
    pricingHeadingMidLead: '',
    pricingHeadingEm: 'Pups',
    pricingHeadingMidTrail: ' ?',
    pricingSub: 'Choose your session type, pick a date, and we will see you on the mat!',
    pricingAmount: '$46',
    pricingPlusTaxes: '+ taxes',
    pricingDropInRow: '$46 + taxes per session',
    pricingFeat1: '✓ 60-minute activity',
    pricingFeat2: '✓ Gentle flow accessible to all',
    pricingFeat3: '✓ Yoga mat rental on-site ($5)',
    pricingFeat4: '',
    pricingFeat5: '',
    pricingHeaderSummary: '$46 + taxes · Per session',
    pricingAskClassType: 'What kind of class are you looking for?',
    pricingAskMat: 'Do you have your own yoga mat?',
    pricingMatYes: "Yes, I'll bring mine",
    pricingMatNo: "No, I'll rent one on-site",
    pricingMatHelper: 'Yoga mat rental available on-site for $5',
    pricingAskPrivateGroupSize: 'How many people will be included in your group?',
    pricingPrivateGroupMaxHint: 'Maximum 20 participants per session.',
    pricingPrivateQtyDecAria: 'Decrease number of participants',
    pricingPrivateQtyIncAria: 'Increase number of participants',
    pricingPrivateGroupContinue: 'Continue',
    pricingChooseSession: 'Select your preferred time',
    pricingChooseTimeTitle: 'Choose a session time',
    pricingTimeModalCancel: 'Cancel',
    pricingSessionPickTime: 'Choose time',
    pricingSpotFull: 'Full',
    pricingSpotsRemain: '{count} spots remaining',
    pricingContactHeading: 'Almost there, how do we reach you?',
    pricingLblFullName: 'Full name',
    pricingLblEmail: 'Email address',
    pricingLblPhone: 'Phone number',
    pricingTermsCheckboxLabel:
      'By checking this box, I confirm that I have read and agree to the Terms & Conditions.',
    pricingWaiverConsentPrefix: 'By checking this box, I agree to this ',
    pricingWaiverConsentLinkText: 'liability waiver',
    pricingWaiverConsentSuffix:
      ', consent to the use of my image, and acknowledge and accept the risks associated with the activity.',
    pricingWaiverAgeNote:
      'The minimum required age is 12 years old. Children aged 8 and older may participate provided they are accompanied by an adult.',
    pricingPrivateEventSubmitNote:
      'Private events are fully customized. Please complete this form — we will contact you within 24 hours to confirm the details and plan your event together.',
    waiverModalCloseAria: 'Close waiver',
    pricingSubmitBookSpot: 'Confirm booking',
    pricingCorporateTitle: "Let's plan your event",
    pricingCorporateIntro:
      "Private and corporate bookings are fully customized. Fill out the form below and we'll get back to you within 24 hours to plan everything.",
    pricingLblGroupSize: 'Group size',
    pricingLblEventDetails: 'Tell us about your event',
    pricingCorpPlaceholder: 'Type of event, preferred date,\nany special requests…',
    pricingCorporateSubmit: 'Send My Request',
    pricingSuccessPublicTitle: "You're on the mat! 🐾",
    pricingSuccessPublicBody:
      "We'll send your confirmation to {email}. See you on {date} at {time}.",
    pricingSuccessChosenDayFallback: 'your chosen day',
    pricingSuccessPublicFoot: 'Questions? Email us at studioyopaw@gmail.com',
    pricingSuccessRestart: 'Book another spot',
    pricingSuccessRequestReceivedTitle: 'Request received!',
    pricingSuccessRequestReceivedBody:
      "Thank you! We've received your request and will contact you within 24 hours to confirm the details and finalize your private session.",
    pricingSuccessRequestReachOutPhone: "We'll call or text you at {phone}.",
    pricingSuccessBackHome: 'Back to home',
    abbrevRequiredTitle: 'required',
    galleryBadge: 'The Studio',
    galleryHeading: 'Moments of ',
    galleryHeadingEm: 'Joy',
    gallerySub: 'Every session is a memory in the making.',
    galleryAlts: {
      session: 'Studio Yopaw session',
      classSession: 'Class in session',
      happyMoment: 'Happy pup moment',
      yogaFlow: 'Yoga flow with puppies',
      highlight: 'Studio highlight',
    },
    testimonialsBadge: 'Real Experiences',
    testimonialsHeadingPre: 'One Class. Hooked for ',
    testimonialsHeadingEm: 'Life.',
    testimonialsSub: "Don't take our word for it. Here's what first-timers have to say.",
    testimonialsPrevAria: 'Previous review',
    testimonialsNextAria: 'Next review',
    testimonialsDotAria: 'Go to testimonial',
    testimonialsCta: 'Reserve my session',
    testimonialCards: [
      {
        name: 'Sarah M.',
        since: 'Yoga participant',
        quote:
          "I've tried every yoga studio in the city, but nothing compares to the pure joy of practicing with puppies. It completely transformed my relationship with mindfulness.",
      },
      {
        name: 'Jamie L.',
        since: 'Regular attendee',
        quote:
          "The instructors are incredible, the puppies are adorable, and the atmosphere is so welcoming. It's genuinely the highlight of my week, every single week.",
      },
      {
        name: 'Priya K.',
        since: 'First-time visitor',
        quote:
          "As someone who struggles with anxiety, puppy yoga has been genuinely therapeutic. The combination of mindful movement and puppy cuddles is simply unbeatable.",
      },
    ],
    faqBadge: 'Got Questions?',
    faqHeading: 'Frequently Asked ',
    faqHeadingEm: 'Questions',
    faqSub: 'Everything you need to know before your first class.',
    faqItems: [
      {
        q: 'Do I need to own a dog to attend?',
        a: 'Not at all—our team takes care of the puppies. You roll out your mat, and the pups come to you.',
      },
      {
        q: 'What is the minimum age to participate?',
        a: 'The minimum required age is 12 years old. Children aged 8 and older may participate provided they are accompanied by an adult.',
      },
      {
        q: 'Do I need yoga experience?',
        a: 'No yoga background needed. Gentle flow is slow, accessible, and perfect for beginners.',
      },
      {
        q: 'Will the dogs distract me?',
        a: "That's part of the magic! Puppies wander during class—a paw on your mat happens before you know it. Our team is right there to keep the session running smoothly and everyone—two-legged and four-legged—safe.",
      },
      {
        q: 'What should I bring?',
        a: "Wear something comfortable and bring a yoga mat. Puppies sometimes chew or scratch mats, so we also offer rentals for $5 if you'd rather use ours.",
      },
      {
        q: 'What is your cancellation policy?',
        a: "For group classes, cancellations by you require at least 72 hours' notice before your session starts to receive a full refund.\n\nFor private and corporate events, different terms apply. To read the complete refund policy, click here: <<REFUND_POLICY_LINK>>",
      },
    ],
    footerTaglineL1: 'Yoga and animal-assisted therapy—the perfect zero-stress blend.',
    footerTaglineL2: 'Every pose is better with a puppy!',
    footerIgAria: 'Instagram',
    footerFbAria: 'Facebook',
    footerNavigate: 'Navigate',
    footerFindUs: 'Find Us',
    footerAddressL1: '1515A Des Marguerites St.',
    footerAddressL2: 'Saint-Lazare, QC J7T 2R8',
    footerSite: 'www.yopaw.ca',
    footerWaiver: 'Liability Waiver',
    footerRefundPolicy: 'Refund Policy',
    footerBottom: '© 2026 Studio Yopaw · Saint-Lazare, QC',
    commonBackAria: 'Back',
    navLinks: {
      howItWorks: 'How It Works',
      classes: 'Class Types',
      reviews: 'Reviews',
      pricing: 'Pricing',
      corporate: 'Corporate',
      faq: 'FAQ',
      values: 'Our Values',
    },
  },
  fr: {
    metaTitle: 'Studio Yopaw · Studio de yoga avec chiots',
    metaDescription:
      'Studio Yopaw : où les chiots et les humains retrouvent leur flow. Mouvement conscient, amour inconditionnel.',
    navBrand: 'Studio Yopaw',
    navToggle: 'Ouvrir le menu',
    navBook: 'Réserver une séance',
    navLangShort: 'FR',
    navLangOtherHint: 'Changer de langue',
    navSwitchToEnAria: 'Afficher en anglais',
    navSwitchToFrAria: 'Voir le site en français',
    navMobileBook: 'Réserver une séance',
    langPickerEnglish: 'English',
    langPickerFrench: 'Français',
    heroTitleL1: 'Yoga. Chiots.',
    heroTitleL2Prefix: '',
    heroTitleItalic: 'Bonheur garanti.',
    heroSub:
      'Venez avec nous faire du yoga dans une salle remplie de chiots, ici même à Saint-Lazare,',
    heroBook: 'Réserver une séance',
    heroClasses: 'Nos cours',
    heroScroll: 'Défiler',
    marqueeItems: buildMarquee([
      'Aucun chien requis',
      'Saint-Lazare, QC',
      'Séances de 60 minutes',
      'Tous niveaux bienvenus',
      "Jusqu'à 20 places disponibles par séance",
      'Photos à volonté',
      'Flow doux et accessible à tous',
      'Stress : on s’en occupe',
      'Namaste et jeu',
      'Réservation en ligne en quelques minutes',
      'Politique d’annulation : 72 heures',
    ]),
    aboutBadge: 'Nos valeurs',
    aboutHeadingL1: 'Yoga. Chiots.',
    aboutHeadingEmPrefix: '',
    aboutHeadingItalic: 'Bonheur garanti',
    aboutP1:
      "Studio Yopaw est né de l'union de l'amour pour les chiens et le bien-être que procure le yoga. Fondé en 2026 par Joëlle Castonguay à Saint-Lazare, notre studio propose une thérapie assistée par les chiens accessible à tous et à toutes.",
    aboutP2:
      "Nos professeurs·es de yoga encadrent chaque séance avec soin et expertise. Que ce soit votre tout premier cours ou une pratique déjà bien ancrée, nos co-professeurs·es à quatre pattes rendent tout beaucoup plus magique.",
    aboutP3:
      "Chez Studio Yopaw, la santé, la sécurité et le bien-être des chiots sont notre priorité. Nous veillons à offrir un environnement sécuritaire, propre et respectueux, en collaboration avec des éleveurs responsables et attentifs aux besoins de chaque chiot. Tous les chiots sont vaccinés et disposent de temps suffisant pour se reposer, manger et s'hydrater entre chaque séance afin d'assurer leur confort et leur bien-être en tout temps.",
    aboutLink: 'Découvrir nos cours →',
    aboutImgAlt: 'Séance de yoga avec chiots Studio Yopaw',
    classesBadge: "CE QUE L'ON VOUS PROPOSE",
    classesHeading: 'Moins de stress. ',
    classesHeadingEm: 'Plus de chiots',
    classesSub: '',
    classesBook: 'Réservez ma séance',
    classCards: [
      {
        title: 'Cours régulier',
        duration: '60 min',
        description:
          'Des mouvements accessibles dans une ambiance chaleureuse. Avancez à votre rythme entouré de chiots.',
      },
      {
        title: 'Événement privé',
        duration: 'Flexible',
        description:
          'Réservez une séance privée de yoga chiots. Anniversaire, soirée de filles ou départ à la retraite, toutes les raisons sont bonnes pour une expérience exclusive pensée pour votre groupe.',
      },
      {
        title: 'Corporatif',
        duration: 'Flexible',
        description:
          'Transformez votre prochaine activité de team building en une expérience bien-être unique et mémorable, entourée de chiots.',
      },
    ],
    experienceBadge: '',
    experienceHeadingPre: 'Les 60 minutes ',
    experienceHeadingEm: 'les plus adorables de votre semaine !',
    experienceSub: 'Du yoga tout en douceur, une salle pleine de chiots, zéro stress.',
    experienceBook: 'Réserver ma place',
    experienceSteps: [
      {
        logoAlt: 'Échauffement',
        time: '15 min',
        title: 'Échauffement',
        description:
          'On respire, on se pose, on laisse la journée derrière. Mouvements doux, musique douce, vous et votre tapis.',
      },
      {
        logoAlt: 'En flux avec les chiots',
        time: '15 min',
        title: 'Flow doux avec les chiots',
        description:
          "C'est l'entrée en scène des chiots. Notre équipe vous les présente enfin. Bonne chance pour demeurer concentré et garder votre sérieux !",
      },
      {
        logoAlt: 'Jeux et complicité',
        time: '30 min',
        title: 'Jeu et complicité',
        description:
          'Tapis rangés, téléphones sortis : jeu libre, câlins et autant de photos que vous le voulez. Chaos total. Pure joie.',
      },
    ],
    bookingChoiceYin: 'Cours régulier',
    bookingChoiceGentle: 'Événement privé',
    bookingChoiceCorporate: 'Corporatif',
    pricingSectionBadge: 'Réservez votre séance',
    pricingHeadingPre: 'Prêt·e à rencontrer',
    pricingHeadingMidLead: 'les ',
    pricingHeadingEm: 'chiots',
    pricingHeadingMidTrail: ' ?',
    pricingSub:
      "Choisissez votre type de séance ainsi qu'une date et rendez-vous sur le tapis !",
    pricingAmount: '46 $',
    pricingPlusTaxes: '+ taxes',
    pricingDropInRow: '46 $ + taxes par séance',
    pricingFeat1: "✓ Durée de l'activité : 60 minutes",
    pricingFeat2: '✓ Flow doux accessible à tous',
    pricingFeat3: '✓ Location de tapis sur place (5 $)',
    pricingFeat4: '',
    pricingFeat5: '',
    pricingHeaderSummary: '46 $ + taxes · À la séance',
    pricingAskClassType: 'Quel type de cours recherchez-vous ?',
    pricingAskMat: 'Avez-vous votre propre tapis de yoga ?',
    pricingMatYes: 'Oui, j’apporte le mien',
    pricingMatNo: 'Non, je louerai sur place',
    pricingMatHelper: 'Location de tapis sur place pour 5 $',
    pricingAskPrivateGroupSize:
      'Combien de personnes seront incluses dans votre groupe ?',
    pricingPrivateGroupMaxHint: 'Maximum 20 participants par séance.',
    pricingPrivateQtyDecAria: 'Diminuer le nombre de participants',
    pricingPrivateQtyIncAria: 'Augmenter le nombre de participants',
    pricingPrivateGroupContinue: 'Continuer',
    pricingChooseSession: 'Sélectionnez votre horaire préféré',
    pricingChooseTimeTitle: 'Choisissez un horaire',
    pricingTimeModalCancel: 'Annuler',
    pricingSessionPickTime: 'Choisir un horaire',
    pricingSpotFull: 'Complet',
    pricingSpotsRemain: '{count} places restantes',
    pricingContactHeading: 'Presque fini : comment vous joindre ?',
    pricingLblFullName: 'Nom complet',
    pricingLblEmail: 'Courriel',
    pricingLblPhone: 'Téléphone',
    pricingTermsCheckboxLabel:
      'En cochant cette case, je confirme avoir lu et accepté les conditions générales.',
    pricingWaiverConsentPrefix: "En cochant cette case, j'accepte la ",
    pricingWaiverConsentLinkText: 'décharge de responsabilité',
    pricingWaiverConsentSuffix:
      ", consens à l'utilisation de mon image et reconnais accepter les risques liés à l'activité.",
    pricingWaiverAgeNote:
      "L'âge minimum requis est de 12 ans. Les enfants de 8 ans et plus peuvent participer à condition d'être accompagnés d'un adulte.",
    pricingPrivateEventSubmitNote:
      'Les événements privés sont entièrement personnalisés. Merci de remplir ce formulaire : nous vous contacterons dans les prochaines 24 heures pour confirmer les détails et planifier votre événement ensemble.',
    waiverModalCloseAria: 'Fermer la décharge',
    pricingSubmitBookSpot: 'Confirmer la réservation',
    pricingCorporateTitle: 'Planifions votre événement',
    pricingCorporateIntro:
      'Les réservations privées et corporatives sont entièrement personnalisées. Remplissez le formulaire et nous communiquerons avec vous sous 24 h pour tout organiser.',
    pricingLblGroupSize: 'Taille du groupe',
    pricingLblEventDetails: 'Parlez-nous de votre événement',
    pricingCorpPlaceholder:
      'Type d’événement, date souhaitée,\ndemandes particulières…',
    pricingCorporateSubmit: 'Envoyer ma demande',
    pricingSuccessPublicTitle: 'Vous êtes sur le tapis ! 🐾',
    pricingSuccessPublicBody:
      'Nous enverrons la confirmation à {email}. Rendez-vous le {date} à {time}.',
    pricingSuccessChosenDayFallback: 'votre date choisie',
    pricingSuccessPublicFoot: 'Questions ? Écrivez-nous à studioyopaw@gmail.com',
    pricingSuccessRestart: 'Réserver une autre place',
    pricingSuccessRequestReceivedTitle: 'Demande reçue !',
    pricingSuccessRequestReceivedBody:
      'Merci ! Nous avons bien reçu votre demande et communiquerons avec vous dans les prochaines 24 heures pour confirmer les détails et finaliser votre séance privée.',
    pricingSuccessRequestReachOutPhone:
      'Nous vous contacterons par téléphone ou texto au {phone}.',
    pricingSuccessBackHome: "Retour à l'accueil",
    abbrevRequiredTitle: 'obligatoire',
    galleryBadge: 'Le studio',
    galleryHeading: 'Des moments ',
    galleryHeadingEm: 'de joie',
    gallerySub: 'Chaque séance devient un souvenir précieux.',
    galleryAlts: {
      session: 'Séance Studio Yopaw',
      classSession: 'Cours en studio',
      happyMoment: 'Moment chiot complice',
      yogaFlow: 'Yoga avec chiots',
      highlight: 'Coup de cœur du studio',
    },
    testimonialsBadge: 'Expériences vécues',
    testimonialsHeadingPre: 'Un cours. Accro ',
    testimonialsHeadingEm: 'pour toujours.',
    testimonialsSub:
      'Pas besoin de nous croire sur parole : voici ce qu’en disent les nouveau·elles.',
    testimonialsPrevAria: 'Témoignage précédent',
    testimonialsNextAria: 'Témoignage suivant',
    testimonialsDotAria: 'Aller au témoignage',
    testimonialsCta: 'Réservez ma séance',
    testimonialCards: [
      {
        name: 'Sarah M.',
        since: 'Participante',
        quote:
          "J'ai essayé plein de studios, mais aucun comme celui où l'on pratique avec des chiots. Ça m'a complètement changé ma façon de rester présente.",
      },
      {
        name: 'Jamie L.',
        since: 'Habitué·e',
        quote:
          "Les profs sont fantastiques, les chiots craquants, l’ambiance accueillante. C’est le moment que j’anticipe le plus chaque semaine.",
      },
      {
        name: 'Priya K.',
        since: 'Première visite',
        quote:
          "Avec mon anxiété, le yoga-chiots fait un bien fou. Mouvements conscients + câlins canins : imbattable.",
      },
    ],
    faqBadge: 'Une question ?',
    faqHeading: 'Foire ',
    faqHeadingEm: 'aux questions',
    faqSub: 'Tout ce qu’il faut savoir avant votre premier cours.',
    faqItems: [
      {
        q: 'Faut-il posséder un chien pour participer ?',
        a: "Pas du tout : notre équipe s'occupe des chiots. Vous déroulez votre tapis et les toutous viennent vers vous.",
      },
      {
        q: "Quel est l'âge minimum requis ?",
        a: "L'âge minimum requis est de 12 ans. Les enfants de 8 ans et plus peuvent participer, à la condition d'être accompagnés d'un adulte.",
      },
      {
        q: 'Faut-il savoir faire du yoga ?',
        a: 'Aucune expérience de yoga requise. Flow doux : lent, accessible, parfait pour les débutants.',
      },
      {
        q: 'Est-ce que les chiens vont me déconcentrer ?',
        a: "Ça fait partie de l'effet magique ! Les chiots circulent pendant la séance. Un coup de patte est si vite arrivé ! Notre équipe est évidemment sur place pour veiller au bon déroulement de l'activité et à la sécurité des chiots autant que des humains.",
      },
      {
        q: 'Que dois-je apporter ?',
        a: "Prévoyez porter une tenue confortable et un tapis de yoga. Il est possible que les chiots abîment votre tapis en le mordillant par exemple. C'est pourquoi nous vous offrons des tapis en location au coût de 5$ si vous préférez cette option.",
      },
      {
        q: "Quelle est votre politique d'annulation ?",
        a: "Pour les cours de groupe, une annulation de votre part requiert un préavis minimal de 72 heures avant la séance pour obtenir un remboursement complet.\n\nPour les événements privés et les événements corporatifs, d'autres conditions s'appliquent. Pour consulter la politique de remboursement complète, cliquez ici : <<REFUND_POLICY_LINK>>",
      },
    ],
    footerTaglineL1: 'Yoga et zoothérapie, le parfait mélange zéro stress.',
    footerTaglineL2: 'Chaque posture est meilleure avec un chiot !',
    footerIgAria: 'Instagram',
    footerFbAria: 'Facebook',
    footerNavigate: 'Navigation',
    footerFindUs: 'Nous joindre',
    footerAddressL1: '1515A, rue des Marguerites',
    footerAddressL2: 'Saint-Lazare, QC J7T 2R8',
    footerSite: 'www.yopaw.ca',
    footerWaiver: 'Décharge de responsabilité',
    footerRefundPolicy: 'Politique de remboursement',
    footerBottom:
      '© 2026 Studio Yopaw · Saint-Lazare, QC · Fabriqué avec 🐾',
    commonBackAria: 'Retour',
    navLinks: {
      howItWorks: 'Déroulement',
      classes: 'Type de cours',
      reviews: 'Avis',
      pricing: 'Tarifs',
      corporate: 'Corporatif',
      faq: 'FAQ',
      values: 'Nos valeurs',
    },
  },
}
