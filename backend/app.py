import os

from flask import Flask, request, jsonify
from flask_cors import CORS
from decimal import Decimal, InvalidOperation, DivisionByZero

app = Flask(__name__)
CORS(app)

MAX_DECIMAL_PLACES = 8


def calculate(num1: Decimal, num2: Decimal, operation: str) -> Decimal:
    if operation == "+":
        result = num1 + num2
    elif operation == "-":
        result = num1 - num2
    elif operation == "*":
        result = num1 * num2
    elif operation == "/":
        if num2 == 0:
            raise ZeroDivisionError("Division by zero")
        result = num1 / num2
    else:
        raise ValueError(f"Unknown operation: {operation}")

    return round(result, MAX_DECIMAL_PLACES)


@app.route("/api/calculate", methods=["POST"])
def api_calculate():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    try:
        num1 = Decimal(str(data.get("num1", "")))
        num2 = Decimal(str(data.get("num2", "")))
    except InvalidOperation:
        return jsonify({"error": "Invalid numbers"}), 400

    operation = data.get("operation", "")
    if operation not in ("+", "-", "*", "/"):
        return jsonify({"error": "Invalid operation"}), 400

    try:
        result = calculate(num1, num2, operation)
    except ZeroDivisionError:
        return jsonify({"error": "Division by zero"}), 400

    return jsonify({"result": float(result)})


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug, port=5000)
