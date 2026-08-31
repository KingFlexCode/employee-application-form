const API_URL = "https://ciuulgbytouiafzecqku.supabase.co/functions/v1/instructor-employment-form-v2";
const MAX_EXPERIENCE_ENTRIES = 20;
const MAX_IDENTITY_DOCUMENT_BYTES = 8 * 1024 * 1024;
const ALLOWED_IDENTITY_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const states = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"],
  ["DC", "District of Columbia"], ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"],
  ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"],
  ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"],
  ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"],
  ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"],
  ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"],
  ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"],
  ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"],
  ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"],
  ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"],
  ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"]
];

const form = document.getElementById("employment-form");
const experienceList = document.getElementById("experience-list");
const addButton = document.getElementById("add-experience");
const limitMessage = document.getElementById("experience-limit");
const submitButton = document.getElementById("submit-button");
const statusMessage = document.getElementById("form-status");
const cidInput = document.getElementById("cid-number");
const ssnInput = document.getElementById("social-security-number");
const identityDocumentInput = document.getElementById("identity-document");
const identityDocumentSelected = document.getElementById("identity-document-selected");
const inviteToken = new URLSearchParams(window.location.search).get("invite")?.trim() || "";
const inviteStatus = document.createElement("div");

inviteStatus.className = "invite-status";
inviteStatus.setAttribute("role", "status");
inviteStatus.setAttribute("aria-live", "polite");
form.before(inviteStatus);
form.classList.add("is-hidden");

