const API_URL = "https://ciuulgbytouiafzecqku.supabase.co/functions/v1/instructor-employment-form";

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
const addButton = document.getElementById("add-experience");
const limitMessage = document.getElementById("experience-limit");
const submitButton = document.getElementById("submit-button");
const statusMessage = document.getElementById("form-status");
const cidInput = document.getElementById("cid-number");
const ssnInput = document.getElementById("social-security-number");
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

function setInviteStatus(message, type = "info") {
  inviteStatus.textContent = message;
  inviteStatus.className = `invite-status ${type}`;
}

async function callEmploymentApi(payload) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

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

function populateStateSelects() {
  document.querySelectorAll('select[name$="_state"]').forEach((select) => {
    if (select.options.length > 1) return;

    states.forEach(([abbr, name]) => {
      const option = document.createElement("option");
      option.value = abbr;
      option.textContent = `${abbr} — ${name}`;
      select.appendChild(option);
    });
  });
}

function setCardActive(card, active) {
  card.classList.toggle("is-hidden", !active);
  card.setAttribute("aria-hidden", String(!active));

  card.querySelectorAll("input, select").forEach((control) => {
    if (control.type === "button") return;
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

function refreshAddButton() {
  const hiddenCard = document.querySelector('.experience-card.is-hidden[data-experience]');
  const atLimit = !hiddenCard;
  addButton.disabled = atLimit;
  addButton.classList.toggle("is-hidden", atLimit);
  limitMessage.classList.toggle("is-hidden", !atLimit);
}

function collectEmploymentHistory() {
  return Array.from(document.querySelectorAll('.experience-card[data-experience]:not(.is-hidden)')).map((card) => {
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

function buildSubmissionPayload() {
  const formData = new FormData(form);

  return {
    action: "submit",
    token: inviteToken,
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
  const nextCard = document.querySelector('.experience-card.is-hidden[data-experience]');
  if (!nextCard) return;

  setCardActive(nextCard, true);
  refreshAddButton();
  nextCard.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelectorAll("[data-remove]").forEach((button) => {
  button.addEventListener("click", () => {
    const number = button.dataset.remove;
    const card = document.querySelector(`[data-experience="${number}"]`);
    setCardActive(card, false);
    refreshAddButton();
  });
});

cidInput.addEventListener("input", () => {
  cidInput.value = digitsOnly(cidInput.value, 9);
});

ssnInput.addEventListener("input", () => {
  ssnInput.value = formatSsn(ssnInput.value);
});

document.querySelectorAll('input[name$="_end_date"]').forEach((input) => {
  input.max = new Date().toISOString().slice(0, 10);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusMessage.textContent = "";
  statusMessage.className = "form-status";

  if (!form.reportValidity()) return;

  submitButton.disabled = true;
  submitButton.textContent = "Submitting securely...";

  try {
    await callEmploymentApi(buildSubmissionPayload());

    statusMessage.textContent = "Thank you. Your employment information was submitted successfully.";
    statusMessage.classList.add("success");
    setInviteStatus("Submission complete. Your employment information is now connected to your Avian instructor profile.", "success");
    form.reset();
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
    submitButton.textContent = "Submit Employment History";
  }
});

populateStateSelects();
refreshAddButton();
resolveInvite();
