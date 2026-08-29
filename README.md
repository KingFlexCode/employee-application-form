# Avian Employee Employment History Form

A simple static HTML/CSS/JavaScript form hosted separately from the Avian staff applications. The public page is designed to be shared with current instructors through a secure one-time invitation link.

## Current workflow

1. Office opens an instructor profile in the Avian Student Record Card app.
2. The instructor must have a unique 9-digit CID.
3. Office generates a secure employment-form invitation link.
4. The instructor opens this standalone form with the `?invite=...` token in the URL.
5. The form verifies the invitation with the Avian Student Record Card Supabase backend.
6. The instructor enters their full 9-digit CID to confirm the invitation belongs to them.
7. The instructor uploads a clear image of the front of their driver license.
8. The completed form and driver-license image are submitted to the controlled Supabase Edge Function.
9. Supabase attaches the submission to the permanent instructor directory profile and stores the image in a private Storage bucket.
10. The invitation becomes used and the database prevents a second completed application for the same instructor.
11. Authorized Office staff can review the private driver-license image and mark it Verified or Needs Replacement.

## What the form collects

### Personal Information

- First Name
- Middle Name
- Last Name
- 9-digit CID
- Social Security Number
- Email
- Phone
- Street Address
- Apartment / Unit
- City
- State
- 5-digit ZIP Code

### Previous Employment History — Past 5 Years

The employee must provide complete previous employment history covering the past 5 years, with the most recent previous employer first. Avian Driving School is not included as the current employer.

Each previous employer includes:

- Business Name
- Job Title / Description
- Start Date
- End Date
- Reason for Leaving
- Business Street Address
- City
- State
- 5-digit ZIP Code

The form supports up to 20 previous-employer records so the requirement means **five years of history**, not a five-job limit. If an employee needs more than 20 records to cover the five-year period, they are instructed to contact the office.

### Identity Document

For the current instructor workflow:

- Driver License is required.
- The front image is required.
- Accepted formats: JPEG, PNG, WebP.
- Maximum file size: 8 MB.
- The file is stored in the private `employment-identity-documents` Supabase Storage bucket.
- The normal instructor profile does not expose a permanent public file URL.
- Authorized Office staff receive a short-lived signed URL when they explicitly click **View Driver License**.
- Review status is Pending Review, Verified, or Needs Replacement.

The database model is role-aware so a later general employee form can allow State ID or Driver License for non-instructor staff while keeping Driver License mandatory for instructors.

## Secure submission

The EST-150 branch submits to:

`https://ciuulgbytouiafzecqku.supabase.co/functions/v1/instructor-employment-form-v2`

Invite verification uses JSON. The completed employment submission uses `multipart/form-data` containing the structured form payload plus the driver-license image.

The public browser does **not** receive a Supabase service-role key and does not receive direct access to the instructor directory, employment tables, or private identity-document bucket. The high-entropy invitation token and matching instructor CID are verified by the backend before a submission is accepted.

The Edge Function uploads the identity image to private Storage first and then calls a database RPC that creates the employment application and identity-document metadata in one database transaction. If the database submission fails, the uploaded Storage object is removed.

Full Social Security Number data remains separate from normal instructor-profile data. The standard Office instructor profile only receives the last four digits for confirmation. Do not enable ordinary email notifications for completed forms.

## Deploy on Netlify

This repository is deployed as a static site with no build command.

- Build command: leave blank
- Publish directory: `.`

After deployment, use the Netlify site URL as the **Public employment form URL** in the instructor profile. Avian appends the one-time invitation token automatically.

A valid shared link looks like:

`https://your-site.netlify.app/?invite=<secure-token>`

Opening the site without a valid invitation token intentionally prevents the form from being used.

## Netlify Forms

Netlify is only the static host for this application. The HTML does **not** opt into Netlify Forms, and the completed form is never intentionally posted to Netlify. The page’s JavaScript submits directly to the Avian Supabase Edge Function.

## Future Avian Platform integration

The Student Record Card app is the current source of truth for instructor employment submissions because it already owns the permanent instructor directory. EST-147 tracks the later general Employee model for instructors, secretaries, managers, supervisors, and other staff when this functionality is consolidated into the larger Avian Platform.
