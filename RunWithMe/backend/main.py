from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models, schemas, crud
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Run With Me - Backend API")

# Setup CORS for local network play
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins on local network for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_name(db, name=user.name)
    if db_user:
        raise HTTPException(status_code=400, detail="Name already registered")
    return crud.create_user(db=db, user=user)

@app.get("/users/", response_model=List[schemas.User])
def read_users(db: Session = Depends(get_db)):
    users = crud.get_all_users(db)
    return users

@app.get("/users/{user_id}", response_model=schemas.User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@app.patch("/users/{user_id}/run", response_model=schemas.User)
def save_user_run(user_id: int, result: schemas.RunResult, db: Session = Depends(get_db)):
    return crud.save_run(db, user_id, result)

@app.post("/users/{user_id}/store/buy", response_model=schemas.User)
def buy_store_item(user_id: int, purchase: schemas.StorePurchase, db: Session = Depends(get_db)):
    return crud.buy_item(db, user_id, purchase)

@app.post("/users/{user_id}/barn/mount/{mount_id}", response_model=schemas.User)
def set_active_mount(user_id: int, mount_id: int, db: Session = Depends(get_db)):
    return crud.set_active_mount(db, user_id, mount_id)
