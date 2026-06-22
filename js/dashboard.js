// dashboard.js
// Loan Approval Dashboard

let loanData = [];
let filteredData = [];

let approvalChartInstance = null;
let incomeChartInstance = null;
let creditScoreChartInstance = null;

/* =========================================
   HELPER: CHECK IF LOAN IS APPROVED
   Handles:
   true / false
   "true" / "false"
   "yes" / "no"
   "approved" / "rejected"
   1 / 0
========================================= */
function isApprovedValue(value) {
  if (value === true || value === 1) return true;

  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "true" || v === "yes" || v === "approved" || v === "1";
  }

  return false;
}

/* =========================================
   LOAD DATA
   Loads:
   1. data/loan_data.json
   2. applicants added from eligibility page (localStorage)
========================================= */
async function loadData() {
  try {
    const response = await fetch("data/loan_data.json");
    if (!response.ok) throw new Error("Failed to load loan_data.json");

    const jsonData = await response.json();

    // Applicants added from eligibility page
    const savedApplicants =
      JSON.parse(localStorage.getItem("loanApplicants")) || [];

    // Merge both datasets
    loanData = [...jsonData, ...savedApplicants];
    filteredData = [...loanData];

    populateCityFilter();
    updateSummaryCards(filteredData);
    renderTable(filteredData);
    renderCharts(filteredData);
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }
}

/* =========================================
   POPULATE CITY FILTER
========================================= */
function populateCityFilter() {
  const cityFilter = document.getElementById("cityFilter");
  if (!cityFilter) return;

  cityFilter.innerHTML = `<option value="">All Cities</option>`;

  const cities = [...new Set(loanData.map(item => item.city).filter(Boolean))];

  cities.sort().forEach(city => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    cityFilter.appendChild(option);
  });
}

/* =========================================
   SUMMARY CARDS
========================================= */
function updateSummaryCards(data) {
  const totalApplicantsEl = document.getElementById("totalApplicants");
  const approvedLoansEl = document.getElementById("approvedLoans");
  const rejectedLoansEl = document.getElementById("rejectedLoans");
  const avgIncomeEl = document.getElementById("avgIncome");

  const approved = data.filter(item => isApprovedValue(item.loan_approved)).length;
  const rejected = data.length - approved;

  const avgIncome = data.length
    ? Math.round(
        data.reduce((sum, item) => sum + Number(item.income || 0), 0) / data.length
      )
    : 0;

  if (totalApplicantsEl) totalApplicantsEl.textContent = data.length;
  if (approvedLoansEl) approvedLoansEl.textContent = approved;
  if (rejectedLoansEl) rejectedLoansEl.textContent = rejected;
  if (avgIncomeEl) avgIncomeEl.textContent = avgIncome.toLocaleString();
}

