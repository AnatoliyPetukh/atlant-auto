# Purchase dates from auction invoices

ERP keeps purchase-date evidence in a separate private `vehicle_purchases` table. The date column in Fleet Management links to the vehicle’s documents. Documents show the invoice number and a link to the source email. The date basis is explicitly invoice date, as requested; it is not inferred from email arrival, first registration, payment due date or capture time.

Only a PDF categorised as invoice and attached to that exact internal vehicle ID can prove the date. Privileged writes validate a complete ISO calendar date, preserve source email metadata, reject conflicting evidence and record an audit event. Repeating the same import is idempotent. The private invoice and purchase fields are excluded from public vehicle projections and AI inputs.

The trusted CLI `tools/import-purchase-invoices.php` accepts a private, locally verified manifest after the PDF has been uploaded through the authenticated ERP form. Each entry contains VIN, full date, invoice number, SHA256, mailbox and Gmail message ID. CLI checks active VIN, invoice classification, ownership and original-file digest before recording evidence. It cannot run over HTTP. Human/agent PDF inspection must verify the invoice date, seller, buyer and VIN before the manifest is created.

This implements an explicit mailbox-assisted import, not a recurring mail synchronisation or a stored Gmail credential on the web server. Unknown dates remain empty.
