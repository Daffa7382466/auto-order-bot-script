# 0.2.1 — Rich Message Emoji Fix

- Premium custom emoji IDs are validated at startup with `getCustomEmojiStickers`.
- The bot uses Telegram's returned `sticker.emoji` as the required alternative text instead of guessing from Unicode code points.
- Invalid/unavailable custom emoji IDs are skipped instead of causing `RICH_MESSAGE_EMOJI_INVALID`.
- Rich Message buttons keep native `primary`, `success`, `danger`, and `link` styles.
- Payment confirmation now correctly enters the payment-proof state.
- OS selection now has a Back button.
- Exhibition mode is no longer exposed as customer-facing UI text.
