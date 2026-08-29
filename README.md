# Employee Employment History Form

A simple static HTML/CSS/JavaScript form designed for Netlify Forms.

## What it does

- Collects employee name, email, and phone.
- Collects up to 5 employment-history entries.
- Captures the fields shown in the reference application:
  - Business Name
  - Job Title / Description
  - Start Date
  - End Date
  - Reason for Leaving
  - Business Street Address
  - City
  - State
  - 5-Digit ZIP Code
- Includes a "currently work here" option.
- Saves verified submissions in Netlify Forms.
- Can send each submission to your email using Netlify's form submission notifications.
- Includes basic bot protection with a honeypot field.

## Deploy on Netlify

1. Sign in to Netlify.
2. Create a new site and deploy this repository.
3. In Netlify, make sure form detection is enabled.
4. After the first deploy, submit one test form.
5. Go to your site's Forms area to confirm `employee-employment-history` is being detected.
6. To receive an email for every submission:
   - Open Project configuration.
   - Go to Notifications.
   - Open Emails and webhooks / Form submission notifications.
   - Add an email notification and enter the email address that should receive submissions.

## Google Drive / Word document option

For the quickest launch, use Netlify Forms + email first.

If you later want every submission automatically saved to Google Drive, connect the Netlify form to Zapier or n8n and create either:

- a Google Docs document for each employee, or
- a Google Sheets row for each submission.

Google Sheets is usually easier to review and search than individual Word documents.

## Future Avian Platform integration

This standalone form is intended to be the quick public intake version. The long-term plan is to integrate employee applications directly into the Avian Platform so submissions can be linked to employee profiles for instructors, secretaries, managers, supervisors, and other staff roles.
