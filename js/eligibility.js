// eligibility.js
// Rule-based loan eligibility checker + save applicant to localStorage

function checkLoanEligibility() {
  const applicantName = document.getElementById("applicantName").value.trim();
  const city = document.getElementById("city").value.trim();
  const income = Number(document.getElementById("income").value);
  const creditScore = Number(document.getElementById("creditScore").value);
  const loanAmount = Number(document.getElementById("loanAmount").value);
  const yearsEmployed = Number(document.getElementById("yearsEmployed").value);
  const points = Number(document.getElementById("points").value);

  const resultBox = document.getElementById("eligibilityResult");

  // Validate inputs
  if (
    !applicantName ||
    !city ||
    !income ||
    !creditScore ||
    !loanAmount ||
    !yearsEmployed ||
    !points
  ) {
    resultBox.innerHTML = `
      <strong style="color:#fca5a5;">Please fill all fields</strong>
      <p class="muted">Name, city, and all applicant details are required.</p>
    `;
    return;
  }

  let isApproved = false;
  let reasons = [];

  // Rule checks
  if (creditScore >= 650) {
    reasons.push("Good credit score");
  } else {
    reasons.push("Credit score is below 650");
  }

  if (income >= 30000) {
    reasons.push("Income is sufficient");
  } else {
    reasons.push("Income is below 30,000");
  }

  if (yearsEmployed >= 2) {
    reasons.push("Stable employment history");
  } else {
    reasons.push("Employment history is less than 2 years");
  }

  if (points >= 60) {
    reasons.push("Points are acceptable");
  } else {
    reasons.push("Points are below 60");
  }

  if (
    creditScore >= 650 &&
    income >= 30000 &&
    yearsEmployed >= 2 &&
    points >= 60
  ) {
    isApproved = true;
  }

  // Create applicant object with REAL name + city
  const newApplicant = {
    name: applicantName,
    city: city,
    income: income,
    credit_score: creditScore,
    loan_amount: loanAmount,
    years_employed: yearsEmployed,
    points: points,
    loan_approved: isApproved
  };

  // Load existing saved applicants
  const savedApplicants =
    JSON.parse(localStorage.getItem("loanApplicants")) || [];

  // Add new applicant
  savedApplicants.push(newApplicant);

  // Save back to localStorage
  localStorage.setItem("loanApplicants", JSON.stringify(savedApplicants));

  resultBox.innerHTML = `
    <strong style="color:${isApproved ? '#86efac' : '#fca5a5'};">
      ${isApproved ? "Approved" : "Rejected"}
    </strong>
    <p class="muted" style="margin: 10px 0 14px;">
      ${applicantName} from ${city} has been added to the dataset.
    </p>
    <ul>
      ${reasons.map(reason => `<li>${reason}</li>`).join("")}
    </ul>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const checkBtn = document.getElementById("checkEligibilityBtn");
  if (checkBtn) {
    checkBtn.addEventListener("click", checkLoanEligibility);
  }
});
