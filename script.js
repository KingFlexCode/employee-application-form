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

const MAX_EXPERIENCE_ENTRIES = 5;
const form = document.getElementById("employment-form");
const experienceList = document.getElementById("experience-list");
const addButton = document.getElementById("add-experience");
const limitMessage = document.getElementById("experience-limit");
const submitButton = document.getElementById("submit-button");
const statusMessage = document.getElementById("form-status");
const cidInput = document.getElementById("cid-number");
const ssnInput = document.getElementById("social-security-number");

function digitsOnly(value, maxLength) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function formatSsn(value) {
  const digits = digitsOnly(value, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function updateEmploymentHistoryCopy() {
  const headerIntro = document.querySelector(".form-header .intro");
  if (headerIntro) {
    headerIntro.innerHTML =
      'Please provide your <strong>complete employment history covering the past 5 years</strong>, starting with your current or most recent employer. Include every employer you worked for during that 5-year period. If a job started more than 5 years ago but continued into the last 5 years, enter the actual start date. Fields marked with <span class="required">*</span> are required.';
  }

  if (experienceList && !document.getElementById("employment-history-heading")) {
    const heading = document.createElement("h2");
    heading.id = "employment-history-heading";
    heading.textContent = "Employment History — Past 5 Years";

    const instructions = document.createElement("p");
    instructions.className = "intro";
    instructions.textContent =
      "List every employer needed to cover your employment history for the past 5 years, with the most recent employer first. Use ‘Add Another Employer’ until all employers from that period have been included.";

    experienceList.before(heading, instructions);
  }

  if (limitMessage) {
    limitMessage.textContent =
      `Maximum of ${MAX_EXPERIENCE_ENTRIES} employment entries reached. If more are needed to cover the past 5 years, contact the office.`;
  }

  const certificationText = document.querySelector(".confirmation-check span");
  if (certificationText) {
    certificationText.innerHTML =
      'I certify that I have listed all employers from the past 5 years and that the information provided above is complete and accurate to the best of my knowledge. <span class="required">*</span>';
  }
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

    if (active && !control.classList.contains("current-job-toggle") && control.type !== "checkbox") {
      control.required = true;
    }
  });

  if (!active) {
    card.querySelectorAll("input, select").forEach((control) => {
      if (control.type === "checkbox") control.checked = false;
      else control.value = "";
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

function bindExperienceEvents() {
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

  document.querySelectorAll(".current-job-toggle").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const number = checkbox.dataset.target;
      const endDate = document.getElementById(`end-date-${number}`);
      const reason = document.getElementById(`reason-leaving-${number}`);

      if (checkbox.checked) {
        endDate.value = "";
        endDate.disabled = true;
        endDate.required = false;
        reason.value = "Currently employed";
        reason.disabled = true;
        reason.required = false;
      } else {
        endDate.disabled = false;
        endDate.required = true;
        reason.disabled = false;
        reason.required = true;
        if (reason.value === "Currently employed") reason.value = "";
      }
    });
  });
}

cidInput.addEventListener("input", () => {
  cidInput.value = digitsOnly(cidInput.value, 9);
});

ssnInput.addEventListener("input", () => {
  ssnInput.value = formatSsn(ssnInput.value);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusMessage.textContent = "";
  statusMessage.className = "form-status";

  if (!form.reportValidity()) return;

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";

  try {
    const formData = new FormData(form);
    const response = await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData).toString()
    });

    if (!response.ok) throw new Error("Submission failed");

    statusMessage.textContent = "Thank you. Your employment history was submitted successfully.";
    statusMessage.classList.add("success");
    form.reset();

    document.querySelectorAll('.experience-card[data-experience]:not([data-experience="1"])').forEach((card) => {
      setCardActive(card, false);
    });

    const firstEndDate = document.getElementById("end-date-1");
    const firstReason = document.getElementById("reason-leaving-1");
    firstEndDate.disabled = false;
    firstEndDate.required = true;
    firstReason.disabled = false;
    firstReason.required = true;
    refreshAddButton();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    statusMessage.textContent = "Something went wrong while submitting the form. Please try again.";
    statusMessage.classList.add("error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Employment History";
  }
});

updateEmploymentHistoryCopy();
populateStateSelects();
bindExperienceEvents();
refreshAddButton();
