from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime

app = Flask(__name__)
CORS(app)

# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")
db = client["MaaCare"]
collection = db["Readings"]


@app.route("/")
def home():
    return jsonify({"message": "MaaCare Backend Running"})


# Risk logic
def calculate_risk(bp, glucose, bmi, age):
    score = 0

    if bp >= 140:
        score += 1
    if glucose >= 150:
        score += 1
    if bmi >= 30:
        score += 1
    if age >= 35:
        score += 1

    if score >= 2:
        return "High Risk"
    elif score == 1:
        return "Medium Risk"
    else:
        return "Low Risk"


# Prediction endpoint
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        pregnancies = int(data["pregnancies"])
        glucose = float(data["glucose"])
        bp = float(data["blood_pressure"])
        bmi = float(data["bmi"])
        age = int(data["age"])

        symptoms = data.get("symptoms", [])

        risk = calculate_risk(bp, glucose, bmi, age)

        reading = {
            "pregnancies": pregnancies,
            "glucose": glucose,
            "blood_pressure": bp,
            "bmi": bmi,
            "age": age,
            "symptoms": symptoms,
            "risk": risk,
            "timestamp": datetime.utcnow()
        }

        # Save to MongoDB
        collection.insert_one(reading)

        # Return last 10 readings
        history = list(collection.find({}, {"_id": 0}).sort("timestamp", -1).limit(10))

        return jsonify({
            "risk": risk,
            "history": history
        })

    except Exception as e:
        return jsonify({
            "error": "Invalid input",
            "details": str(e)
        }), 400


# Get readings for dashboard
@app.route("/readings", methods=["GET"])
def get_readings():
    history = list(collection.find({}, {"_id": 0}).sort("timestamp", -1).limit(10))
    return jsonify(history)


if __name__ == "__main__":
    app.run(debug=True, port=5000)