const API_URL = "http://127.0.0.1:8000";

/* AUTH */

const token = localStorage.getItem("token");
const username = localStorage.getItem("username");

if (!token) {
window.location.href = "login.html";
}

let userAge = null;
let userPregnancies = null;

function authHeaders() {
return {
"Content-Type": "application/json",
"Authorization": `Bearer ${token}`
};
}

/* PROFILE */

async function loadProfile() {
try {
const res = await fetch(`${API_URL}/profile`, { headers: authHeaders() });
const data = await res.json();

```
if (data.age == null || data.pregnancies == null) {
  document.getElementById("profileModal").style.display = "flex";
} else {
  userAge = data.age;
  userPregnancies = data.pregnancies;
  updateProfileBadge();
}
```

} catch {
document.getElementById("profileModal").style.display = "flex";
}
}

function updateProfileBadge() {
const badge = document.getElementById("profileBadge");
if (!badge) return;

badge.innerHTML =
`Age ${userAge} · ${userPregnancies} prev. pregnanc${userPregnancies === 1 ? "y" : "ies"}      <button class="edit-profile-btn" onclick="document.getElementById('profileModal').style.display='flex'">Edit</button>`;
}

document.getElementById("usernameDisplay").textContent =
username ? `Hi, ${username}` : "";

/* LOGOUT */

function logout() {
localStorage.removeItem("token");
localStorage.removeItem("username");
window.location.href = "login.html";
}

/* ANALYZE */

async function analyze() {

const glucose = parseFloat(document.getElementById("glucose").value);
const systolic = parseFloat(document.getElementById("systolic_bp").value);
const diastolic = parseFloat(document.getElementById("diastolic_bp").value);
const heartRate = parseFloat(document.getElementById("heart_rate").value);
const bodyTemp = parseFloat(document.getElementById("body_temp").value);

const weight = parseFloat(document.getElementById("weight").value);
const height = parseFloat(document.getElementById("height").value);

const bmi = weight / (height * height);

const btn = document.getElementById("analyzeBtn");
btn.disabled = true;
btn.textContent = "Analyzing...";

try {

```
const response = await fetch(`${API_URL}/predict`, {
  method: "POST",
  headers: authHeaders(),
  body: JSON.stringify({
    glucose: glucose,
    systolic_bp: systolic,
    diastolic_bp: diastolic,
    bmi: bmi,
    heart_rate: heartRate,
    body_temp: bodyTemp,
    symptoms: getSymptoms()
  })
});

if (!response.ok) {
  alert("Server error");
  return;
}

const data = await response.json();

displayRisk(data.risk);
updateChart(data.history);
```

} catch {
alert("Could not reach server");
}

btn.disabled = false;
btn.textContent = "Analyze Risk";
}

/* SYMPTOMS */

function getSymptoms() {

const ids = [
"headache","blurred","vomiting","dizziness",
"swelling","bleeding","contractions","movement","fatigue"
];

return ids.filter(id => document.getElementById(id).checked);
}

/* RISK DISPLAY */

function displayRisk(risk) {

const box = document.getElementById("riskBox");

box.textContent = risk;
box.className = "risk";

if (risk === "High Risk") box.classList.add("high");
else if (risk === "Medium Risk") box.classList.add("medium");
else box.classList.add("low");
}

/* CHART */

let chart;

function initChart() {

const ctx = document.getElementById("chart").getContext("2d");

chart = new Chart(ctx, {

```
type: "line",

data: {

  labels: [],

  datasets: [

    {
      label: "Systolic BP",
      data: [],
      borderColor: "#ff4da6",
      tension: 0.3
    },

    {
      label: "Glucose",
      data: [],
      borderColor: "#c678dd",
      tension: 0.3
    }

  ]

},

options: {
  responsive: true
}
```

});

}

function updateChart(history) {

const reversed = [...history].reverse();

chart.data.labels = reversed.map(item =>
new Date(item.timestamp).toLocaleTimeString()
);

chart.data.datasets[0].data =
reversed.map(item => item.systolic_bp);

chart.data.datasets[1].data =
reversed.map(item => item.glucose);

chart.update();

}

initChart();
loadProfile();
