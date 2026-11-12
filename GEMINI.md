# GEMINI.md

Special instructions and execution tips for Gemini models working on Gardoon:

1. **Persian UX Tone:** Always use clean, polite, contemporary Iranian Persian fintech terminology:
   - Use "صندوق قرض‌الحسنه", "قسط", "گردونه شانس", "رسید واریز", "شماره شبا", "تایید واریز", "کد پیگیری".
   - Avoid literal machine translations.
2. **Deterministic Lucky Draw:**
   - Calculation formula for target wheel stop angle: `total_rotations * 360 + slice_offset_degrees`.
   - The server chooses the winner using `SecureRandom`, persists the result atomically, and emits the draw parameters to the frontend.
3. **No In-App Payment Gateway:** Never introduce IPG (Shaparak) mocks or payment gateway redirections. Everything operates on bilateral external Card-to-Card / Sheba transfers with receipt confirmation.
