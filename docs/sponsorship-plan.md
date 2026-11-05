# Child Sponsorship: proposed schema and structure

Status: **proposal, nothing built yet.** Written after reading the existing code, as the build brief requires.

## 1. What the existing code gives us

| Brief says | What is actually there | Plan |
| --- | --- | --- |
| Next.js App Router, TypeScript, Tailwind, Prisma, Postgres, Auth.js | Confirmed (Next 15.5, Prisma 6, Auth.js v5 beta) | Reuse |
| Roles | `ADMIN`, `EDITOR`, `SPONSORSHIP_COORDINATOR`, plus a `sponsorship` capability that Editors lack | Reuse. Add `sponsorship-admin` (Administrator only) for settings, permanent delete and restore |
| shadcn/ui | **Not installed.** Public site uses `src/components/site/*`, admin uses `src/components/admin/ui.tsx` | Reuse those, so the wizard matches the site exactly. Do not add shadcn |
| Rate limiting and honeypot | In `src/app/actions/public.ts` | Extract into a shared helper |
| Word "orphan" | Not found anywhere in `src`, seed data or docs | Add a test that keeps it that way |
| "Apply for Child Support" links | Point to `/community-support#apply`, a section stored in the database | Links keep working. The section becomes a card linking to the wizard. Production is already seeded, so this needs a one-off content update that respects admin edits |
| Become a sponsor form | `sponsor` form, stored in `Submission` | Add "Convert to sponsor" on the submission |
| Old `child-application` form | Existing form and submissions | Hide the form, keep past submissions readable |

## 2. Problems in the brief, and proposed answers

1. **Private storage does not exist yet.** The S3 bucket described earlier is public by design, so child documents cannot go there. They need a **second, fully private bucket** (`S3_PRIVATE_BUCKET`). Nothing in it is ever public; admins get links valid for about 5 minutes.
2. **10 MB uploads exceed Vercel's 4.5 MB request limit.** Files will upload from the browser straight to the private bucket with a signed, size-limited upload. The server then checks the real file type. This needs CORS on the bucket.
3. **Background jobs and cron depend on the host.** Neither Vercel nor Hostinger runs a permanent worker. Plan: a database `Job` table, processed right after each request and swept by cron through a route protected by `CRON_SECRET`. Vercel's free plan runs cron once a day, so a failed Drive upload would wait until the nightly run. Hostinger has no Vercel Cron and needs an external scheduler calling the same route. Large nightly backups run in resumable batches because functions have time limits.
4. **Permanent delete conflicts with "keep all monthly backups".** A deleted child would stay inside old backup files. Proposal: record each deletion as a tombstone that the restore script applies, delete the child's Drive folder at once, and limit monthly retention to the data retention period set in admin.
5. **Option B with `drive.file` cannot use a folder you choose.** That scope only sees files the app created, so the app must create its own folder and `GOOGLE_DRIVE_BACKUP_FOLDER_ID` only applies to Option A. The Google app must also be published, because refresh tokens in "testing" mode expire after 7 days.
6. **Encrypted columns and backups.** ID numbers and health details are encrypted in the database, so they cannot be searched. The JSON backup keeps them encrypted, so restoring needs `DATA_ENCRYPTION_KEY`. If that key is lost, those fields are gone, so it must be stored safely offline. The Excel backup would show them in readable form, so they are left out of it unless backup encryption is on. Proposal: **backup encryption on by default** (AES-256 zip, opens in 7-Zip).
7. **Browser autosave on shared phones.** IACEC members will fill forms for several families on one phone. Proposal: autosave everything except the national ID number, expire drafts after 7 days, clear on submit, and show a "Clear this form from this phone" button.
8. **Editable fields have limits.** Labels, help text and dropdown choices are editable without code. Adding new fields is not, because answers are stored in real columns.
9. **Test children in production.** The 3 fictional children load only with `npm run db:seed -- --demo`, so they never reach the live dashboard by accident.
10. **Editors must not see children indirectly.** Child files never enter the Media library, and the audit log is separate from `ActivityLog`, which appears on the shared dashboard.
11. **Emails stay minimal.** Staff notifications contain only the reference number and a link, matching what the site does today. Caretaker emails contain no child details beyond the reference.

