const PLATFORM_API_URL = "https://ciuulgbytouiafzecqku.supabase.co/functions/v1/platform-employment-form";
const INSTRUCTOR_API_URL = "https://ciuulgbytouiafzecqku.supabase.co/functions/v1/instructor-employment-form-v2";
let activeApiUrl = INSTRUCTOR_API_URL;
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
const identityDocumentHeading = document.getElementById("identity-document-heading");
const identityDocumentDescription = document.getElementById("identity-document-description");
const identityDocumentLabel = document.getElementById("identity-document-label");
const identityDocumentType = document.getElementById("identity-document-type");
const cidField = document.getElementById("cid-field");
const cidHelp = document.getElementById("cid-help");
const inviteToken = new URLSearchParams(window.location.search).get("invite")?.trim() || "";
const inviteStatus = document.createElement("div");
let inviteContext = {
  employeeName: "",
  employeeRole: "instructor",
  requiresCid: true,
  identityDocumentRequirement: {
    allowedDocumentTypes: ["driver_license"],
    defaultDocumentType: "driver_license"
  }
};

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

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return response;
}

async function callEmploymentApi(payload) {
  // The unified Platform endpoint is staged but not deployed yet. Use the
  // production instructor endpoint for instructor review so browser CORS
  // preflight does not fail against a missing function. Once the unified
  // endpoint is deployed, this can become the primary route.
  let response = await postJson(INSTRUCTOR_API_URL, payload);
  activeApiUrl = INSTRUCTOR_API_URL;

  if (response.status === 404) {
    response = await postJson(PLATFORM_API_URL, payload);
    activeApiUrl = PLATFORM_API_URL;
  }

  return readJsonResponse(response);
}

