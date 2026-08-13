# Figma asset export plan — RentZor

File: 70FUOaXksil0S4CTTiXX8d, canvas 116:9149 ('High fidelity')

STATUS: COMPLETE (2026-07-02) — all 44 icons (SVG) + 49 unique raw images exported
via the Figma REST API (/v1/images and /v1/files/:key/nodes). Node IDs below remain
valid as a map from asset file -> Figma node for future re-exports.

## Done (4 icons exported as SVG)
- profile-settings/alt-arrow-up.svg (293:11550)
- shared/back-arrow-icon.svg (293:11512)
- shared/back-icon.svg (293:12427)
- profile-settings/book-icon.svg (293:11486)

## Pending icon exports (SVG) — 40 remaining
Call download_assets(defaultFormat=svg) per node, save to <dest>/<name>.svg:

- 293:11821 -> shared/bookmark-icon.svg
- 293:11804 -> shared/check.svg
- 293:11949 -> shared/checkbox.svg
- 293:12176 -> search/close.svg
- 293:12504 -> booking-flow/close-circle.svg
- 293:12464 -> booking-flow/component-4.svg
- 293:12486 -> booking-flow/component-5.svg
- 293:11364 -> shared/component-6.svg
- 293:11875 -> shared/date-icon.svg
- 293:11083 -> shared/double-icon.svg
- 293:11717 -> profile-settings/drop-off-time-dropdown-arrow.svg
- 293:11751 -> shared/expand-map-icon.svg
- 293:11478 -> profile-settings/global.svg
- 293:12174 -> search/history.svg
- 293:11738 -> shared/id-verification-icon.svg
- 293:12543 -> booking-flow/icon.svg
- 293:11084 -> shared/indicator.svg
- 293:11400 -> profile-settings/link-icon.svg
- 293:12303 -> shared/location.svg
- 293:12089 -> shared/map-location-icon.svg
- 293:11617 -> profile-settings/next-month-arrow.svg
- 293:11729 -> shared/owner-rating-star.svg
- 293:11712 -> profile-settings/pickup-time-dropdown-arrow.svg
- 293:11615 -> profile-settings/previous-month-arrow.svg
- 293:11881 -> shared/price-icon.svg
- 293:11925 -> shared/radio-button.svg
- 293:11601 -> profile-settings/rating-star.svg
- 293:11744 -> shared/response-rate-icon.svg
- 293:11741 -> shared/response-time-icon.svg
- 293:11769 -> shared/review-rating-star.svg
- 293:11440 -> profile-settings/shield-check.svg
- 293:12006 -> location-notification/sizga-yaqin-joylashgan-arrow.svg
- 293:11403 -> profile-settings/social-icons.svg
- 293:12474 -> booking-flow/star.svg
- 293:11520 -> profile-settings/toggle.svg
- 293:12167 -> search/tuning.svg
- 293:11791 -> shared/yaqinda-korilgan-arrow.svg
- 293:11409 -> shared/action-bar-nav.svg
- 293:11041 -> home/product-type-button.svg
- 293:11846 -> profile-settings/credit-card.svg

## Pending raw-image sweeps — 80 screens
Call download_assets per screen frame (no format override); save each rawImages[] entry
to <dest>/ named by its node name (kebab-case, original format ext); dedupe by content hash,
move cross-flow duplicates to shared/:

