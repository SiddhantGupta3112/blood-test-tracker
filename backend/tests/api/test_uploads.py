from pathlib import Path

def test_upload_requires_auth(client):
    response = client.post(
        "/pdf/upload",
        files={"file": ("test.txt", b"some content", "text/plain")}
    )
    assert response.status_code == 401


def test_upload_rejects_non_pdf(client):
    register_resp = client.post("/auth/register/", json={
        "full_name": "Test user",
        "email": "test_user@email.com",
        "phone_country_code": "+91",
        "phone_number": "0000000000",
        "password": "Password@123",
        "date_of_birth": "1990-01-01"
    })

    login_resp = client.post("/auth/login", json={
        "email": "test_user@email.com",
        "password": "Password@123"
    })
    token = login_resp.json()["access_token"]

    response = client.post(
        "/pdf/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("test.txt", b"some content", "text/plain")}
    )
    assert response.status_code == 400
    
def test_upload_accepts_pdf(client):
    pdf_path = Path("tests/fixtures/sample_blood_report.pdf")

    client.post("/auth/register/", json={
        "full_name": "Test user",
        "email": "test_user@email.com",
        "password": "Password@123"
    })
    login_resp = client.post("/auth/login", json={
        "email": "test_user@email.com",
        "password": "Password@123"
    })
    token = login_resp.json()["access_token"]

    with open(pdf_path, "rb") as f:
        response = client.post(
            "/pdf/upload",
            headers={"Authorization": f"Bearer {token}"},
            files={"file": ("test.pdf", f, "application/pdf")}
        )

    assert response.status_code == 201
    data = response.json()
    assert "report_id" in data
    assert len(data["report_data"]) > 0