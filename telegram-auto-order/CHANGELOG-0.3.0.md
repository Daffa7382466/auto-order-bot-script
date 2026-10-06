# 0.3.0 — Production Core Continuation

- Continued from the previous Rich Message V3 emoji-fix build.
- Removed Nokos from the customer catalog.
- Added persistent JSON storage for orders, ratings, requests, replacements and inventory.
- Added Rating and Other... to `/start`.
- Added Noktel inventory/order flow and owner completion/cancellation actions.
- Added Script catalog, owner ZIP ingestion and delivery after payment approval.
- Added payment owner approval/rejection workflow.
- Added `TRX_CHANNEL_ID` archive support.
- Added supplied invoice/rating HTML templates to `templates/`.
- Added Azbry utility commands.
- Kept `harga.env` as the VPS price source and `.env` for credentials/settings.


## Follow-up
- STAR custom emoji updated to `5431789725838520842`.
- `HEADER_PHOTO` is embedded into the Rich Message as media instead of being sent as a separate photo message.
