const API_URL = "http://127.0.0.1:8000";

// Auth
const token = localStorage.getItem("token");
const username = localStorage.getItem("username");

if (!token) {
  window.location.href = "login.html";
}

document.getElementById("usernameDisplay").textContent = username ? `Hi, ${username}` : "";

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  window.location.href = "login.html";
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}


/* PREGNANCY PROGRESS */

function updatePregnancy() {
  let weeksInput = document.getElementById("weeks");
  let val = parseInt(weeksInput.value);

  // Hard clamp — prevent any value outside 1–42
  if (val > 42) { weeksInput.value = 42; val = 42; }
  if (val < 1 && weeksInput.value !== "") { weeksInput.value = 1; val = 1; }

  document.getElementById("weeksError").textContent =
    weeksInput.value === "" ? "" : "";

  let progressBar = document.getElementById("progress");
  let progress = (val / 40) * 100;
  progressBar.style.width = progress + "%";

  let stage = "";
  if (val <= 12) {
    progressBar.style.background = "#ff4da6";
    stage = "First Trimester";
  } else if (val <= 26) {
    progressBar.style.background = "#ffa500";
    stage = "Second Trimester";
  } else {
    progressBar.style.background = "#4CAF50";
    stage = "Third Trimester";
  }

  document.getElementById("weekText").innerText = "Week " + val + " • " + stage;
}

document.getElementById("weeks").addEventListener("input", updatePregnancy);

// Clear field errors as user types
["pregnancies", "glucose", "bp", "weight", "height", "age"].forEach(id => {
  document.getElementById(id).addEventListener("input", () => {
    document.getElementById(id + "Error").textContent = "";
  });
});


/* ANALYZE */

function fieldError(id, msg) {
  document.getElementById(id + "Error").textContent = msg;
}

function clearErrors() {
  ["pregnancies", "glucose", "bp", "weight", "height", "age"].forEach(id => {
    document.getElementById(id + "Error").textContent = "";
  });
}

async function analyze() {
  clearErrors();

  let pregnancies = parseFloat(document.getElementById("pregnancies").value);
  let glucose = parseFloat(document.getElementById("glucose").value);
  let bp = parseFloat(document.getElementById("bp").value);
  let weight = parseFloat(document.getElementById("weight").value);
  let height = parseFloat(document.getElementById("height").value);
  let age = parseFloat(document.getElementById("age").value);

  let hasError = false;

  if (isNaN(pregnancies)) { fieldError("pregnancies", "Required"); hasError = true; }
  else if (pregnancies < 0 || pregnancies > 20) { fieldError("pregnancies", "Enter a value between 0 and 20"); hasError = true; }

  if (isNaN(glucose)) { fieldError("glucose", "Required"); hasError = true; }
  else if (glucose < 50 || glucose > 400) { fieldError("glucose", "Normal range is 50–400 mg/dL"); hasError = true; }

  if (isNaN(bp)) { fieldError("bp", "Required"); hasError = true; }
  else if (bp < 50 || bp > 250) { fieldError("bp", "Normal range is 50–250 mmHg"); hasError = true; }

  if (isNaN(weight)) { fieldError("weight", "Required"); hasError = true; }
  else if (weight < 30 || weight > 200) { fieldError("weight", "Enter a value between 30 and 200 kg"); hasError = true; }

  if (isNaN(height)) { fieldError("height", "Required"); hasError = true; }
  else if (height < 1.0 || height > 2.5) { fieldError("height", "Enter a value between 1.0 and 2.5 m"); hasError = true; }

  if (isNaN(age)) { fieldError("age", "Required"); hasError = true; }
  else if (age < 10 || age > 60) { fieldError("age", "Enter a value between 10 and 60"); hasError = true; }

  if (hasError) return;

  let bmi = weight / (height * height);

  checkSymptoms(bp);

  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ pregnancies, glucose, bp, bmi, age, symptoms: getSymptoms() })
    });

    if (response.status === 401) {
      logout();
      return;
    }

    const data = await response.json();
    displayRisk(data.risk);
    updateChart(data.history);
  } catch (error) {
    alert("Backend not running");
  }
}


/* RISK DISPLAY */

function displayRisk(risk) {
  let box = document.getElementById("riskBox");
  box.innerText = risk;
  box.className = "risk";
  if (risk === "High Risk") box.classList.add("high");
  else if (risk === "Medium Risk") box.classList.add("medium");
  else box.classList.add("low");
}


/* SYMPTOM LOGIC */

function getSymptoms() {
  let ids = ["headache", "blurred", "vomiting", "dizziness", "swelling", "bleeding", "contractions", "movement", "fatigue"];
  return ids.filter(id => document.getElementById(id).checked);
}

function checkSymptoms(bp) {
  let headache = document.getElementById("headache").checked;
  let blurred = document.getElementById("blurred").checked;
  let vomiting = document.getElementById("vomiting").checked;
  let dizziness = document.getElementById("dizziness").checked;
  let swelling = document.getElementById("swelling").checked;
  let bleeding = document.getElementById("bleeding").checked;
  let contractions = document.getElementById("contractions").checked;
  let movement = document.getElementById("movement").checked;
  let fatigue = document.getElementById("fatigue").checked;

  let alertBox = document.getElementById("alertBox");
  alertBox.innerHTML = "";

  if (headache && blurred && bp > 140) {
    alertBox.innerHTML = "<div class='alert alert-danger'>Possible signs of preeclampsia detected. Please consult a doctor if symptoms persist.</div>";
  } else if (contractions && movement) {
    alertBox.innerHTML = "<div class='alert alert-danger'>Possible early labor or fetal distress symptoms. Seek medical advice immediately.</div>";
  } else if (swelling && headache) {
    alertBox.innerHTML = "<div class='alert alert-warning'>Possible hypertension related symptoms. Monitor BP and consult a doctor if needed.</div>";
  } else if (vomiting && dizziness) {
    alertBox.innerHTML = "<div class='alert alert-warning'>Possible dehydration or anemia symptoms.</div>";
  } else if (fatigue && dizziness) {
    alertBox.innerHTML = "<div class='alert alert-warning'>Possible anemia or nutritional deficiency.</div>";
  } else if (bleeding) {
    alertBox.innerHTML = "<div class='alert alert-danger'>Bleeding detected. Immediate medical attention recommended.</div>";
  }
}


/* CHART */

let chart;

function initChart() {
  const ctx = document.getElementById("chart").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Blood Pressure",
        data: [],
        borderColor: "#ff4da6",
        backgroundColor: "rgba(255,77,166,0.08)",
        borderWidth: 2,
        tension: 0.3,
        pointBackgroundColor: "#ff4da6"
      }]
    },
    options: { responsive: true }
  });
}

function updateChart(history) {
  const labels = history.map((_, index) => `Reading ${index + 1}`);
  const bpData = history.map(item => item.blood_pressure);
  chart.data.labels = labels;
  chart.data.datasets[0].data = bpData;
  chart.update();
}

initChart();