function digitsOnly(value, maxLength) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function formatSsn(value) {
  const digits = digitsOnly(value, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function setInviteStatus(message, type = "info") {
  inviteStatus.textContent = message;
  inviteStatus.className = `invite-status ${type}`;
}

async function readJsonResponse(response) {
  let data = null;
  try {
    data = await response.json();
  } catch {
    // A generic error below handles non-JSON responses.
  }

  if (!response.ok || !data?.ok) {
    const error = new Error(data?.error || "The employment form service is temporarily unavailable. Please try again.");
    error.status = response.status;
    throw error;
  }

  return data;
}

async function callEmploymentApi(payload) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return readJsonResponse(response);
}

async function submitEmploymentApplication(payload, identityDocument) {
  const requestBody = new FormData();
  requestBody.append("payload", JSON.stringify(payload));
  requestBody.append("identity_document", identityDocument, identityDocument.name);

  const response = await fetch(API_URL, {
    method: "POST",
    body: requestBody
  });

  return readJsonResponse(response);
}

function populateStateSelect(select) {
  if (!select || select.options.length > 1) return;

  states.forEach(([abbr, name]) => {
    const option = document.createElement("option");
    option.value = abbr;
    option.textContent = `${abbr} — ${name}`;
    select.appendChild(option);
  });
}

function populateStateSelects() {
  document.querySelectorAll('select[name$="_state"]').forEach(populateStateSelect);
}

function setEndDateMax(input) {
  if (input) input.max = new Date().toISOString().slice(0, 10);
}

function setCardActive(card, active) {
  card.classList.toggle("is-hidden", !active);
  card.setAttribute("aria-hidden", String(!active));

  card.querySelectorAll("input, select").forEach((control) => {
    control.disabled = !active;
    control.required = active;
  });

  if (!active) {
    card.querySelectorAll("input, select").forEach((control) => {
      control.value = "";
      control.required = false;
    });
  }
}

function createExperienceCard(number) {
  const card = document.createElement("section");
  card.className = "experience-card";
  card.dataset.experience = String(number);
  card.innerHTML = `
    <div class="experience-heading">
      <h2>Employment Experience ${number}</h2>
      <button class="remove-button" type="button" data-remove="${number}">Remove</button>
    </div>
    <div class="fields-grid">
      <div class="field"><label for="business-name-${number}">Business Name <span class="required">*</span></label><input id="business-name-${number}" name="experience_${number}_business_name" type="text" required /></div>
      <div class="field"><label for="job-title-${number}">Job Title / Description <span class="required">*</span></label><input id="job-title-${number}" name="experience_${number}_job_title" type="text" required /></div>
      <div class="field"><label for="start-date-${number}">Start Date <span class="required">*</span></label><input id="start-date-${number}" name="experience_${number}_start_date" type="date" required /></div>
      <div class="field"><label for="end-date-${number}">End Date <span class="required">*</span></label><input id="end-date-${number}" name="experience_${number}_end_date" type="date" required /></div>
      <div class="field full-width"><label for="reason-leaving-${number}">Reason for Leaving <span class="required">*</span></label><input id="reason-leaving-${number}" name="experience_${number}_reason_for_leaving" type="text" required /></div>
      <div class="field full-width"><label for="street-${number}">Business Street Address <span class="required">*</span></label><input id="street-${number}" name="experience_${number}_business_street_address" type="text" required /></div>
      <div class="field"><label for="city-${number}">City <span class="required">*</span></label><input id="city-${number}" name="experience_${number}_city" type="text" required /></div>
      <div class="field"><label for="state-${number}">State <span class="required">*</span></label><select id="state-${number}" name="experience_${number}_state" required><option value="">Select state</option></select></div>
      <div class="field"><label for="zip-${number}">5-Digit ZIP Code <span class="required">*</span></label><input id="zip-${number}" name="experience_${number}_zip" type="text" inputmode="numeric" maxlength="5" pattern="[0-9]{5}" placeholder="00000" required /></div>
    </div>`;

  experienceList.appendChild(card);
  populateStateSelect(card.querySelector('select[name$="_state"]'));
  setEndDateMax(card.querySelector('input[name$="_end_date"]'));
  return card;
}

function getNextExperienceCard() {
  const hiddenCard = experienceList.querySelector('.experience-card.is-hidden[data-experience]');
  if (hiddenCard) return hiddenCard;

  const cards = Array.from(experienceList.querySelectorAll('.experience-card[data-experience]'));
  if (cards.length >= MAX_EXPERIENCE_ENTRIES) return null;

  const nextNumber = cards.reduce((max, card) => Math.max(max, Number(card.dataset.experience) || 0), 0) + 1;
  return createExperienceCard(nextNumber);
}

function refreshAddButton() {
  const hiddenCard = experienceList.querySelector('.experience-card.is-hidden[data-experience]');
  const cardCount = experienceList.querySelectorAll('.experience-card[data-experience]').length;
  const atLimit = !hiddenCard && cardCount >= MAX_EXPERIENCE_ENTRIES;

  addButton.disabled = atLimit;
  addButton.classList.toggle("is-hidden", atLimit);
  limitMessage.classList.toggle("is-hidden", !atLimit);
  limitMessage.textContent = `Maximum of ${MAX_EXPERIENCE_ENTRIES} employment entries reached. If more are needed to cover the past 5 years, contact the office.`;
}

function collectEmploymentHistory() {
  return Array.from(experienceList.querySelectorAll('.experience-card[data-experience]:not(.is-hidden)')).map((card) => {
    const number = card.dataset.experience;
    const value = (field) => form.elements[`experience_${number}_${field}`]?.value?.trim() || "";

    return {
      business_name: value("business_name"),
      job_title: value("job_title"),
      start_date: value("start_date"),
      end_date: value("end_date"),
      reason_for_leaving: value("reason_for_leaving"),
      business_street_address: value("business_street_address"),
      city: value("city"),
      state: value("state"),
      zip_code: value("zip")
    };
  });
}

function validateIdentityDocument() {
  const file = identityDocumentInput.files?.[0] || null;

  if (!file) {
    identityDocumentInput.setCustomValidity("Upload a clear image of the front of your driver license.");
    throw new Error("Upload a clear image of the front of your driver license.");
  }

  if (!ALLOWED_IDENTITY_MIME_TYPES.has(file.type)) {
    identityDocumentInput.setCustomValidity("Upload a JPEG, PNG, or WebP image.");
    throw new Error("Upload a JPEG, PNG, or WebP image of your driver license.");
  }

  if (file.size <= 0 || file.size > MAX_IDENTITY_DOCUMENT_BYTES) {
    identityDocumentInput.setCustomValidity("Driver license image must be 8 MB or smaller.");
    throw new Error("Driver license image must be 8 MB or smaller.");
  }

  identityDocumentInput.setCustomValidity("");
  return file;
}

function buildSubmissionPayload() {
  const formData = new FormData(form);

  return {
    action: "submit",
    token: inviteToken,
    employee_role: "instructor",
    document_type: "driver_license",
    first_name: String(formData.get("first_name") || "").trim(),
    middle_name: String(formData.get("middle_name") || "").trim(),
    last_name: String(formData.get("last_name") || "").trim(),
    cid: String(formData.get("cid_number") || "").trim(),
    ssn: String(formData.get("social_security_number") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("employee_phone") || "").trim(),
    street_address: String(formData.get("employee_street_address") || "").trim(),
    address_line_2: String(formData.get("employee_address_line_2") || "").trim(),
    city: String(formData.get("employee_city") || "").trim(),
    state: String(formData.get("employee_state") || "").trim(),
    zip_code: String(formData.get("employee_zip") || "").trim(),
    employment_history: collectEmploymentHistory()
  };
}

async function resolveInvite() {
  if (!/^[0-9a-f]{64}$/i.test(inviteToken)) {
    setInviteStatus("This secure employment form link is incomplete or invalid. Please contact the Avian office for a new link.", "error");
    return;
  }

  setInviteStatus("Verifying your secure employment form link…", "info");

  try {
    const data = await callEmploymentApi({ action: "resolve", token: inviteToken });

    if (data.status === "already_submitted") {
      setInviteStatus("Your employment information has already been submitted. Please contact the Avian office if a correction is needed.", "success");
      return;
    }

    if (data.status !== "open") {
      setInviteStatus("This employment form is not available. Please contact the Avian office.", "error");
      return;
    }

    const cidHint = data.cidLast4 ? ` CID ending in ${data.cidLast4}.` : "";
    setInviteStatus(`Secure employment form for ${data.instructorName}.${cidHint} Enter your full 9-digit CID below to confirm your identity.`, "success");
    form.classList.remove("is-hidden");
  } catch (error) {
    setInviteStatus(error.message, error.status === 409 ? "success" : "error");
  }
}

addButton.addEventListener("click", () => {
  const nextCard = getNextExperienceCard();
  if (!nextCard) return;

  if (nextCard.classList.contains("is-hidden")) setCardActive(nextCard, true);
  refreshAddButton();
  nextCard.scrollIntoView({ behavior: "smooth", block: "start" });
});

experienceList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove]");
  if (!button) return;

  const number = Number(button.dataset.remove);
  const card = experienceList.querySelector(`[data-experience="${number}"]`);
  if (!card) return;

  if (number <= 5) setCardActive(card, false);
  else card.remove();

  refreshAddButton();
});