## 3. Proposed Prisma models

Money is `Int` in FCFA. Dates are UTC. `(enc)` marks an encrypted column.

```prisma
enum ApplicationStatus { NEW CONTACTED VISIT_SCHEDULED VERIFIED ACCEPTED WAITING_LIST NOT_ACCEPTED SPONSORED EXITED }
enum ChildStatus       { LOST_FATHER LOST_MOTHER LOST_BOTH }
enum CompletedBy       { CARETAKER IACEC_MEMBER }
enum ParentRole        { FATHER MOTHER }
enum DocumentType      { BIRTH_CERTIFICATE DEATH_PROOF CARETAKER_ID REPORT_CARD FEES_RECEIPT PASSPORT_PHOTO RECOMMENDATION REFERENCE_ID CHILD_PHOTO VISIT_PHOTO OTHER }
enum VisitType         { HOME SCHOOL PHONE FELLOWSHIP }
enum Wellbeing         { GOOD FAIR CONCERN }
enum VisitFrequency    { WEEKLY MONTHLY QUARTERLY }

model ChildApplication {
  id, reference (unique, IACEC-CS-2026-0001), status, source (ONLINE|PAPER)
  completedBy, helperName?, helperPhone?
  assignedToId? -> User, documentsComplete Bool, photoConsent Bool
  signatureName, signatureDate, signatureDrawnKey?, declarations Json
  exitReason?, decisionReason?, ipHash?, createdAt, updatedAt
  child, caretaker, referral, parents[], references[], careTeam[], school records[], documents[], statusChanges[], notes[]
}
model Child {
  applicationId (unique), fullName, gender, dateOfBirth, placeOfBirth, address, church?
  status ChildStatus, healthNotes? (enc), hobbies?, siblings[], visits[], materialSupport[], sponsorships[]
}
model Parent          { applicationId, role, fullName?, deceased, dateOfDeath?, causeOfDeath?, occupation?, hometown?, certificateAvailable }
model Sibling         { childId, name, age? }
model Caretaker       { applicationId (unique), fullName, relationship, relationshipOther?, livingSince?, phones String[], email?, address, income?, householdSize?, otherChildren?, nationalId (enc), church?, pastorName?, willingMember? }
model FamilyReference { applicationId, position (1|2), fullName, relationship, phone, address?, willing }
model CareTeamMember  { applicationId, position (1|2), fullName, phone, connection?, frequency? }
model Referral        { applicationId (unique), referredBy, relationship? }
model SchoolRecord    { applicationId, schoolYear, term?, school, level, schoolAddress?, headteacherPhone?, feesDue, feesOwed?, results?, currentPayer?, materialNeeds String[], materialOther?, urgentNeeds?, supportReceived? }
model FeePayment      { schoolRecordId, amount, paidAt, paidBy?, receiptDocumentId? }
model MaterialSupport { childId, item, givenAt, value?, givenBy? }
model ApplicationDocument { applicationId, type, storageKey, filename, mimeType, size, verified, verifiedById?, verifiedAt?, uploadedById? }
model Verification    { applicationId (unique), visitDate?, visitedBy?, findings?, documentsVerified, recommendation?, decision?, decisionReason? }
model StatusChange    { applicationId, from?, to, reason?, userId?, emailed, createdAt }
model VisitLog        { childId, date, byName, type, notes?, wellbeing, photos -> ApplicationDocument[] }
model Sponsor         { fullName, phone?, email?, country?, organisation?, status, submissionId? }
model Sponsorship     { sponsorId, childId, startDate, endDate?, feesCommitted?, materialCommitment?, frequency?, status }
model SponsorReport   { sponsorId, childId, term, sentAt? }
model InternalNote    { applicationId, authorId, body, createdAt }
model FieldChange     { applicationId, field, oldValue?, newValue?, userId, createdAt }   // change history; encrypted fields record "changed" only
model AuditLog        { userId?, action, entity, entityId?, ip?, userAgent?, detail Json?, createdAt }   // append-only
model BackupRun       { type (REALTIME|DAILY|MONTHLY|MANUAL), startedAt, finishedAt?, filesUploaded, bytes, status, error? }
model DriveSync       { entity, entityId, driveFileId, checksum?, syncedAt }
model Job             { type, payload Json, attempts, runAt, status, lastError? }          // added: retry queue
model UploadSession   { token, expiresAt, keys String[] }                                  // added: links uploads to a draft before submission
model ReferenceCounter { year (id), last Int }                                             // added: safe sequential numbers
model DeletionTombstone { reference, deletedAt, deletedById }                              // added: see problem 4
model SponsorshipSettings { id = 1, programmeName, targetChildren = 12, recipients String[], fieldOverrides Json, retentionMonths, driveFolderId?, googleRefreshToken? (enc), keepDaily = 30, encryptBackups = true }
```

