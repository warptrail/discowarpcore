# Sale and gift departure details

Items now support two optional objects. Missing details on older items mean not recorded; no migration or invented values are needed.

- `saleDetails`: `buyer` (up to 300 characters), `paymentType` (`dollars`, `trade`, or blank), `amountCents` (optional nonnegative safe integer, USD), `tradedFor` (up to 1000 characters).
- `giftDetails`: `recipient` (up to 300 characters), `occasion` (occasion or reason, up to 1000 characters).

Each object has server-controlled `createdAt` and `updatedAt`. The item's `departureDetailsHistory` is a server-owned append-only array of `field`, `at`, `actor`, `changedFields`, `before`, and `after`. Revisions append in the same MongoDB item update as the details. Identical values do not create a new revision; corrections and explicit null clearing retain prior values in history. Generic item PATCH accepts partial details objects on the matching departed item; clients cannot submit timestamps, history or dotted/operator detail updates. The existing persistent event log also records completion details. Item lifecycle timestamps and history remain intact when restored.

Completion POST `/api/declutter-deck/actions/:candidateId/complete` accepts optional `saleDetails` or `giftDetails` with the matching disposition (`sold` or `gifted`). It continues accepting old payloads with no details. Dollar and trade data cannot be mixed, and invalid details are rejected before removal from the box. USD is stored in cents to avoid floating-point storage ambiguity; the popup accepts decimal dollars and converts them. Zero and unknown are distinct.

Mark sold and Mark gifted open the Prism departure popup. Fields remain optional; the final Confirm sold/gifted command completes the physical departure. Cancel/close/Escape guard edited drafts, saving locks dismissal, and failed saves retain input. Declutter history shows the recorded buyer/payment or recipient/reason where present. Trash and donation retain their existing completion behavior.

Verification uses synthetic browser inventory and unit/schema/service tests, without changing household records.
