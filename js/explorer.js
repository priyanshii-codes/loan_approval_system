// explorer.js
// Handles:
// 1. loading loan data
// 2. explorer filters
// 3. explorer charts
// 4. applicant details modal

let explorerData = [];
let filteredExplorerData = [];

let explorerApprovalChart = null;
let explorerIncomeChart = null;
let explorerCreditChart = null;

// ============================
// LOAD DATA
// ============================
async function loadExplorerData() {
  try {
    const response = await fetch("data/loan_data.json");

    if (!response.ok) {
      throw new Error("Failed to load loan_data.json");
    }

    const jsonData = await response.json();

    // Load extra applicants saved from eligibility page
    const savedApplicants =
      JSON.parse(localStorage.getItem("loanApplicants")) || [];

    // Merge JSON + localStorage applicants
    explorerData = [...jsonData, ...savedApplicants];
    filteredExplorerData = [...explorerData];

    populateExplorerCityFilter();
    updateExplorerSummary(filteredExplorerData);
    renderExplorerCharts(filteredExplorerData);
    renderApplicantList(filteredExplorerData);
  } catch (error) {
    console.error("Error loading explorer data:", error);
  }
}

// ============================
// POPULATE CITY FILTER
// ============================
function populateExplorerCityFilter() {
  const cityFilter = document.getElementById("explorerCityFilter");
  if (!cityFilter) return;

  cityFilter.innerHTML = `<option value="">All Cities</option>`;

  const cities = [...new Set(explorerData.map(item => item.city))].filter(Boolean);

  cities.forEach(city => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    cityFilter.appendChild(option);
  });
}

// ============================
// SUMMARY CARDS
// ============================
function updateExplorerSummary(data) {
  const totalEl = document.getElementById("explorerTotalApplicants");
  const approvedEl = document.getElementById("explorerApprovedLoans");
  const rejectedEl = document.getElementById("explorerRejectedLoans");
  const avgIncomeEl = document.getElementById("explorerAvgIncome");

  const approved = data.filter(item => item.loan_approved === true).length;
  const rejected = data.filter(item => item.loan_approved === false).length;
  const avgIncome = data.length
    ? Math.round(data.reduce((sum, item) => sum + item.income, 0) / data.length)
    : 0;

  if (totalEl) totalEl.textContent = data.length;
  if (approvedEl) approvedEl.textContent = approved;
  if (rejectedEl) rejectedEl.textContent = rejected;
  if (avgIncomeEl) avgIncomeEl.textContent = avgIncome.toLocaleString();
}

// ============================
// FILTERS
// ============================
function applyExplorerFilters() {
  const statusValue = document.getElementById("explorerStatusFilter").value;
  const cityValue = document.getElementById("explorerCityFilter").value;

  filteredExplorerData = explorerData.filter(item => {
    const matchesStatus =
      statusValue === "" || String(item.loan_approved) === statusValue;

    const matchesCity =
      cityValue === "" || item.city === cityValue;

    return matchesStatus && matchesCity;
  });

  updateExplorerSummary(filteredExplorerData);
  renderExplorerCharts(filteredExplorerData);
  renderApplicantList(filteredExplorerData);
}

function resetExplorerFilters() {
  document.getElementById("explorerStatusFilter").value = "";
  document.getElementById("explorerCityFilter").value = "";

  filteredExplorerData = [...explorerData];
  updateExplorerSummary(filteredExplorerData);
  renderExplorerCharts(filteredExplorerData);
  renderApplicantList(filteredExplorerData);
}

