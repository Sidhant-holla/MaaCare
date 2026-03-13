from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Temporary in-memory history for demo
# This resets whenever the server restarts
readings_history = []


@app.route("/")
def home():
    return jsonify({"message": "MaaCare Backend Running"})


def calculate_risk(bp, glucose, weight):
    if bp > 140 or glucose > 150 or weight > 90:
        return "High Risk"
    elif bp >= 130 or glucose >= 130 or weight >= 80:
        return "Medium Risk"
    else:
        return "Low Risk"


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

        readings_history.append(reading)

        return jsonify({
            "risk": risk,
            "history": readings_history[-10:]
        })

    except Exception as e:
        return jsonify({
            "error": "Invalid input",
            "details": str(e)
        }), 400


@app.route("/readings", methods=["GET"])
def get_readings():
    return jsonify(readings_history[-10:])


if __name__ == "__main__":
    app.run(debug=True, port=5000)