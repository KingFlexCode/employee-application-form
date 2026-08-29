# Employee Employment History Form

A simple static HTML/CSS/JavaScript form designed for Netlify Forms.

## What it does

- Collects employee first name, middle name, last name, CID number, Social Security Number, home address, email, and phone in a dedicated Personal Information section.
- Collects complete **previous** employment history covering the past 5 years, beginning with the employee's most recent previous employer.
- Does not ask for the employee's current Avian Driving School employment and does not include a "currently work here" option.
- Allows up to 5 structured employer entries in the current prototype. If an employee had more than 5 previous employers during the past 5 years, the form instructs them to contact the office so the remaining history can also be collected.
- If a previous employment period began more than 5 years ago but continued into the last 5 years, the employee should enter the actual start date.
- Captures the following for each previous employer:
  - Business Name
  - Job Title / Description
  - Start Date
  - End Date
  - Reason for Leaving
  - Business Street Address
  - City
  - State
  - 5-Digit ZIP Code
- Saves verified submissions in Netlify Forms.
- Supports Netlify form submissions; do not enable ordinary email delivery while the form contains a full Social Security Number field.
- Includes basic bot protection with a honeypot field.

## Deploy on Netlify

1. Sign in to Netlify.
2. Create a new site and deploy this folder, or connect a GitHub repository containing these files.
3. In Netlify, make sure form detection is enabled.
4. After the first deploy, submit one test form.
5. Go to your site's Forms area to confirm `employee-employment-history` is being detected.
6. Because this version contains a full Social Security Number field, do not enable ordinary form-submission email notifications. Use a restricted secure storage/review workflow before collecting real SSNs.

## Google Drive / Word document option

For non-sensitive prototypes, Netlify Forms can be used for testing. Once full SSNs are collected, use a restricted secure storage workflow rather than ordinary email.

If you later want every submission automatically saved to Google Drive, connect the form to an approved secure workflow and create either:

- a Google Docs document for each employee, or
- a Google Sheets row for each submission.

Google Sheets is usually easier to review and search than individual Word documents, but sensitive fields such as full SSNs should not be placed into an ordinary broadly shared Sheet or email workflow.

## Sensitive information note

This form includes a full Social Security Number field. Do **not** rely on ordinary email notifications for completed submissions that contain a full SSN. Before using this form for real employee SSNs, move sensitive-field storage and review to an appropriately secured backend/workflow with restricted access. The standalone Netlify form should be treated as a prototype until that secure handling is in place.
