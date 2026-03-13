// Main function triggered when "Analyze Risk" button is clicked
async function analyze() {

let bp = document.getElementById("bp").value
let glucose = document.getElementById("glucose").value
let weight = document.getElementById("weight").value

// Basic validation
if(!bp || !glucose || !weight){
alert("Please fill all vitals")
return
}

// -----------------------------
// TEMPORARY DEMO LOGIC
// (replace with backend API tomorrow)
// -----------------------------

let risk = calculateRisk(bp, glucose, weight)

displayRisk(risk)

}


// Temporary risk logic for demo
function calculateRisk(bp, glucose, weight){

bp = parseFloat(bp)
glucose = parseFloat(glucose)
weight = parseFloat(weight)

let risk = "Low Risk"

if(bp > 140 || glucose > 150 || weight > 90){
risk = "High Risk"
}

return risk

}


// Display result in dashboard
function displayRisk(risk){

let box = document.getElementById("riskBox")

box.innerText = risk

if(risk === "High Risk"){
box.className = "risk high"
}else{
box.className = "risk low"
}

}


// ---------------------------------
// Chart initialization
// ---------------------------------

const ctx = document.getElementById("chart");

new Chart(ctx, {
type: "line",
data: {
labels: ["Week 1","Week 2","Week 3","Week 4"],
datasets: [{
label: "Blood Pressure Trend",
data: [120, 125, 135, 140],
borderWidth: 2,
tension: 0.3
}]
},
options: {
responsive: true,
plugins:{
legend:{
display:true
}
}
}
})