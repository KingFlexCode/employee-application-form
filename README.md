# Avian Employee Employment History Form

A standalone secure employment-history and identity-document form for Avian Driving School. It supports both instructor identities and non-instructor permanent Platform staff profiles through one role-aware invitation flow.

## Current workflow

1. Authorized Office staff generate a one-time employment invitation from the Avian Platform.
2. The invitation is linked to exactly one permanent employee identity:
   - instructors -> permanent `instructor_directory.id`;
   - non-instructors -> permanent `staff_profiles.id`.
3. The employee opens this site with the `?invite=...` token.
4. The form resolves the invitation through the role-aware `platform-employment-form` Edge Function.
5. Instructor invitations require the employee's full 9-digit CID and Driver License.
6. Non-instructor invitations do not invent or require an instructor CID and may allow Driver License or State ID according to the backend invitation contract.
7. The employee submits personal information, previous five-year employment history, SSN, and the permitted identity document.
8. The Edge Function stores the identity image privately and calls the matching service-role-only transactional RPC.
9. The application is linked to the existing permanent employee profile and becomes available for authorized Office review.
10. Reused, expired, revoked, or already-completed invitations are rejected.

## Security boundaries

- The browser never receives a Supabase service-role key.
- The browser does not receive direct table access to employment, SSN, invite-token, staff, or identity-document records.
- Identity documents are stored in the private `employment-identity-documents` bucket.
- Full SSN data remains separated from normal staff-profile reads.
- Office profile screens receive only safe summaries by default; private document access uses short-lived signed URLs.
- The public form follows the backend's `requiresCid` and `allowedDocumentTypes` response instead of deciding authorization rules itself.

## Form data

The form collects legal name, SSN, email, phone, home address, and complete previous employment history covering the past five years. Up to 20 previous employers are supported.

For instructors, a valid 9-digit CID is required. For non-instructor Platform staff, CID is not required.

Identity-document rules are invitation-driven:
- Instructor: Driver License only.
- Non-instructor staff: Driver License or State ID when returned by the backend.
- Front image only.
- JPEG, PNG, or WebP.
- Maximum 8 MB.

## Backend endpoint

`https://ciuulgbytouiafzecqku.supabase.co/functions/v1/platform-employment-form`

Invite resolution uses JSON. Completed submissions use `multipart/form-data` with a JSON `payload` part plus the identity-document file.

## Netlify deployment

This is a static site with no build command.

- Build command: leave blank
- Publish directory: `.`

A valid link is:

`https://your-site.netlify.app/?invite=<secure-token>`

Opening the site without a valid invitation token intentionally leaves the form unavailable.

## Platform integration

This form is the public counterpart to EST-147's generalized Platform employment identity model. It does not create a second permanent employee database and does not create fake instructor identities for secretaries, managers, supervisors, admins, escorts, resources, or other non-instructor staff.
