// ===============================
// Firebase Imports
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";


// ===============================
// Firebase Configuration
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyD8949B7DA26ticNgpxokjAm1RRJe1kW8o",
  authDomain: "expense-tracker-c8a29.firebaseapp.com",
  projectId: "expense-tracker-c8a29",
  storageBucket: "expense-tracker-c8a29.firebasestorage.app",
  messagingSenderId: "281084937321",
  appId: "1:281084937321:web:516bf2529a141cb5218ef8",
  measurementId: "G-M0NPCDETR2"
};


// ===============================
// Initialize Firebase
// ===============================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();


// ===============================
// Auth Elements
// ===============================
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userDisplay = document.getElementById("userDisplay");
const appContainer = document.getElementById("appContainer");


// ===============================
// Login with Google
// ===============================
loginBtn?.addEventListener("click", async () => {

  try {

    const result = await signInWithPopup(auth, provider);

    console.log("User Logged In:", result.user);

  } catch (error) {

    console.error("Login Error:", error);

  }

});


// ===============================
// Logout
// ===============================
logoutBtn?.addEventListener("click", async () => {

  await signOut(auth);

});


// ===============================
// Auth State Listener
// ===============================
onAuthStateChanged(auth, (user) => {

  if (user) {

    userDisplay.textContent = user.displayName;

    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";

    appContainer.style.display = "block";

    loadUserData(user.uid);

  } else {

    userDisplay.textContent = "";

    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";

    appContainer.style.display = "none";

  }

});


// ===============================
// Expense Tracker State
// ===============================
let expenses = [];
let budget = 0;

let categoryChartInstance = null;
let timelineChartInstance = null;

let currentUserId = null;


// ===============================
// DOM Elements
// ===============================
const expenseForm = document.getElementById("expenseForm");

const expenseName = document.getElementById("expenseName");
const expenseAmount = document.getElementById("expenseAmount");
const expenseCategory = document.getElementById("expenseCategory");
const expenseDate = document.getElementById("expenseDate");

const expenseTableBody = document.getElementById("expenseTableBody");

const totalExpenseDisplay = document.getElementById("totalExpenseDisplay");
const remainingBudgetDisplay = document.getElementById("remainingBudgetDisplay");

const budgetInput = document.getElementById("budgetInput");
const setBudgetBtn = document.getElementById("setBudgetBtn");

const exportBtn = document.getElementById("exportBtn");


// ===============================
// Load User Data
// ===============================
function loadUserData(uid){

  currentUserId = uid;

  expenses = JSON.parse(localStorage.getItem(uid+"_expenses")) || [];
  budget = parseFloat(localStorage.getItem(uid+"_budget")) || 0;

  renderExpenses();
  updateDashboard();
  initCharts();
  updateCharts();

}


// ===============================
// Save Data
// ===============================
function saveExpenses(){

  localStorage.setItem(currentUserId+"_expenses", JSON.stringify(expenses));

}

function saveBudget(){

  localStorage.setItem(currentUserId+"_budget", budget);

}


// ===============================
// Set Monthly Budget
// ===============================
setBudgetBtn?.addEventListener("click", () => {

  const value = parseFloat(budgetInput.value);

  if (isNaN(value) || value <= 0) {

    alert("Please enter a valid budget.");
    return;

  }

  budget = value;

  saveBudget();

  updateDashboard();

  budgetInput.value = "";

});


// ===============================
// Add Expense
// ===============================
expenseForm?.addEventListener("submit", (e) => {

  e.preventDefault();

  const name = expenseName.value.trim();
  const amount = parseFloat(expenseAmount.value);
  const category = expenseCategory.value;
  const date = expenseDate.value;

  if (!name || isNaN(amount) || !date) {

    alert("Please fill all fields.");
    return;

  }

  const expense = {
    id: Date.now(),
    name,
    amount,
    category,
    date
  };

  expenses.push(expense);

  saveExpenses();

  renderExpenses();
  updateDashboard();
  updateCharts();

  expenseForm.reset();

});


// ===============================
// Render Expense Table
// ===============================
function renderExpenses(){

  expenseTableBody.innerHTML = "";

  expenses.forEach(exp => {

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${exp.date}</td>
      <td>${exp.name}</td>
      <td>${exp.category}</td>
      <td>$${exp.amount.toFixed(2)}</td>
      <td>
        <button class="delete-btn" onclick="deleteExpense(${exp.id})">
        Delete
        </button>
      </td>
    `;

    expenseTableBody.appendChild(row);

  });

}


// ===============================
// Delete Expense
// ===============================
window.deleteExpense = function(id){

  expenses = expenses.filter(exp => exp.id !== id);

  saveExpenses();

  renderExpenses();
  updateDashboard();
  updateCharts();

}


// ===============================
// Dashboard Calculation
// ===============================
function updateDashboard(){

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const remaining = budget - total;

  totalExpenseDisplay.textContent = `$${total.toFixed(2)}`;
  remainingBudgetDisplay.textContent = `$${remaining.toFixed(2)}`;

}


// ===============================
// Initialize Charts
// ===============================
function initCharts(){

  const categoryCtx = document.getElementById("categoryChart").getContext("2d");
  const timelineCtx = document.getElementById("timelineChart").getContext("2d");

  categoryChartInstance = new Chart(categoryCtx, {

    type: "pie",

    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [
          "#8b5cf6",
          "#6366f1",
          "#3b82f6",
          "#06b6d4",
          "#14b8a6",
          "#22c55e"
        ]
      }]
    }

  });

  timelineChartInstance = new Chart(timelineCtx, {

    type: "bar",

    data: {
      labels: [],
      datasets: [{
        label: "Expenses",
        data: [],
        backgroundColor: "#6366f1"
      }]
    }

  });

}


// ===============================
// Update Charts
// ===============================
function updateCharts(){

  const categoryTotals = {};
  const dateTotals = {};

  expenses.forEach(exp => {

    categoryTotals[exp.category] =
      (categoryTotals[exp.category] || 0) + exp.amount;

    dateTotals[exp.date] =
      (dateTotals[exp.date] || 0) + exp.amount;

  });

  categoryChartInstance.data.labels = Object.keys(categoryTotals);
  categoryChartInstance.data.datasets[0].data = Object.values(categoryTotals);
  categoryChartInstance.update();

  timelineChartInstance.data.labels = Object.keys(dateTotals);
  timelineChartInstance.data.datasets[0].data = Object.values(dateTotals);
  timelineChartInstance.update();

}


// ===============================
// Export Excel
// ===============================
exportBtn?.addEventListener("click", () => {

  if (expenses.length === 0) {

    alert("No expenses to export.");
    return;

  }

  const worksheet = XLSX.utils.json_to_sheet(expenses);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

  XLSX.writeFile(workbook, "expenses.xlsx");

});