cidInput.addEventListener("input", () => {
  cidInput.value = digitsOnly(cidInput.value, 9);
});

ssnInput.addEventListener("input", () => {
  ssnInput.value = formatSsn(ssnInput.value);
});

identityDocumentInput.addEventListener("change", () => {
  identityDocumentInput.setCustomValidity("");
  const file = identityDocumentInput.files?.[0] || null;

  if (!file) {
    identityDocumentSelected.textContent = "No file selected.";
    return;
  }

  try {
    validateIdentityDocument();
    identityDocumentSelected.textContent = `${file.name} · ${formatFileSize(file.size)}`;
    identityDocumentSelected.className = "identity-file-selected success";
  } catch (error) {
    identityDocumentSelected.textContent = error.message;
    identityDocumentSelected.className = "identity-file-selected error";
  }
});

document.querySelectorAll('input[name$="_end_date"]').forEach(setEndDateMax);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusMessage.textContent = "";
  statusMessage.className = "form-status";

  let identityDocument;
  try {
    identityDocument = validateIdentityDocument();
  } catch (error) {
    statusMessage.textContent = error.message;
    statusMessage.classList.add("error");
    identityDocumentInput.reportValidity();
    return;
  }

  if (!form.reportValidity()) return;

  submitButton.disabled = true;
  submitButton.textContent = "Submitting securely...";

  try {
    await submitEmploymentApplication(buildSubmissionPayload(), identityDocument);

    statusMessage.textContent = "Thank you. Your employment information and driver license were submitted successfully.";
    statusMessage.classList.add("success");
    setInviteStatus("Submission complete. Your employment information and driver license are now connected to your Avian instructor profile for Office review.", "success");
    form.reset();
    identityDocumentSelected.textContent = "No file selected.";
    identityDocumentSelected.className = "identity-file-selected";
    form.classList.add("is-hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    statusMessage.textContent = error.message;
    statusMessage.classList.add("error");

    if (error.status === 409) {
      setInviteStatus("Your employment information has already been submitted. Please contact the Avian office if a correction is needed.", "success");
      form.classList.add("is-hidden");
    }
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Employment Information";
  }
});

populateStateSelects();
refreshAddButton();
resolveInvite();
