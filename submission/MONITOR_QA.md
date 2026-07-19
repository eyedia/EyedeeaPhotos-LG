# Monitor LG Seller Lounge QA

After App Submission → **Submit**, track review here.

## Status log

| Date | Status in Seller Lounge | Notes / action |
|------|-------------------------|----------------|
| 2026-07-19 | Packet ready | IPK 1.0.3, screenshots, xlsx, pptx prepared in repo. Awaiting QA credentials fill + Submit click. |
| | Submitted | |
| | In QA | |
| | Changes requested | |
| | Approved | |
| | Live / published | |

## If QA rejects or requests changes

1. Read the rejection reason in Seller Lounge (exact wording).
2. Map to app code, assets, or Test Info:
   - Activation / login → check QA account subscription + photos
   - Remote keys → [QA_CHECKLIST.md](./QA_CHECKLIST.md) + `src/hooks/useWebOSRemote.js`
   - Icon size → re-upload `icon-400.jpg`, clear 80×80 auto-import
   - Crash / memory → reproduce on Cloud Test Lab or physical TV
3. Fix, bump version in `appinfo.json` + `package.json` if binary changes.
4. Rebuild: `npm run package:webos`
5. Re-upload binary / assets / Test Info as required and resubmit.
6. Log the new status in the table above.

## After approval (optional Cloud repo)

See [SUBMISSION_GUIDE.md](./SUBMISSION_GUIDE.md) §8:

- Store link in Cloud `config/base.json`
- LG card on `/apps`
- `lg_webos` analytics caller

## Check cadence

- First 48 hours: check Seller Lounge once per day
- After “In QA”: check every 1–2 days until result
- Reply to LG within their stated deadline if they ask questions
