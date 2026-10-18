# Recoverable vehicle deletion

Only an enabled ERP owner can delete or restore an entity. Website publishers do not gain delete rights. ERP POST actions require the existing CSRF session and a matching full VIN for deletion. No irreversible file/database purge is exposed.

The `deleted_drafts` tombstone table hides a car from working registries, draft details/JSON/assets, public catalogue and Telegram material links. A delete transaction clears the public snapshot, cancels queued generation jobs and records the personal actor. An already-running external request cannot be recalled; its result remains private. Re-capture of a deleted VIN fails until an owner explicitly restores it.

The owner’s Fleet Management sidebar contains Trash. Restore retains the same VIN, internal ID, source snapshots, documents and media. It clears the tombstone but does not republish the car or restart cancelled jobs. Existing external Telegram posts cannot be erased by this operation; new requests for their materials are unavailable while deleted.

Tests use an isolated SQLite store and fixture media. No production vehicle is deleted merely to test the feature.
