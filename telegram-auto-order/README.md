# Telegram Auto Order — Production Core v0.3.0

Continuation of the previous Rich Message V3 build.

## Included in this stage
- Rich Message V3 with custom Premium Emoji validation.
- Header photo configuration via `HEADER_PHOTO`.
- Product catalog: Regular VPS, VPS Legal, Noktel, Script.
- Persistent JSON order/state storage under `data/`.
- Regular VPS and VPS Legal checkout state machine.
- Payment proof → owner review → approve/reject.
- Noktel inventory + `/addnoktel` owner/admin command + post-payment owner handoff buttons.
- Script inventory + `/addscript ...` + ZIP upload into `script_product/`.
- Rating flow 1–5 + feedback to owner and `TRX_CHANNEL_ID`.
- Other utilities using Azbry endpoints: `/fakedana`, `/brat`, `/fakeff`, `/quotesbook`, `/fakerip`.
- Invoice Rich Message archive service and the supplied HTML Canvas templates under `templates/`.

## Important
1. Copy/fill `.env`. Never commit it.
2. All VPS pricing stays in `harga.env` and uses Indonesian dotted format.
3. `MODE=production` is the default. Provider production provisioning still requires real provider API implementation/verification before live use.
4. Install dependencies with `npm install`.
5. Start with `npm start`.

## Owner/Admin
`OWNER_TELEGRAM_ID` is always treated as admin. Additional IDs can be supplied at runtime with:
`ADMIN_TELEGRAM_IDS=123,456`

## Commands
- `/start`
- `/help`
- `/addnoktel [nomor], [nama], [harga], [2FA optional]`
- `/addscript [nama], [deskripsi], [harga], [tutorial optional]` then attach a `.zip` in the next message.
- `/fakedana [duit]`
- `/brat [pesan]`
- `/fakeff [nickname]`
- `/quotesbook [pesan], [author]`
- `/fakerip [nama]`
