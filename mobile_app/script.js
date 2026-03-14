const API_URL = "http://127.0.0.1:8000";

let chart;



/* PREGNANCY PROGRESS */

function updatePregnancy(){

let weeks=document.getElementById("weeks").value;
let progressBar=document.getElementById("progress");

let progress=(weeks/40)*100;

progressBar.style.width=progress+"%";

let stage="";

if(weeks<=12){

progressBar.style.background="#ff4da6";
stage="First Trimester";

}

else if(weeks<=26){

progressBar.style.background="#ffa500";
stage="Second Trimester";

}

else{

progressBar.style.background="#4CAF50";
stage="Third Trimester";

}

document.getElementById("weekText").innerText=
"Week "+weeks+" • "+stage;

}

document.getElementById("weeks").addEventListener("input",updatePregnancy);




/* ANALYZE */

async function analyze(){

let pregnancies=document.getElementById("pregnancies").value;
let glucose=document.getElementById("glucose").value;
let bp=document.getElementById("bp").value;
let weight=document.getElementById("weight").value;
let height=document.getElementById("height").value;
let age=document.getElementById("age").value;

if(!pregnancies || !glucose || !bp || !weight || !height || !age){

alert("Please fill all vitals");
return;

}

let bmi=weight/(height*height);

checkSymptoms(bp);

try{

const response=await fetch(`${API_URL}/predict`,{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

pregnancies,
glucose,
bp,
bmi,
age,
symptoms:getSymptoms()

})

});

const data=await response.json();

displayRisk(data.risk);
updateChart(data.history);

}

catch(error){

alert("Backend not running");

}

}



/* RISK DISPLAY */

function displayRisk(risk){

let box=document.getElementById("riskBox");

box.innerText=risk;

box.className="risk";

if(risk==="High Risk") box.classList.add("high");
else if(risk==="Medium Risk") box.classList.add("medium");
else box.classList.add("low");

}



/* SYMPTOM LOGIC */

function getSymptoms(){
let ids=["headache","blurred","vomiting","dizziness","swelling","bleeding","contractions","movement","fatigue"];
return ids.filter(id=>document.getElementById(id).checked);
}

function checkSymptoms(bp){

let headache=document.getElementById("headache").checked;
let blurred=document.getElementById("blurred").checked;
let vomiting=document.getElementById("vomiting").checked;
let dizziness=document.getElementById("dizziness").checked;
let swelling=document.getElementById("swelling").checked;
let bleeding=document.getElementById("bleeding").checked;
let contractions=document.getElementById("contractions").checked;
let movement=document.getElementById("movement").checked;
let fatigue=document.getElementById("fatigue").checked;

let alertBox=document.getElementById("alertBox");

alertBox.innerHTML="";

if(headache && blurred && bp>140){

alertBox.innerHTML=
"<div class='alert alert-danger'>Possible signs of preeclampsia detected. Please consult a doctor if symptoms persist.</div>";

}

else if(contractions && movement){

alertBox.innerHTML=
"<div class='alert alert-danger'>Possible early labor or fetal distress symptoms. Seek medical advice immediately.</div>";

}

else if(swelling && headache){

alertBox.innerHTML=
"<div class='alert alert-warning'>Possible hypertension related symptoms. Monitor BP and consult a doctor if needed.</div>";

}

else if(vomiting && dizziness){

alertBox.innerHTML=
"<div class='alert alert-warning'>Possible dehydration or anemia symptoms.</div>";

}

else if(fatigue && dizziness){

alertBox.innerHTML=
"<div class='alert alert-warning'>Possible anemia or nutritional deficiency.</div>";

}

else if(bleeding){

alertBox.innerHTML=
"<div class='alert alert-danger'>Bleeding detected. Immediate medical attention recommended.</div>";

}

}




/* CHART */

function initChart(){

const ctx=document.getElementById("chart").getContext("2d");

chart=new Chart(ctx,{

type:"line",

data:{

labels:[],

datasets:[{

label:"Blood Pressure",

data:[],
borderWidth:2,
tension:0.3

}]

},

options:{
responsive:true
}

});

}



function updateChart(history){

const labels=history.map((item,index)=>`Reading ${index+1}`);
const bpData=history.map(item=>item.blood_pressure);

chart.data.labels=labels;
chart.data.datasets[0].data=bpData;

chart.update();

}



initChart();