# Current workflow: Chrome → server → VIN ERP → website (0.9.0)

The extension only captures Arval, reads multiple PartsLink PDFs, attaches multiple inspection PDFs, and uploads the source packet plus all discovered ordinary/damage photos. After success it offers the stable ERP entry `https://serwer2454127.home.pl/erp/?id=...`. This routes to the existing session-protected VIN registry under `/drafts/`; session cookies stay narrowly scoped. Telegram remains a separate explicit action. Extension product create/save/publish endpoints now return 403; older extension copies can still upload source data but must be updated to use the new flow.

The existing unique VIN record is the entity; no duplicate ERP or website vehicle is created. New uploads appear under “Новые загрузки”. In ERP, “Принять в ERP” idempotently prepares reviewed fields with initial auction state, without publishing. Main operator states: auction, in_transit, on_site, sold. Legacy purchased/closed records remain accessible. Free/reserved is independent.

ERP owns lifecycle, price, reviewed Polish content and public selections. First website publication still requires owner authorization. Saving an already-published vehicle from ERP atomically updates its public projection and revision; only owner can do that. An unreviewed or hidden record never auto-publishes. Restoring an old revision remains a private draft until explicitly reviewed/published. Source recapture preserves both ERP lifecycle and reviewed/public fields.

Ready vehicles require at least one explicit Warsaw price for publication. On-site publication additionally requires at least one selected yard photo. An invalid ERP save rolls back both internal/public changes. Auction bids remain separate from ready prices. PDF upload stores originals; inspection assessment is not automatically inferred. No actual vehicle is published during tests.

ERP v1 is a VIN register and lifecycle editor, not accounting, warehouse accounting, customer CRM, invoicing or payments. Existing material history and product revisions are retained. Private VINs, source URLs, customer data and non-selected documents stay outside the public projection.

## Prior iterations (superseded where conflicting)

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

## 0.7.0: source → documents → editable preview → publish
“Сохранить на сервере → открыть превью” saves the source packet, all discovered ordinary/damage photographs, the successfully read PartsLink PDF and all queued inspection PDFs, then idempotently creates the product and opens its editor inside the extension. Inspection PDFs support multiple selection and additive batches with removal. No publication or Telegram send is performed by this action.

The editor permits Polish title/description/equipment/tyres, dates, mileage, keys, power with units, engine size, fuel, transmission, colour, registration-document country, AWD, VAT deductibility, state (including sold), reservation, ready prices, ETA, location, public photographs and optional PDF sharing. Saving creates a product revision. “Отправить на сайт” saves the reviewed fields and explicitly publishes that revision; backend owner authorization is required independently of UI visibility. Employees can save drafts, while their publish button is disabled after server identity verification. Photographs are fetched from private storage using the employee key in the Authorization header, never in a URL.

Arval collector preserves unknown values as null, keeps original fields, reads the visible tyre section, stores all recognized document links and associates damage comments with a photograph only when its visible container identifies a single damage. VAT deductible is a separate fact and never silently changes the source price tax basis; the owner's net-price publication convention remains explicit. Unrecognized colour/country strings remain in private source evidence for manual Polish editing. Inspection PDFs are not automatically analysed; raw tyre/service/damage text is shown for review, and public tyre text is manually reviewed.

## 0.8.0: PartsLink PDF sets
PartsLink accepts an additive set of up to 10 PDFs, validates the VIN independently in each, and merges fields/equipment only after all documents pass. Conflicting field values stop the import; compatible date precision is preserved. Hyundai/Kia identification, equipment and additional-equipment tables have a dedicated adapter. Explicit MILD HEV evidence is normalized as MHEV alongside the fuel field. Field/file provenance and all original PDFs are retained in private capture storage. Removing/changing selected PDFs requires re-reading; an import failure cannot apply half a set or silently use unprocessed files. Private Telegram PartsLink resources can include up to 10 PDF originals and the merged equipment text. Vehicle PDFs are local verification inputs only and must not be committed.
