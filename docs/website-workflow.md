# Vehicle → Polish website (0.5.0)

The existing read-only Arval extension saves a vehicle by VIN, source snapshots, normal and damage images, PartsLink data and inspection attachments to the private home.pl store. “Подготовить карточку сайта” saves the packet and creates an idempotent Polish product draft. It does not publish or send Telegram messages.

Operator: open the lot, read PartsLink PDF, attach inspection PDFs, select equipment, then prepare the website card. Open its protected editor and review Polish title/description, workflow state, availability, photographs, location and explicit Warsaw net/gross prices. Source auction bids never become ready-car prices. Inspection PDFs are attachments, not automatically interpreted condition assessments.

States: auction → purchased → in_transit → on_site → sold; closed means auction ended without purchase. Availability free/reserved is independent. Owner publication is a separate explicit action. Ordinary source recapture does not overwrite reviewed product fields or the published snapshot.

Public section: https://atlantauto.pl/pl/oferty/ ; technical read-only feed: https://serwer2454127.home.pl/offers/?format=json . No private VIN, auction URL, customer identity or internal file path is in the public projection. Documents are private unless explicitly selected for publication. Damage images cannot be selected as public product images.

Private editor requires a viewer session; all changes additionally require an individual employee key. Only owner may publish/unpublish. Optimistic revisions prevent stale saves. CSRF protects forms. Keys and bot credentials stay out of repository and public projections.

Source snapshots and complete product revisions are retained separately. Restoring a product revision creates a new draft revision; it never modifies the public snapshot automatically. Files/database require private server backups; Git tracks application code, not production records or secrets. Earlier captures before product-history support have only their then-current product revision available.

Deployment: private PHP libraries under internal-api are denied direct HTTP access; portal under drafts; read-only endpoint/static assets under offers. Main site remains GitHub Pages with a static Polish entrypoint loading the read-only feed. Move navigation/section placement later without recreating vehicles. Warsaw photograph uploads are a later stage.

## 0.6.0: lifecycle at capture and legacy retirement
The extension lets the operator choose auction/in_transit/on_site and free/reserved. For purchased vehicles it accepts explicit Warsaw net/gross prices in EUR/PLN. On-site preparation requires at least one ready price and real yard photographs, uploaded as on_site assets and selected as the product gallery. Auction photographs and damage images are retained separately. These fields are applied by an authenticated product_save after idempotent creation; no owner publication is invoked. Blank price fields do not erase existing prices.

Legacy static vehicles are retired from cards, static detail routes and sitemap rather than marked sold without evidence. A local archive is kept under _backups/legacy-catalog-20261017; no legacy vehicle is imported into sold statistics. The empty legacy catalogue links to /pl/oferty/. New published vehicles use the server catalogue, ordered in_transit/purchased, on_site, auction, sold.