- 293:11039 'Home' -> home/
- 293:11087 'Splash' -> onboarding/
- 293:11091 'Onboarding 4' -> onboarding/
- 293:11110 'Onboarding 5' -> onboarding/
- 293:11130 'Onboarding 6' -> onboarding/
- 293:11150 'Phone number' -> login-registration/
- 293:11161 'Phone number' -> login-registration/
- 293:11171 'Phone number' -> login-registration/
- 293:11181 'OTP' -> login-registration/
- 293:11202 'OTP' -> login-registration/
- 293:11222 'OTP' -> login-registration/
- 293:11246 'My id verification' -> authentication/
- 293:11259 'My id verification' -> authentication/
- 293:11271 'My id verification' -> authentication/
- 293:11326 'Saved' -> saved/
- 293:11338 'Profile (with refound money)' -> profile-settings/
- 293:11350 'Profile (without refound money)' -> profile-settings/
- 293:11362 'Profile information' -> profile-settings/
- 293:11369 'My ID' -> profile-settings/
- 293:11378 'Transaction history' -> profile-settings/
- 293:11392 'Telegram linked' -> profile-settings/
- 293:11411 'Telegram linked' -> profile-settings/
- 293:11430 'My cards' -> profile-settings/
- 293:11436 'Add card' -> profile-settings/
- 293:11446 'OTP' -> profile-settings/
- 293:11462 'Log out' -> profile-settings/
- 293:11493 'Settings' -> profile-settings/
- 293:11507 'Language' -> profile-settings/
- 293:11538 'Help & support' -> profile-settings/
- 293:11562 'Profile' -> profile-settings/
- 293:11573 'Profile information' -> profile-settings/
- 293:11580 'My ID' -> profile-settings/
- 293:11587 'Product Detail' -> profile-settings/
- 293:11843 'Refound' -> profile-settings/
- 293:11854 'Top up balance' -> profile-settings/
- 293:11866 'Dispute' -> profile-settings/
- 293:11886 'Dispute' -> profile-settings/
- 293:11906 'Dispute detail' -> profile-settings/
- 293:11934 'Dispute detail' -> profile-settings/
- 293:11977 'Location' -> location-notification/
- 293:12031 'Location' -> location-notification/
- 293:12085 'Map' -> location-notification/
- 293:12095 'Search' -> location-notification/
- 293:12104 'Edit location' -> location-notification/
- 293:12117 'Notification' -> location-notification/
- 293:12130 'Search' -> search/
- 293:12139 'Search resoult' -> search/
- 293:12151 'Search resoult' -> search/
- 293:12159 'Filter' -> search/
- 293:12191 'Filter' -> search/
- 293:12223 'Filter kategoriya' -> search/
- 293:12255 'Filter kategoriya' -> search/
- 293:12289 'Product Detail' -> booking-flow-payment/
- 293:12314 'Date selected' -> booking-flow-payment/
- 293:12341 'Time selected' -> booking-flow-payment/
- 293:12382 'To'lov qilish' -> booking-flow-payment/
- 293:12390 'To'lov qilish' -> booking-flow-payment/
- 293:12397 'To'lov qilish' -> booking-flow-payment/
- 293:12432 'Hisobni to'ldirish' -> booking-flow-payment/
- 293:12445 'My booking' -> booking-flow/
- 293:12455 'My booking (option)' -> booking-flow/
- 293:12466 'All comment' -> booking-flow/
- 293:12483 'Photo upload' -> booking-flow/
- 293:12492 'Photo upload' -> booking-flow/
- 293:12510 'Confirm check' -> booking-flow/
- 293:12558 'Confirm check' -> booking-flow/
- 293:12606 'Dispute' -> booking-flow/
- 293:12653 'Map' -> booking-flow/
- 293:12665 'Cancel (modal)' -> booking-flow/
- 293:12790 'Cancel (modal)' -> booking-flow/
- 293:12915 'Cancel (modal)' -> booking-flow/
- 293:13040 'Image view' -> booking-flow/
- 293:13172 'Pending' -> booking-flow/
- 293:13236 'Option' -> booking-flow/
- 293:13256 'Confirmed' -> booking-flow/
- 293:13276 'In progress' -> booking-flow/
- 293:13297 'In progress (option)' -> booking-flow/
- 293:13319 'Completed' -> booking-flow/
- 293:13339 'Confirmed (option)' -> booking-flow/
- 293:13360 'Comment' -> booking-flow/