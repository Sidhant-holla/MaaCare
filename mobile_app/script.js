const API_URL = "http://127.0.0.1:8000";

/* AUTH */

const token = localStorage.getItem("token");
const username = localStorage.getItem("username");

if (!token) window.location.href = "login.html";

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
    if (data.age == null || data.pregnancies == null) {
      document.getElementById("profileModal").style.display = "flex";
    } else {
      userAge = data.age;
      userPregnancies = data.pregnancies;
      updateProfileBadge();
    }
  } catch {
    document.getElementById("profileModal").style.display = "flex";
  }
}

function updateProfileBadge() {
  const badge = document.getElementById("profileBadge");
  if (!badge) return;
  badge.innerHTML = `Age ${userAge} &nbsp;·&nbsp; ${userPregnancies} prev. pregnanc${userPregnancies === 1 ? "y" : "ies"} &nbsp;<button class="edit-profile-btn" onclick="document.getElementById('profileModal').style.display='flex'">Edit</button>`;
}

async function saveProfile() {
  const age = parseInt(document.getElementById("profileAge").value);
  const pregnancies = parseInt(document.getElementById("profilePregnancies").value);
  let err = false;
  if (isNaN(age) || age < 10 || age > 60) {
    document.getElementById("profileAgeError").textContent = "Enter age between 10 and 60";
    err = true;
  }
  if (isNaN(pregnancies) || pregnancies < 0 || pregnancies > 20) {
    document.getElementById("profilePregnanciesError").textContent = "Enter a value between 0 and 20";
    err = true;
  }
  if (err) return;
  const btn = document.querySelector("#profileModal button");
  btn.textContent = "Saving...";
  btn.disabled = true;
  await fetch(`${API_URL}/profile`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ age, pregnancies })
  });
  userAge = age;
  userPregnancies = pregnancies;
  btn.textContent = "Save & Continue";
  btn.disabled = false;
  document.getElementById("profileModal").style.display = "none";
  updateProfileBadge();
}

/* USERNAME */

document.getElementById("usernameDisplay").textContent = username ? `Hi, ${username}` : "";

/* LOGOUT */

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  window.location.href = "login.html";
}

/* PREGNANCY TRACKER */

function updatePregnancy() {
  const weeksInput = document.getElementById("weeks");
  let val = parseInt(weeksInput.value);
  if (val > 42) { weeksInput.value = 42; val = 42; }
  if (isNaN(val) || val < 1) {
    document.getElementById("progress").style.width = "0%";
    document.getElementById("weekText").innerText = "Enter weeks to track pregnancy stage";
    return;
  }
  const pct = Math.min((val / 42) * 100, 100);
  const bar = document.getElementById("progress");
  bar.style.width = pct + "%";
  let stage, color;
  if (val <= 12)      { stage = "First Trimester";  color = "#4caf50"; }
  else if (val <= 27) { stage = "Second Trimester"; color = "#ff9800"; }
  else                { stage = "Third Trimester";  color = "#ff4da6"; }
  bar.style.background = color;
  document.getElementById("weekText").innerText = `Week ${val} • ${stage}`;
}

document.getElementById("weeks").addEventListener("input", updatePregnancy);

/* FIELD ERRORS */

function fieldError(id, msg) {
  const el = document.getElementById(id + "Error");
  if (el) el.textContent = msg;
}

function clearErrors() {
  ["glucose", "sys", "dia", "heart", "temp", "weight", "height"].forEach(id => {
    const el = document.getElementById(id + "Error");
    if (el) el.textContent = "";
  });
}

/* RESET RISK ON INPUT CHANGE */

const inputErrorMap = {
  "systolic_bp": "sys", "diastolic_bp": "dia",
  "heart_rate": "heart", "body_temp": "temp"
};

["glucose", "systolic_bp", "diastolic_bp", "heart_rate", "body_temp", "weight", "height"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", () => {
    const errId = inputErrorMap[id] || id;
    const errEl = document.getElementById(errId + "Error");
    if (errEl) errEl.textContent = "";
    resetRisk();
  });
});

document.querySelectorAll(".symptom input[type=checkbox]").forEach(cb => {
  cb.addEventListener("change", resetRisk);
});

