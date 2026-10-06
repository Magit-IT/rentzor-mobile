/**
 * Everything the Reels say on screen, per language. UI strings mirror the
 * shipping app (screenshots, Oct 2026) so the rebuilt screens read exactly like
 * the product. Add a language by copying ru.ts and translating the values.
 */

/** A headline: one entry per line; words wrapped in *asterisks* are highlighted. */
export type Lines = string[];

export interface Item {
  key: 'camera' | 'ps5' | 'scooter' | 'drone' | 'ipad' | 'speaker' | 'bike' | 'vr' | 'xbox';
  title: string;
  price: number;
  km: string;
  place: string;
}

export interface Step {
  title: Lines;
  sub: string;
}

export interface Copy {
  lang: 'ru' | 'uz';
  currency: string;
  promo: {
    hook: Lines;
    rentA: string;
    rentB: string;
    rentSub: string;
    nearby: Lines;
    nearbyChip: string;
    address: Lines;
    before: string;
    after: string;
    trust: Lines;
    trustRows: string[];
    ownerQ: string;
    owner: Lines;
    ctaTagline: string;
    url: string;
  };
  explainer: {
    intro: string;
    question: string;
    renterSide: { title: string; sub: string };
    ownerSide: { title: string; sub: string };
    myid: Step;
    renterChapter: { kicker: string; title: Lines; steps: string };
    ownerChapter: { kicker: string; title: Lines; steps: string };
    step: (n: number) => string;
    r1: Step;
    r2: Step;
    r3: Step;
    r4: Step;
    r5: Step;
    o1: Step;
    o2: Step;
    o3: Step;
    trust: Lines;
    trustItems: string[];
    coverTitle: Lines;
  };
  ui: {
    searchPlaceholder: string;
    nearby: string;
    recentlyViewed: string;
    cats: string[];
    tabs: string[];
    ownerTabs: string[];
    filterTitle: string;
    price: string;
    from: string;
    to: string;
    distance: string;
    reset: string;
    apply: string;
    owner: string;
    verified: string;
    onPlatformSince: string;
    address: string;
    approxRadius: string;
    exactAddress: string;
    priceDetails: string;
    forDays: (n: number) => string;
    selectDates: string;
    calendarMonth: string;
    weekdays: string[];
    pickupTime: string;
    returnTime: string;
    daysTotal: string;
    clearDates: string;
    perDayLabel: string;
    book: string;
    paymentTitle: string;
    bookingDates: string;
    bookingDatesShort: string;
    pickupReturn: string;
    serviceFee: string;
    total: string;
    yourBalance: string;
    pay: string;
    confirmOrder: string;
    bookingInfo: string;
    item: string;
    period: string;
    duration: string;
    totalPrice: string;
    mainTerms: string;
    terms: string[];
    downloadContract: string;
    acceptContract: string;
    cancel: string;
    confirm: string;
    requestSent: string;
    photoTitle: string;
    compareWarning: string;
    accept: string;
    pickupSuccess: string;
    faceHint: string;
    myIdScanning: string;
    myIdVerified: string;
    profile: string;
    balanceLabel: string;
    topUp: string;
    withdraw: string;
    profileMenu: string[];
    ownerMenu: string[];
    ownerCtaTitle: string;
    ownerCtaSub: string;
    newListing: string;
    basicInfo: string;
    nameLabel: string;
    namePlaceholder: string;
    descLabel: string;
    descPlaceholder: string;
    categoryLabel: string;
    categoryPlaceholder: string;
    pickupLabel: string;
    addressPlaceholder: string;
    pickupPlace: string;
    back: string;
    next: string;
    notifications: string;
    newRequestTitle: string;
    newRequestPrefix: string;
    justNow: string;
    yesterday: string;
    rentalDone: string;
    rentalDoneBody: string;
    balanceToppedUp: string;
    balanceToppedUpPrefix: string;
    renter: string;
    dateLabel: string;
    cost: string;
    orderTitle: string;
    statusActive: string;
    rentalPeriod: string;
    pickup: string;
    pickupWhen: string;
    returnLabel: string;
    returnWhen: string;
    term: string;
    termValue: string;
    calc: string;
    rentLine: string;
    commission: string;
    yourEarnings: string;
    handedOver: string;
    handedOverDone: string;
    welcome: string;
    totalEarnings: string;
    activeListings: string;
    itemsSuffix: string;
    totalBookings: string;
    allTime: string;
    avgDaily: string;
    earningsOverview: string;
    earningsSub: string;
    months: string[];
    withdrawSuccess: string;
  };
  /** "Рядом с вами" rail, sorted by distance (nearest first). */
  nearbyItems: Item[];
  listingName: string;
  listingDesc: string;
  ownerName: string;
  renterName: string;
  ownerFull: string;
  ownerPhone: string;
  renterFull: string;
  renterPhone: string;
}
