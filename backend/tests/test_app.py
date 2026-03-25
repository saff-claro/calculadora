import pytest
from decimal import Decimal
from backend.app import app, calculate


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


# ── unit tests for the pure calculate() function ──────────────────────────────

class TestCalculateFunction:
    def test_addition(self):
        assert calculate(Decimal("1"), Decimal("2"), "+") == Decimal("3")

    def test_subtraction(self):
        assert calculate(Decimal("5"), Decimal("3"), "-") == Decimal("2")

    def test_multiplication(self):
        assert calculate(Decimal("4"), Decimal("3"), "*") == Decimal("12")

    def test_division(self):
        assert calculate(Decimal("10"), Decimal("4"), "/") == Decimal("2.5")

    def test_division_by_zero(self):
        with pytest.raises(ZeroDivisionError):
            calculate(Decimal("1"), Decimal("0"), "/")

    def test_decimal_precision(self):
        result = calculate(Decimal("1"), Decimal("3"), "/")
        # result must have at most 8 decimal places
        assert result == round(Decimal("1") / Decimal("3"), 8)

    def test_unknown_operation(self):
        with pytest.raises(ValueError):
            calculate(Decimal("1"), Decimal("2"), "^")


# ── integration tests for the HTTP endpoint ───────────────────────────────────

class TestApiCalculate:
    def _post(self, client, payload):
        return client.post("/api/calculate", json=payload)

    def test_add(self, client):
        r = self._post(client, {"num1": 1, "num2": 2, "operation": "+"})
        assert r.status_code == 200
        assert r.get_json()["result"] == 3.0

    def test_subtract(self, client):
        r = self._post(client, {"num1": 10, "num2": 4, "operation": "-"})
        assert r.status_code == 200
        assert r.get_json()["result"] == 6.0

    def test_multiply(self, client):
        r = self._post(client, {"num1": 3, "num2": 7, "operation": "*"})
        assert r.status_code == 200
        assert r.get_json()["result"] == 21.0

    def test_divide(self, client):
        r = self._post(client, {"num1": 7, "num2": 2, "operation": "/"})
        assert r.status_code == 200
        assert r.get_json()["result"] == 3.5

    def test_divide_by_zero(self, client):
        r = self._post(client, {"num1": 5, "num2": 0, "operation": "/"})
        assert r.status_code == 400
        assert "zero" in r.get_json()["error"].lower()

    def test_invalid_operation(self, client):
        r = self._post(client, {"num1": 1, "num2": 2, "operation": "^"})
        assert r.status_code == 400

    def test_invalid_numbers(self, client):
        r = self._post(client, {"num1": "abc", "num2": 2, "operation": "+"})
        assert r.status_code == 400

    def test_missing_body(self, client):
        r = client.post("/api/calculate", data="not json",
                        content_type="text/plain")
        assert r.status_code == 400

    def test_result_max_8_decimal_places(self, client):
        r = self._post(client, {"num1": 1, "num2": 3, "operation": "/"})
        assert r.status_code == 200
        result = r.get_json()["result"]
        # Python float repr may have many digits; check via string
        decimal_part = str(result).split(".")[-1] if "." in str(result) else ""
        assert len(decimal_part) <= 8

    def test_negative_numbers(self, client):
        r = self._post(client, {"num1": -5, "num2": 3, "operation": "+"})
        assert r.status_code == 200
        assert r.get_json()["result"] == -2.0

    def test_float_inputs(self, client):
        r = self._post(client, {"num1": 0.1, "num2": 0.2, "operation": "+"})
        assert r.status_code == 200
        # 0.1 + 0.2 = 0.3 after 8-decimal rounding
        assert abs(r.get_json()["result"] - 0.3) < 1e-7