async function submitEmploymentApplication(payload, identityDocument) {
  const requestBody = new FormData();
  requestBody.append("payload", JSON.stringify(payload));
  requestBody.append("identity_document", identityDocument, identityDocument.name);

  const response = await fetch(activeApiUrl, {
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

function todayIsoDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function setEndDateMax(input) {
  if (input) input.max = todayIsoDate();
}

function setCurrentEmploymentState(card, currentlyEmployed) {
  if (!card) return;

  const endDate = card.querySelector('input[name$="_end_date"]');
  const reason = card.querySelector('input[name$="_reason_for_leaving"]');
  const note = card.querySelector(".current-employment-note");

  if (endDate) {
    endDate.disabled = currentlyEmployed;
    endDate.required = !currentlyEmployed;
    if (currentlyEmployed) endDate.value = "";
  }

  if (reason) {
    reason.disabled = currentlyEmployed;
    reason.required = !currentlyEmployed;
    if (currentlyEmployed) reason.value = "Still employed here";
    else if (reason.value === "Still employed here") reason.value = "";
  }

  note?.classList.toggle("is-hidden", !currentlyEmployed);
}

function setCardActive(card, active) {
  card.classList.toggle("is-hidden", !active);
  card.setAttribute("aria-hidden", String(!active));

  card.querySelectorAll("input, select").forEach((control) => {
    control.disabled = !active;
    control.required = active && control.type !== "checkbox";
  });

  if (!active) {
    card.querySelectorAll("input, select").forEach((control) => {
      control.value = "";
      if (control.type === "checkbox") control.checked = false;
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
      <div class="field end-date-field">
        <label for="end-date-${number}">End Date <span class="required">*</span></label>
        <input id="end-date-${number}" name="experience_${number}_end_date" type="date" required />
        <label class="checkbox-row current-employment-check" for="currently-employed-${number}">
          <input id="currently-employed-${number}" name="experience_${number}_currently_employed" type="checkbox" class="currently-employed-checkbox" />
          <span>I currently work here</span>
        </label>
        <span class="field-help current-employment-note is-hidden">End date will be recorded as <strong>Present</strong>.</span>
      </div>
      <div class="field full-width"><label for="reason-leaving-${number}">Reason for Leaving / Current Status <span class="required">*</span></label><input id="reason-leaving-${number}" name="experience_${number}_reason_for_leaving" type="text" required /><span class="field-help">If you still work here, check “I currently work here” above. This field will automatically show “Still employed here.”</span></div>
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

    const currentlyEmployed = Boolean(form.elements[`experience_${number}_currently_employed`]?.checked);

    return {
      business_name: value("business_name"),
      job_title: value("job_title"),
      start_date: value("start_date"),
      end_date: currentlyEmployed ? todayIsoDate() : value("end_date"),
      currently_employed: currentlyEmployed,
      reason_for_leaving: currentlyEmployed ? "Still employed here" : value("reason_for_leaving"),
      business_street_address: value("business_street_address"),
      city: value("city"),
      state: value("state"),
      zip_code: value("zip")
    };
  });
}

function documentTypeLabel(value) {
  return value === "state_id" ? "State ID" : "Driver License";
}

function formatEmployeeRole(value) {
  return String(value || "employee")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function configureInvite(data) {
  const requirement = data.identityDocumentRequirement || {};
  const resolvedRole = String(
    data.employeeRole
    || requirement.employeeRole
    || (data.instructorName ? "instructor" : "other")
  ).trim().toLowerCase();
  const isInstructor = resolvedRole === "instructor";

  inviteContext = {
    employeeName: String(data.employeeName || data.instructorName || ""),
    employeeRole: resolvedRole,
    requiresCid: typeof data.requiresCid === "boolean" ? data.requiresCid : isInstructor,
    identityDocumentRequirement: {
      ...requirement,
      allowedDocumentTypes: Array.isArray(requirement.allowedDocumentTypes) && requirement.allowedDocumentTypes.length
        ? requirement.allowedDocumentTypes
        : requirement.documentType
          ? [requirement.documentType]
          : isInstructor
            ? ["driver_license"]
            : ["driver_license", "state_id"],
      defaultDocumentType: requirement.defaultDocumentType || requirement.documentType || (isInstructor ? "driver_license" : "driver_license")
    }
  };

  const normalizedRequirement = inviteContext.identityDocumentRequirement;
  const allowedTypes = Array.isArray(normalizedRequirement.allowedDocumentTypes) && normalizedRequirement.allowedDocumentTypes.length
    ? normalizedRequirement.allowedDocumentTypes
    : ["driver_license"];
  const defaultType = allowedTypes.includes(normalizedRequirement.defaultDocumentType)
    ? normalizedRequirement.defaultDocumentType
    : allowedTypes[0];

  identityDocumentType.innerHTML = "";
  allowedTypes.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = documentTypeLabel(value);
    identityDocumentType.appendChild(option);
  });
  identityDocumentType.value = defaultType;

  cidField.classList.toggle("is-hidden", !inviteContext.requiresCid);
  cidInput.required = inviteContext.requiresCid;
  cidInput.disabled = !inviteContext.requiresCid;
  if (!inviteContext.requiresCid) cidInput.value = "";

  cidHelp.textContent = inviteContext.requiresCid
    ? "Important: Your 9-digit CID is required to verify this instructor invitation."
    : "CID is not required for this staff employment invitation.";

  const roleLabel = formatEmployeeRole(inviteContext.employeeRole);
  const selectedLabel = documentTypeLabel(defaultType);
  identityDocumentHeading.textContent = "Identity Document";
  identityDocumentDescription.innerHTML = inviteContext.employeeRole === "instructor"
    ? "Upload a clear photo of the <strong>front of your driver license</strong>. The document is stored privately and reviewed by authorized Avian office staff."
    : `Upload a clear photo of the <strong>front of your selected identity document</strong> for this ${roleLabel} employment record. The document is stored privately and reviewed by authorized Avian office staff.`;
  identityDocumentLabel.textContent = `${selectedLabel} — Front`;
}

function validateIdentityDocument() {
  const file = identityDocumentInput.files?.[0] || null;
  const selectedType = identityDocumentType.value || inviteContext.identityDocumentRequirement?.defaultDocumentType || "driver_license";
  const selectedLabel = documentTypeLabel(selectedType);
  const allowedTypes = inviteContext.identityDocumentRequirement?.allowedDocumentTypes || ["driver_license"];

  if (!allowedTypes.includes(selectedType)) {
    identityDocumentType.setCustomValidity("Select an identity document allowed for this invitation.");
    throw new Error("Select an identity document allowed for this invitation.");
  }
  identityDocumentType.setCustomValidity("");

  if (!file) {
    identityDocumentInput.setCustomValidity(`Upload a clear image of the front of your ${selectedLabel.toLowerCase()}.`);
    throw new Error(`Upload a clear image of the front of your ${selectedLabel.toLowerCase()}.`);
  }

  if (!ALLOWED_IDENTITY_MIME_TYPES.has(file.type)) {
    identityDocumentInput.setCustomValidity("Upload a JPEG, PNG, or WebP image.");
    throw new Error(`Upload a JPEG, PNG, or WebP image of your ${selectedLabel.toLowerCase()}.`);
  }

  if (file.size <= 0 || file.size > MAX_IDENTITY_DOCUMENT_BYTES) {
    identityDocumentInput.setCustomValidity("Identity document image must be 8 MB or smaller.");
    throw new Error("Identity document image must be 8 MB or smaller.");
  }

  identityDocumentInput.setCustomValidity("");
  return file;
}

function buildSubmissionPayload() {
  const formData = new FormData(form);

  return {
    action: "submit",
    token: inviteToken,
    employee_role: inviteContext.employeeRole,
    document_type: identityDocumentType.value || inviteContext.identityDocumentRequirement?.defaultDocumentType || "driver_license",
    first_name: String(formData.get("first_name") || "").trim(),
    middle_name: String(formData.get("middle_name") || "").trim(),
    last_name: String(formData.get("last_name") || "").trim(),
    cid: inviteContext.requiresCid ? String(formData.get("cid_number") || "").trim() : "",
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

    configureInvite(data);
    const roleLabel = formatEmployeeRole(data.employeeRole);
    const cidHint = data.requiresCid && data.cidLast4 ? ` CID ending in ${data.cidLast4}.` : "";
    const cidInstruction = data.requiresCid ? " Enter your full 9-digit CID below to confirm your identity." : "";
    setInviteStatus(`Secure employment form for ${data.employeeName} · ${roleLabel}.${cidHint}${cidInstruction}`, "success");
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

experienceList.addEventListener("change", (event) => {
  const checkbox = event.target.closest(".currently-employed-checkbox");
  if (!checkbox) return;

  const card = checkbox.closest(".experience-card");
  setCurrentEmploymentState(card, checkbox.checked);
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

identityDocumentType.addEventListener("change", () => {
  identityDocumentType.setCustomValidity("");
  identityDocumentLabel.textContent = `${documentTypeLabel(identityDocumentType.value)} — Front`;
  identityDocumentInput.setCustomValidity("");
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
document.querySelectorAll(".experience-card").forEach((card) => {
  const checkbox = card.querySelector(".currently-employed-checkbox");
  setCurrentEmploymentState(card, Boolean(checkbox?.checked));
});

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

    statusMessage.textContent = "Thank you. Your employment information and identity document were submitted successfully.";
    statusMessage.classList.add("success");
    setInviteStatus("Submission complete. Your employment information and identity document are connected to your permanent Avian staff profile for Office review.", "success");
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
