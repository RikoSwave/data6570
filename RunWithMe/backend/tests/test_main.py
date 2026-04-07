from fastapi.testclient import TestClient
import os
import sys

# Ensure backend module can be found
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.main import app
from backend.database import Base, engine

# Ensure fresh DB for tests
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_create_user():
    response = client.post(
        "/users/",
        json={
            "name": "TestKid",
            "gender": "boy",
            "hair_style": "spiky",
            "face_style": "smile",
            "shirt_color": "blue",
            "starting_mount": {
                "name": "Rex",
                "animal_type": "dinosaur",
                "cosmetic_variant": 1
            }
        }
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == "TestKid"
    assert "id" in data
    assert data["coins"] == 0
    assert len(data["mounts"]) == 1
    assert data["active_mount_id"] == data["mounts"][0]["id"]

def test_read_users():
    response = client.get("/users/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0 # At least TestKid

def test_save_run():
    users = client.get("/users/").json()
    user_id = users[0]["id"]
    
    response = client.patch(
        f"/users/{user_id}/run",
        json={
            "coins_collected": 50,
            "distance_run": 1000
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["coins"] == 50
    assert data["longest_distance"] == 1000

def test_buy_item():
    users = client.get("/users/").json()
    user_id = users[0]["id"]
    
    response = client.post(
        f"/users/{user_id}/store/buy",
        json={
            "item_type": "upgrade",
            "item_name": "speed_boost",
            "cost": 10
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["coins"] == 40
    assert data["speed_boost_level"] == 1

def test_buy_barn_stall():
    users = client.get("/users/").json()
    user_id = users[0]["id"]
    
    response = client.post(
        f"/users/{user_id}/store/buy",
        json={
            "item_type": "barn_stall",
            "item_name": "add_stall",
            "cost": 20,
            "animal_type": "pig",
            "cosmetic_variant": 2,
            "mount_name": "Oink"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["coins"] == 20
    assert data["max_barn_stalls"] == 2
    assert len(data["mounts"]) == 2

def test_set_active_mount():
    users = client.get("/users/").json()
    user_id = users[0]["id"]
    mounts = users[0]["mounts"]
    new_mount_id = mounts[-1]["id"]
    
    response = client.post(f"/users/{user_id}/barn/mount/{new_mount_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["active_mount_id"] == new_mount_id
