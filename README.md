# Avian Employee Employment History Form

A simple static HTML/CSS/JavaScript form hosted separately from the Avian staff applications. The public page is designed to be shared with current instructors through a secure one-time invitation link.

## Current workflow

1. Office opens an instructor profile in the Avian Student Record Card app.
2. The instructor must have a unique 9-digit CID.
3. Office generates a secure employment-form invitation link.
4. The instructor opens this standalone form with the `?invite=...` token in the URL.
5. The form verifies the invitation with the Avian Student Record Card Supabase backend.
6. The instructor enters their full 9-digit CID to confirm the invitation belongs to them.
7. The completed form is submitted directly to the controlled Supabase Edge Function.
8. Supabase attaches the submission to the permanent instructor directory profile.
9. The invitation becomes used and the database prevents a second completed application for the same instructor.

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

The current prototype supports up to 5 structured previous-employer records.

## Secure submission

The browser submits JSON to:

`https://ciuulgbytouiafzecqku.supabase.co/functions/v1/instructor-employment-form`

The public browser does **not** receive a Supabase service-role key and does not receive direct access to the instructor directory or employment tables. The high-entropy invitation token and matching instructor CID are verified by the backend before a submission is accepted.

Full Social Security Number data is stored separately from the normal instructor-profile data. The standard Office instructor profile only receives the last four digits for confirmation. Do not enable ordinary email notifications for completed forms.

## Deploy on Netlify

This repository can be deployed as a static site with no build command.

- Build command: leave blank
- Publish directory: `.`

After deployment, use the Netlify site URL as the **Public employment form URL** in the instructor profile. Avian then appends the one-time invitation token automatically.

A valid shared link looks like:

`https://your-site.netlify.app/?invite=<secure-token>`

Opening the site without a valid invitation token intentionally prevents the form from being used.

## Netlify Forms

The older prototype markup still contains Netlify form attributes for compatibility, but JavaScript intercepts the submit event and sends the completed form directly to the Avian Supabase Edge Function. Netlify Forms is not the source of truth and email form notifications should remain disabled because the form contains sensitive employee information.

## Future Avian Platform integration

The Student Record Card app is the current source of truth for instructor employment submissions because it already owns the permanent instructor directory. EST-147 tracks the later general Employee model for instructors, secretaries, managers, supervisors, and other staff when this functionality is consolidated into the larger Avian Platform.
