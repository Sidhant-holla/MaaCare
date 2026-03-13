const API_URL = "http://127.0.0.1:5000";

let chart;

// Main function triggered when "Analyze Risk" button is clicked
async function analyze() {
  let age = document.getElementById("age").value;
  let bp = document.getElementById("bp").value;
  let glucose = document.getElementById("glucose").value;
  let weight = document.getElementById("weight").value;

  // Basic validation
  if (!age || !bp || !glucose || !weight) {
    alert("Please fill all vitals");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        age,
        bp,
        glucose,
        weight
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    displayRisk(data.risk);
    updateChart(data.history);

  } catch (error) {
    console.error(error);
    alert("Backend not running or request failed");
  }
}

// Display result in dashboard
function displayRisk(risk) {
  let box = document.getElementById("riskBox");
  box.innerText = risk;

  if (risk === "High Risk") {
    box.className = "risk high";
  } else if (risk === "Medium Risk") {
    box.className = "risk medium";
  } else {
    box.className = "risk low";
  }
}

// Chart initialization
function initChart() {
  const ctx = document.getElementById("chart").getContext("2d");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Blood Pressure Trend",
        data: [],
        borderWidth: 2,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true
        }
      }
    }
  });
}

function updateChart(history) {
  const labels = history.map((item, index) => `Reading ${index + 1}`);
  const bpData = history.map((item) => item.bp);

  chart.data.labels = labels;
  chart.data.datasets[0].data = bpData;
  chart.update();
}

async function loadHistory() {
  try {
    const response = await fetch(`${API_URL}/readings`);
    const data = await response.json();
    updateChart(data);
  } catch (error) {
    console.log("No history yet");
  }
}

initChart();
loadHistory();