from pydantic import BaseModel
from typing import List, Optional

class MountBase(BaseModel):
    name: str
    animal_type: str
    cosmetic_variant: int

class MountCreate(MountBase):
    pass

class Mount(MountBase):
    id: int
    owner_id: int

    class Config:
        from_attributes = True

class UnlockBase(BaseModel):
    item_type: str
    item_name: str

class Unlock(UnlockBase):
    id: int
    owner_id: int

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    name: str
    gender: str
    hair_style: str
    face_style: str
    shirt_color: str

class UserCreate(UserBase):
    starting_mount: MountCreate

class User(UserBase):
    id: int
    coins: int
    longest_distance: int
    speed_boost_level: int
    jump_height_level: int
    glide_level: int
    max_barn_stalls: int
    active_mount_id: Optional[int]
    mounts: List[Mount] = []
    unlocks: List[Unlock] = []

    class Config:
        from_attributes = True

class RunResult(BaseModel):
    coins_collected: int
    distance_run: int

class StorePurchase(BaseModel):
    item_type: str # upgrade, theme, cosmetic, barn_stall
    item_name: str # e.g., 'speed_boost', 'volcano_theme'
    cost: int
    animal_type: Optional[str] = None # For barn stall mounts
    cosmetic_variant: Optional[int] = None # For barn stall mounts
    mount_name: Optional[str] = None # For barn stall mounts
