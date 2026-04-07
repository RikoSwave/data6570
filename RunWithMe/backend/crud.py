from sqlalchemy.orm import Session
import models, schemas
from fastapi import HTTPException

def get_user_by_name(db: Session, name: str):
    return db.query(models.User).filter(models.User.name == name).first()

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_all_users(db: Session):
    return db.query(models.User).all()

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(
        name=user.name,
        gender=user.gender,
        hair_style=user.hair_style,
        face_style=user.face_style,
        shirt_color=user.shirt_color
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Create starting mount
    db_mount = models.Mount(
        owner_id=db_user.id,
        name=user.starting_mount.name,
        animal_type=user.starting_mount.animal_type,
        cosmetic_variant=user.starting_mount.cosmetic_variant
    )
    db.add(db_mount)
    db.commit()
    db.refresh(db_mount)

    db_user.active_mount_id = db_mount.id
    db.commit()
    db.refresh(db_user)
    return db_user

def save_run(db: Session, user_id: int, result: schemas.RunResult):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.coins += result.coins_collected
    if result.distance_run > user.longest_distance:
        user.longest_distance = result.distance_run
        
    db.commit()
    db.refresh(user)
    return user

def buy_item(db: Session, user_id: int, purchase: schemas.StorePurchase):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.coins < purchase.cost:
        raise HTTPException(status_code=400, detail="Not enough coins")
        
    user.coins -= purchase.cost
    
    if purchase.item_type == "theme" or purchase.item_type == "cosmetic":
        # Check if already unlocked
        existing = db.query(models.Unlock).filter(
            models.Unlock.owner_id == user_id, 
            models.Unlock.item_name == purchase.item_name
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Item already unlocked")
            
        unlock = models.Unlock(
            owner_id=user.id,
            item_type=purchase.item_type,
            item_name=purchase.item_name
        )
        db.add(unlock)
        
    elif purchase.item_type == "upgrade":
        if purchase.item_name == "speed_boost":
            user.speed_boost_level += 1
        elif purchase.item_name == "jump_height":
            user.jump_height_level += 1
        elif purchase.item_name == "glide":
            user.glide_level += 1
            
    elif purchase.item_type == "barn_stall":
        if user.max_barn_stalls >= 6:
             raise HTTPException(status_code=400, detail="Max barn stalls reached")
             
        user.max_barn_stalls += 1
        # Unlock the specific mount variant
        new_mount = models.Mount(
            owner_id=user.id,
            name=purchase.mount_name or "New Pet",
            animal_type=purchase.animal_type,
            cosmetic_variant=purchase.cosmetic_variant
        )
        db.add(new_mount)
        
    db.commit()
    db.refresh(user)
    return user

def set_active_mount(db: Session, user_id: int, mount_id: int):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    mount = db.query(models.Mount).filter(models.Mount.id == mount_id, models.Mount.owner_id == user_id).first()
    if not mount:
        raise HTTPException(status_code=404, detail="Mount not found")
        
    user.active_mount_id = mount.id
    db.commit()
    db.refresh(user)
    return user
