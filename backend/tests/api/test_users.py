def test_create_user(client):
    response = client.post("/auth/register/", json={
        "full_name": "Test user",
        "email": "test_user@email.com",
        "phone_country_code": "+91",
        "phone_number": "0000000000",
        "password": "Password@123",
        "date_of_birth": "1990-01-01"
    })
    
    assert response.status_code == 201
    
    data = response.json()
    assert data["email"] == "test_user@email.com"
    
    
def test_login_user(client):
    client.post("/auth/register/", json={
        "full_name": "Test user",
        "email": "test_user@email.com",
        "phone_country_code": "+91",
        "phone_number": "0000000000",
        "password": "Password@123",
        "date_of_birth": "1990-01-01"
    })
    
    response = client.post("/auth/login", json={
        "email": "test_user@email.com",
        "password": "Password@123"
    })
    
    print("\nFASTAPI 422 ERROR DETAILS:", response.json())
    
    assert response.status_code == 200
    