// ============================
// CHARTS
// ============================
function renderExplorerCharts(data) {
  const approvedData = data.filter(item => item.loan_approved === true);
  const rejectedData = data.filter(item => item.loan_approved === false);

  const approved = approvedData.length;
  const rejected = rejectedData.length;

  const avgApprovedIncome = approved
    ? Math.round(
        approvedData.reduce((sum, item) => sum + item.income, 0) / approved
      )
    : 0;

  const avgRejectedIncome = rejected
    ? Math.round(
        rejectedData.reduce((sum, item) => sum + item.income, 0) / rejected
      )
    : 0;

  const avgApprovedCredit = approved
    ? Math.round(
        approvedData.reduce((sum, item) => sum + item.credit_score, 0) / approved
      )
    : 0;

  const avgRejectedCredit = rejected
    ? Math.round(
        rejectedData.reduce((sum, item) => sum + item.credit_score, 0) / rejected
      )
    : 0;

  // destroy old charts
  if (explorerApprovalChart) explorerApprovalChart.destroy();
  if (explorerIncomeChart) explorerIncomeChart.destroy();
  if (explorerCreditChart) explorerCreditChart.destroy();

  // approval pie
  const approvalCanvas = document.getElementById("explorerApprovalChart");
  if (approvalCanvas) {
    explorerApprovalChart = new Chart(approvalCanvas.getContext("2d"), {
      type: "pie",
      data: {
        labels: ["Approved", "Rejected"],
        datasets: [
          {
            label: "Loan Status",
            data: [approved, rejected],
            backgroundColor: ["#8b5cf6", "#ef4444"],
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: { color: "#f5f3ff" }
          }
        }
      }
    });
  }

  // income bar
  const incomeCanvas = document.getElementById("explorerIncomeChart");
  if (incomeCanvas) {
    explorerIncomeChart = new Chart(incomeCanvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Approved", "Rejected"],
        datasets: [
          {
            label: "Average Income",
            data: [avgApprovedIncome, avgRejectedIncome],
            backgroundColor: ["#8b5cf6", "#ef4444"],
            borderRadius: 10
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            ticks: { color: "#f5f3ff" },
            grid: { color: "rgba(255,255,255,0.06)" }
          },
          y: {
            ticks: { color: "#f5f3ff" },
            grid: { color: "rgba(255,255,255,0.06)" }
          }
        },
        plugins: {
          legend: {
            labels: { color: "#f5f3ff" }
          }
        }
      }
    });
  }

  // credit bar
  const creditCanvas = document.getElementById("explorerCreditChart");
  if (creditCanvas) {
    explorerCreditChart = new Chart(creditCanvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Approved", "Rejected"],
        datasets: [
          {
            label: "Average Credit Score",
            data: [avgApprovedCredit, avgRejectedCredit],
            backgroundColor: ["#8b5cf6", "#ef4444"],
            borderRadius: 10
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            ticks: { color: "#f5f3ff" },
            grid: { color: "rgba(255,255,255,0.06)" }
          },
          y: {
            ticks: { color: "#f5f3ff" },
            grid: { color: "rgba(255,255,255,0.06)" }
          }
        },
        plugins: {
          legend: {
            labels: { color: "#f5f3ff" }
          }
        }
      }
    });
  }
}

// ============================
// APPLICANT LIST
// ============================
function renderApplicantList(data) {
  const listContainer = document.getElementById("applicantList");
  if (!listContainer) return;

  listContainer.innerHTML = "";

  if (data.length === 0) {
    listContainer.innerHTML = `<p class="muted">No applicants found.</p>`;
    return;
  }

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "applicant-card";

    card.innerHTML = `
      <h4>${item.name}</h4>
      <p><strong>City:</strong> ${item.city}</p>
      <p><strong>Income:</strong> ${Number(item.income).toLocaleString()}</p>
      <p><strong>Status:</strong> ${item.loan_approved ? "Approved" : "Rejected"}</p>
    `;

    card.addEventListener("click", () => openApplicantModal(item));
    listContainer.appendChild(card);
  });
}

// ============================
// MODAL
// ============================
function openApplicantModal(applicant) {
  const modal = document.getElementById("applicantModal");
  const modalBody = document.getElementById("modalBody");

  if (!modal || !modalBody) return;

  modalBody.innerHTML = `
    <div class="applicant-detail-grid">
      <p><strong>Name:</strong> ${applicant.name}</p>
      <p><strong>City:</strong> ${applicant.city}</p>
      <p><strong>Income:</strong> ${Number(applicant.income).toLocaleString()}</p>
      <p><strong>Credit Score:</strong> ${applicant.credit_score}</p>
      <p><strong>Loan Amount:</strong> ${Number(applicant.loan_amount).toLocaleString()}</p>
      <p><strong>Years Employed:</strong> ${applicant.years_employed}</p>
      <p><strong>Points:</strong> ${applicant.points}</p>
      <p><strong>Status:</strong> ${applicant.loan_approved ? "Approved" : "Rejected"}</p>
    </div>
  `;

  modal.classList.remove("hidden");
}

function closeApplicantModal() {
  const modal = document.getElementById("applicantModal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

// ============================
// EVENTS
// ============================
document.addEventListener("DOMContentLoaded", () => {
  const statusFilter = document.getElementById("explorerStatusFilter");
  const cityFilter = document.getElementById("explorerCityFilter");
  const resetBtn = document.getElementById("explorerResetFilters");
  const closeBtn = document.getElementById("closeModal");
  const modal = document.getElementById("applicantModal");

  if (statusFilter) statusFilter.addEventListener("change", applyExplorerFilters);
  if (cityFilter) cityFilter.addEventListener("change", applyExplorerFilters);
  if (resetBtn) resetBtn.addEventListener("click", resetExplorerFilters);
  if (closeBtn) closeBtn.addEventListener("click", closeApplicantModal);

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeApplicantModal();
    });
  }

  loadExplorerData();
});