function resetRisk() {
  const box = document.getElementById("riskBox");
  box.textContent = "—";
  box.className = "risk";
  document.getElementById("diagnosticsBox").innerHTML = "";
  document.getElementById("alertBox").innerHTML = "";
}

/* SYMPTOMS */

function getSymptoms() {
  const ids = ["headache","blurred","vomiting","dizziness","swelling","bleeding","contractions","movement","fatigue"];
  return ids.filter(id => document.getElementById(id).checked);
}

/* ANALYZE */

async function analyze() {
  clearErrors();

  const glucose   = parseFloat(document.getElementById("glucose").value);
  const systolic  = parseFloat(document.getElementById("systolic_bp").value);
  const diastolic = parseFloat(document.getElementById("diastolic_bp").value);
  const heartRate = parseFloat(document.getElementById("heart_rate").value);
  const bodyTemp  = parseFloat(document.getElementById("body_temp").value);
  const weight    = parseFloat(document.getElementById("weight").value);
  const height    = parseFloat(document.getElementById("height").value);

  let hasError = false;

  if (isNaN(glucose))                          { fieldError("glucose", "Required"); hasError = true; }
  else if (glucose < 50 || glucose > 400)      { fieldError("glucose", "Enter 50–400 mg/dL"); hasError = true; }

  if (isNaN(systolic))                         { fieldError("sys", "Required"); hasError = true; }
  else if (systolic < 80 || systolic > 250)    { fieldError("sys", "Enter 80–250 mmHg"); hasError = true; }

  if (isNaN(diastolic))                        { fieldError("dia", "Required"); hasError = true; }
  else if (diastolic < 40 || diastolic > 150)  { fieldError("dia", "Enter 40–150 mmHg"); hasError = true; }

  if (isNaN(heartRate))                        { fieldError("heart", "Required"); hasError = true; }
  else if (heartRate < 40 || heartRate > 180)  { fieldError("heart", "Enter 40–180 bpm"); hasError = true; }

  if (isNaN(bodyTemp))                         { fieldError("temp", "Required"); hasError = true; }
  else if (bodyTemp < 95 || bodyTemp > 105)    { fieldError("temp", "Enter 95–105 °F"); hasError = true; }

  if (isNaN(weight))                           { fieldError("weight", "Required"); hasError = true; }
  else if (weight < 30 || weight > 200)        { fieldError("weight", "Enter 30–200 kg"); hasError = true; }

  if (isNaN(height))                           { fieldError("height", "Required"); hasError = true; }
  else if (height < 1.0 || height > 2.5)       { fieldError("height", "Enter 1.0–2.5 m"); hasError = true; }

  if (hasError) return;

  const bmi = weight / (height * height);

  const btn = document.getElementById("analyzeBtn");
  btn.disabled = true;
  btn.textContent = "Analyzing...";

  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        glucose,
        systolic_bp: systolic,
        diastolic_bp: diastolic,
        bmi,
        heart_rate: heartRate,
        body_temp: bodyTemp,
        symptoms: getSymptoms()
      })
    });

    if (response.status === 401) { logout(); return; }
    if (response.status === 400) {
      document.getElementById("profileModal").style.display = "flex";
      return;
    }
    if (!response.ok) {
      document.getElementById("alertBox").innerHTML = "<div class='alert alert-danger'>Server error. Try again.</div>";
      return;
    }

    const data = await response.json();
    displayRisk(data.risk);
    buildDiagnostics(data.risk, systolic, diastolic, glucose, bmi, bodyTemp, heartRate, getSymptoms());
    updateChart(data.history);

  } catch {
    document.getElementById("alertBox").innerHTML = "<div class='alert alert-danger'>Could not reach server. Make sure the backend is running.</div>";
  } finally {
    btn.disabled = false;
    btn.textContent = "Analyze Risk";
  }
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

/* DIAGNOSTICS */

