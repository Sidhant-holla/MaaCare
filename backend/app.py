from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return "MaaCare Backend Running"


@app.route("/predict", methods=["POST"])
def predict():

    data = request.json

    bp = float(data["bp"])
    glucose = float(data["glucose"])
    weight = float(data["weight"])

    risk = "Low Risk"

    if bp > 140 or glucose > 150 or weight > 90:
        risk = "High Risk"

    return jsonify({
        "risk": risk
    })


if __name__ == "__main__":
    app.run(debug=True)