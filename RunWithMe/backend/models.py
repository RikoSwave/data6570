from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    gender = Column(String)  # boy or girl
    hair_style = Column(String)
    face_style = Column(String)
    shirt_color = Column(String)
    coins = Column(Integer, default=0)
    longest_distance = Column(Integer, default=0)
    speed_boost_level = Column(Integer, default=0)
    jump_height_level = Column(Integer, default=0)
    glide_level = Column(Integer, default=0)
    max_barn_stalls = Column(Integer, default=1)
    active_mount_id = Column(Integer, nullable=True)

    mounts = relationship("Mount", back_populates="owner")
    unlocks = relationship("Unlock", back_populates="owner")

class Mount(Base):
    __tablename__ = "mounts"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    animal_type = Column(String)  # dinosaur, pig, wingless dragon, unicorn, cat, dog
    cosmetic_variant = Column(Integer)  # 1, 2, or 3

    owner = relationship("User", back_populates="mounts")

class Unlock(Base):
    __tablename__ = "unlocks"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    item_type = Column(String) # theme, cosmetic
    item_name = Column(String)

    owner = relationship("User", back_populates="unlocks")