function buildDiagnostics(risk, systolic, diastolic, glucose, bmi, bodyTemp, heartRate, symptoms) {
  const reasons = [];

  if (systolic >= 160)       reasons.push("🔴 Systolic BP (" + systolic + " mmHg) is critically high — severe hypertension");
  else if (systolic >= 140)  reasons.push("🟡 Systolic BP (" + systolic + " mmHg) is high — hypertension threshold in pregnancy");
  else if (systolic < 90)    reasons.push("🔴 Systolic BP (" + systolic + " mmHg) is critically low — hypotension");
  else if (systolic < 100)   reasons.push("🟡 Systolic BP (" + systolic + " mmHg) is on the lower side");

  if (diastolic >= 110)      reasons.push("🔴 Diastolic BP (" + diastolic + " mmHg) is critically high");
  else if (diastolic >= 90)  reasons.push("🟡 Diastolic BP (" + diastolic + " mmHg) is elevated");

  if (glucose >= 180)        reasons.push("🔴 Glucose (" + glucose + " mg/dL) is in the diabetic range");
  else if (glucose >= 140)   reasons.push("🟡 Glucose (" + glucose + " mg/dL) is above normal — pre-diabetic range");

  if (bmi >= 40)             reasons.push("🔴 BMI (" + bmi.toFixed(1) + ") indicates severe obesity");
  else if (bmi >= 30)        reasons.push("🟡 BMI (" + bmi.toFixed(1) + ") is in the obese range");

  if (bodyTemp >= 100.4)     reasons.push("🔴 Temperature (" + bodyTemp + "°F) indicates fever");
  else if (bodyTemp >= 99.5) reasons.push("🟡 Temperature (" + bodyTemp + "°F) is slightly elevated");

  if (heartRate >= 100)      reasons.push("🟡 Heart rate (" + heartRate + " bpm) is elevated — tachycardia");
  else if (heartRate < 60)   reasons.push("🟡 Heart rate (" + heartRate + " bpm) is low — bradycardia");

  const symptomLabels = {
    headache: "severe headache", blurred: "blurred vision", vomiting: "vomiting",
    dizziness: "dizziness", swelling: "swelling", bleeding: "vaginal bleeding",
    contractions: "contractions", movement: "reduced baby movement", fatigue: "extreme fatigue"
  };

  const seriousSymptoms = ["bleeding", "contractions", "movement"];
  const activeSymptoms  = symptoms.filter(s => symptomLabels[s]);
  const seriousActive   = activeSymptoms.filter(s => seriousSymptoms.includes(s));
  const mildActive      = activeSymptoms.filter(s => !seriousSymptoms.includes(s));

  let html = '<div class="diagnostics-box"><div class="diag-title">Diagnostics</div>';

  if (reasons.length === 0 && risk === "Low Risk") {
    html += '<div class="diag-good">✅ All key vitals are within normal range.</div>';
  } else {
    html += '<ul class="diag-list">' + reasons.map(r => `<li>${r}</li>`).join("") + '</ul>';
  }

  if (seriousActive.length > 0) {
    const listed = seriousActive.map(s => symptomLabels[s]).join(", ");
    html += `<div class="diag-urgent">🚨 You've reported: <strong>${listed}</strong>. Please consult a doctor as soon as possible.</div>`;
  } else if (mildActive.length > 0) {
    const listed = mildActive.map(s => symptomLabels[s]).join(", ");
    html += `<div class="diag-note">⚠️ Symptoms reported: <strong>${listed}</strong>. Wait and watch — consult a doctor if symptoms persist or worsen.</div>`;
  }

  html += '</div>';
  document.getElementById("diagnosticsBox").innerHTML = html;
}

/* CHART */

let chart;

function initChart() {
  const ctx = document.getElementById("chart").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Systolic BP",
          data: [],
          borderColor: "#ff4da6",
          backgroundColor: "rgba(255,77,166,0.08)",
          borderWidth: 2,
          tension: 0.3,
          pointBackgroundColor: "#ff4da6"
        },
        {
          label: "Glucose",
          data: [],
          borderColor: "#c678dd",
          backgroundColor: "rgba(198,120,221,0.08)",
          borderWidth: 2,
          tension: 0.3,
          pointBackgroundColor: "#c678dd"
        }
      ]
    },
    options: { responsive: true }
  });
}

function updateChart(history) {
  const reversed = [...history].reverse();
  const labels = reversed.map(item => {
    const d = new Date(item.timestamp);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + " " +
           d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  });
  chart.data.labels = labels;
  chart.data.datasets[0].data = reversed.map(item => item.systolic_bp);
  chart.data.datasets[1].data = reversed.map(item => item.glucose);
  chart.update();
}

initChart();
loadProfile();