Added beyond the brief: `FieldChange`, `SponsorReport`, `Job`, `UploadSession`, `ReferenceCounter`, `DeletionTombstone`.

## 4. Folder structure

```
src/
  app/(site)/community-support/register/
    page.tsx                     wizard (takes priority over the catch-all route)
    paper-form.pdf/route.ts      downloadable paper form
  app/admin/(panel)/sponsorship/
    page.tsx                     overview
    applications/                list, new, [id] with tabs
    sponsors/                    list, [id]
    backups/                     run history, Back up now
    settings/                    Administrator only
    _actions/                    server actions
  app/api/sponsorship/
    uploads/route.ts             signed upload for the public form
    files/[id]/route.ts          short-lived link, logged
    export/route.ts              xlsx and csv
    pdf/[id]/route.ts            profile and sponsor report
  app/api/cron/{jobs,backup}/route.ts
  app/api/google/oauth/route.ts
  components/sponsorship/        wizard steps, signature pad, upload field, charts
  lib/sponsorship/
    fields.ts                    single source: wizard, Zod rules, PDF and admin forms
    schema.ts  encryption.ts  audit.ts  storage.ts  reference.ts  workflow.ts  notify.ts
    pdf/  export.ts
  lib/drive/                     client, folders, backup, retention, sync
scripts/restore.ts               npm run restore -- <backup.json.gz>
tests/sponsorship/               wizard, roles, workflow, backup, restore
```

## 5. New packages

`googleapis`, `exceljs`, `pdf-lib`, `recharts`, `@zip.js/zip.js`, `@aws-sdk/s3-presigned-post`, `@aws-sdk/s3-request-presigner`. Non-browser tests run on the existing Playwright runner, so no new test tool is needed.

## 6. Build order, with a working checkpoint after each

| # | Stage | Done when |
| --- | --- | --- |
| 1 | Data model, encryption, audit, permissions, demo seed | Migration applies; Editor is blocked in tests |
| 2 | Public wizard, uploads, reference numbers, emails | Full form submits on a phone-sized screen with files |
| 3 | Admin list and child profile tabs | Coordinator can review and edit a demo child |
| 4 | Workflow, overview charts and alerts, sponsors, settings | Status changes logged; sponsor conversion works |
| 5 | PDFs, Excel and CSV exports, paper form | All files generate correctly |
| 6 | Google Drive sync, nightly and monthly backups, restore | Mocked Drive tests pass, then one real run |
| 7 | Remaining tests, README, ADMIN_GUIDE, privacy section | Full suite and production build pass |

## 7. Needed from IACEC

| Needed | Blocks |
| --- | --- |
| Which host stays live, Vercel or Hostinger | Stage 6 scheduling |
| **Decided: personal Google account (Option B).** A dedicated IACEC account with 2-Step Verification is recommended. Set `GOOGLE_AUTH_MODE=oauth`; the app creates its own backup folder. Option A stays available as the brief requires | Stage 6: needs the account and an OAuth client |
| A private S3 bucket | Testing real uploads in stage 2 |
| Review of consent wording and privacy text by leadership, and a check of Cameroon's data protection rules | Going live with real children |