/* =========================================
   RENDER TABLE
========================================= */
function renderTable(data) {
  const tableBody = document.getElementById("loanTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  if (data.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding:20px;">
          No applicants found.
        </td>
      </tr>
    `;
    return;
  }

  data.forEach(item => {
    const approved = isApprovedValue(item.loan_approved);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.name || "New Applicant"}</td>
      <td>${item.city || "-"}</td>
      <td>${Number(item.income || 0).toLocaleString()}</td>
      <td>${item.credit_score ?? "-"}</td>
      <td>${Number(item.loan_amount || 0).toLocaleString()}</td>
      <td>${item.years_employed ?? "-"}</td>
      <td>${item.points ?? "-"}</td>
      <td>
        <span class="${approved ? "status approved" : "status rejected"}">
          ${approved ? "Approved" : "Rejected"}
        </span>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

/* =========================================
   APPLY FILTERS + SORT
========================================= */
function applyFilters() {
  const searchInput = document.getElementById("searchInput");
  const cityFilter = document.getElementById("cityFilter");
  const statusFilter = document.getElementById("statusFilter");
  const sortBy = document.getElementById("sortBy");

  const searchValue = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const cityValue = cityFilter ? cityFilter.value : "";
  const statusValue = statusFilter ? statusFilter.value : "";
  const sortValue = sortBy ? sortBy.value : "";

  filteredData = loanData.filter(item => {
    const approved = isApprovedValue(item.loan_approved);

    const matchesSearch = (item.name || "")
      .toLowerCase()
      .includes(searchValue);

    const matchesCity = cityValue === "" || item.city === cityValue;

    const matchesStatus =
      statusValue === "" || String(approved) === statusValue;

    return matchesSearch && matchesCity && matchesStatus;
  });

  // Sorting
  if (sortValue) {
    filteredData.sort((a, b) => {
      const aVal = Number(a[sortValue] || 0);
      const bVal = Number(b[sortValue] || 0);
      return bVal - aVal;
    });
  }

  updateSummaryCards(filteredData);
  renderTable(filteredData);
  renderCharts(filteredData);
}

/* =========================================
   RESET FILTERS
========================================= */
function resetFilters() {
  const searchInput = document.getElementById("searchInput");
  const cityFilter = document.getElementById("cityFilter");
  const statusFilter = document.getElementById("statusFilter");
  const sortBy = document.getElementById("sortBy");

  if (searchInput) searchInput.value = "";
  if (cityFilter) cityFilter.value = "";
  if (statusFilter) statusFilter.value = "";
  if (sortBy) sortBy.value = "";

  filteredData = [...loanData];
  updateSummaryCards(filteredData);
  renderTable(filteredData);
  renderCharts(filteredData);
}

/* =========================================
   RENDER CHARTS
========================================= */
function renderCharts(data) {
  const approvedData = data.filter(item => isApprovedValue(item.loan_approved));
  const rejectedData = data.filter(item => !isApprovedValue(item.loan_approved));

  const approved = approvedData.length;
  const rejected = rejectedData.length;

  const avgApprovedIncome = approved
    ? Math.round(
        approvedData.reduce((sum, item) => sum + Number(item.income || 0), 0) / approved
      )
    : 0;

  const avgRejectedIncome = rejected
    ? Math.round(
        rejectedData.reduce((sum, item) => sum + Number(item.income || 0), 0) / rejected
      )
    : 0;

  const avgApprovedCredit = approved
    ? Math.round(
        approvedData.reduce((sum, item) => sum + Number(item.credit_score || 0), 0) / approved
      )
    : 0;

  const avgRejectedCredit = rejected
    ? Math.round(
        rejectedData.reduce((sum, item) => sum + Number(item.credit_score || 0), 0) / rejected
      )
    : 0;

  // Destroy old chart instances before re-rendering
  if (approvalChartInstance) approvalChartInstance.destroy();
  if (incomeChartInstance) incomeChartInstance.destroy();
  if (creditScoreChartInstance) creditScoreChartInstance.destroy();

  // Approval Pie Chart
  const approvalCanvas = document.getElementById("approvalChart");
  if (approvalCanvas) {
    approvalChartInstance = new Chart(approvalCanvas.getContext("2d"), {
      type: "pie",
      data: {
        labels: ["Approved", "Rejected"],
        datasets: [
          {
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
            labels: {
              color: "#ffffff"
            }
          }
        }
      }
    });
  }

  // Average Income Bar Chart
  const incomeCanvas = document.getElementById("incomeChart");
  if (incomeCanvas) {
    incomeChartInstance = new Chart(incomeCanvas.getContext("2d"), {
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
            ticks: { color: "#ffffff" },
            grid: { color: "rgba(255,255,255,0.08)" }
          },
          y: {
            ticks: { color: "#ffffff" },
            grid: { color: "rgba(255,255,255,0.08)" }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: "#ffffff"
            }
          }
        }
      }
    });
  }

  // Average Credit Score Bar Chart
  const creditCanvas = document.getElementById("creditScoreChart");
  if (creditCanvas) {
    creditScoreChartInstance = new Chart(creditCanvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Approved", "Rejected"],
        datasets: [
          {
            label: "Average Credit Score",
            data: [avgApprovedCredit, avgRejectedCredit],
            backgroundColor: ["#06b6d4", "#f43f5e"],
            borderRadius: 10
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            ticks: { color: "#ffffff" },
            grid: { color: "rgba(255,255,255,0.08)" }
          },
          y: {
            ticks: { color: "#ffffff" },
            grid: { color: "rgba(255,255,255,0.08)" }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: "#ffffff"
            }
          }
        }
      }
    });
  }
}

/* =========================================
   EVENT LISTENERS
========================================= */
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const cityFilter = document.getElementById("cityFilter");
  const statusFilter = document.getElementById("statusFilter");
  const sortBy = document.getElementById("sortBy");
  const resetBtn = document.getElementById("resetFilters");

  if (searchInput) searchInput.addEventListener("input", applyFilters);
  if (cityFilter) cityFilter.addEventListener("change", applyFilters);
  if (statusFilter) statusFilter.addEventListener("change", applyFilters);
  if (sortBy) sortBy.addEventListener("change", applyFilters);
  if (resetBtn) resetBtn.addEventListener("click", resetFilters);

  loadData();
});