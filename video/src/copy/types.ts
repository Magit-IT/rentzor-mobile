/**
 * Everything the Reels say on screen, per language. UI strings mirror the
 * app's own i18n (src/i18n/*.ts) so the recreated screens read exactly like
 * the product. Add a language by copying ru.ts and translating the values.
 */

/** A headline: one entry per line; words wrapped in *asterisks* are highlighted. */
export type Lines = string[];

export interface Product {
  key: 'camera' | 'ps5' | 'scooter' | 'drone' | 'ipad' | 'speaker' | 'bike' | 'vr' | 'xbox';
  title: string;
  price: number;
  place: string;
  distance: string;
  rating: number;
}

export interface Copy {
  lang: 'ru' | 'uz';
  currency: string;
  perDay: string;
  days: (n: number) => string;
  promo: {
    hook: Lines;
    rentA: string;
    rentB: string;
    rentSub: string;
    nearby: Lines;
    categories: string[];
    map: Lines;
    trust: Lines;
    trustChips: string[];
    ownerQ: string;
    owner: Lines;
    ownerIncomeLabel: string;
    ctaTagline: string;
    ctaButton: string;
    url: string;
    linkInBio: string;
  };
  explainer: {
    intro: string;
    question: string;
    renterSide: { title: string; sub: string };
    ownerSide: { title: string; sub: string };
    renterChapter: { kicker: string; title: Lines; steps: string };
    ownerChapter: { kicker: string; title: Lines; steps: string };
    step: (n: number) => string;
    r1: { title: Lines; sub: string };
    r2: { title: Lines; sub: string };
    r3: { title: Lines; sub: string };
    r4: { title: Lines; sub: string };
    o1: { title: Lines; sub: string };
    o2: { title: Lines; sub: string };
    o3: { title: Lines; sub: string };
    o4: { title: Lines; sub: string };
    trust: Lines;
    trustItems: string[];
    ctaTitle: string;
    /** Headline on the explainer cover. */
    coverTitle: Lines;
  };
  ui: {
    city: string;
    searchPlaceholder: string;
    searchQuery: string;
    resultsCount: string;
    nearby: string;
    viewAll: string;
    tabs: [string, string, string, string];
    book: string;
    perDayLabel: string;
    verified: string;
    owner: string;
    reviews: string;
    calendarMonth: string;
    weekdays: string[];
    rangeLabel: string;
    total: string;
    paymentTitle: string;
    yourBalance: string;
    item: string;
    period: string;
    duration: string;
    totalPrice: string;
    acceptContract: string;
    pay: string;
    requestSent: string;
    bookingConfirmedTitle: string;
    bookingConfirmedBody: string;
    pickupPhotos: string;
    pickupNote: string;
    statuses: [string, string, string, string];
    rateTitle: string;
    myIdTitle: string;
    myIdScanning: string;
    myIdVerified: string;
    newListing: string;
    showcasePhotos: string;
    nameLabel: string;
    priceLabel: string;
    pickupLabel: string;
    pickupPlace: string;
    publish: string;
    onReview: string;
    approvedTitle: string;
    approvedBody: string;
    newRequestTitle: string;
    newRequestBody: string;
    orderTitle: string;
    renter: string;
    rentalPeriod: string;
    rentalDates: string;
    yourEarnings: string;
    confirm: string;
    reject: string;
    confirmed: string;
    balanceLabel: string;
    totalEarnings: string;
    withdraw: string;
    topUp: string;
    toCard: string;
    withdrawDone: string;
    earningsOverview: string;
    rentalIncome: string;
    now: string;
    selectDates: string;
    photoTitle: string;
    accept: string;
    pickupSuccess: string;
    bookingStatus: string;
    listingSent: string;
    withdrawTitle: string;
    withdrawAmount: string;
    withdrawConfirm: string;
    withdrawSuccess: string;
    welcome: string;
    totalBookings: string;
    allTime: string;
    faceHint: string;
    docLabel: string;
    /** Renter-side status right after paying (bookings.status.pending). */
    pendingRenter: string;
    /** Owner-side status of a new request (owner.orderStatus.pending). */
    pendingOwner: string;
  };
  products: Product[];
  /** Search results for "камера" in the explainer (images are fixed per slot). */
  searchResults: { title: string; price: number; distance: string; place: string; rating: number }[];
  renterName: string;
  ownerName: string;
}
