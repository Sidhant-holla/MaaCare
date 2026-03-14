from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient

app = Flask(__name__)
CORS(app)

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["MaaCare"]
collection = db["Readings"]


@app.route("/")
def home():
    return jsonify({"message": "MaaCare Backend Running"})


# Risk calculation logic
def calculate_risk(bp, glucose, weight):
    if bp > 140 or glucose > 150 or weight > 90:
        return "High Risk"
    elif bp >= 130 or glucose >= 130 or weight >= 80:
        return "Medium Risk"
    else:
        return "Low Risk"


# Predict risk and store reading
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        age = float(data["age"])
        bp = float(data["bp"])
        glucose = float(data["glucose"])
        weight = float(data["weight"])

        risk = calculate_risk(bp, glucose, weight)

        reading = {
            "age": age,
            "bp": bp,
            "glucose": glucose,
            "weight": weight,
            "risk": risk
        }

        # Save to MongoDB
        collection.insert_one(reading)

        # Get last 10 readings
        history = list(collection.find({}, {"_id": 0}).sort("_id", -1).limit(10))

        return jsonify({
            "risk": risk,
            "history": history
        })

    except Exception as e:
        return jsonify({
            "error": "Invalid input",
            "details": str(e)
        }), 400


# Get previous readings
@app.route("/readings", methods=["GET"])
def get_readings():
    history = list(collection.find({}, {"_id": 0}).sort("_id", -1).limit(10))
    return jsonify(history)


if __name__ == "__main__":
    app.run(debug=True, port=5000)