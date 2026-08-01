from sqlalchemy import (
    Date,
    JSON,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    profiles = relationship("FinancialProfile", back_populates="user", cascade="all, delete-orphan")
    holdings = relationship("InvestmentHolding", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")
    fire_plans = relationship("FirePlan", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")


class FinancialProfile(Base):
    __tablename__ = "financial_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    age = Column(Integer, nullable=False)
    country = Column(String(20), nullable=False, default="US")
    annual_income = Column(Float, nullable=False)
    monthly_expenses = Column(Float, nullable=False)
    cash_savings = Column(Float, nullable=False)
    total_assets = Column(Float, nullable=False)
    total_debt = Column(Float, nullable=False)
    dependents = Column(Integer, nullable=False, default=0)
    risk_tolerance = Column(String(20), nullable=False)
    knowledge_level = Column(String(20), nullable=False)
    goal_years = Column(Integer, nullable=False)
    target_amount = Column(Float, nullable=False)
    retirement_target_age = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="profiles")
    recommendations = relationship("Recommendation", back_populates="profile")
    fire_plans = relationship("FirePlan", back_populates="profile")


class InvestmentHolding(Base):
    __tablename__ = "investment_holdings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    asset_type = Column(String(50), nullable=False)
    instrument_name = Column(String(120), nullable=False)
    ticker = Column(String(20), nullable=True)
    amount_invested = Column(Float, nullable=False, default=0)
    current_value = Column(Float, nullable=False, default=0)
    purchase_date = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="holdings")


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    goal_type = Column(String(50), nullable=False)
    target_amount = Column(Float, nullable=False)
    target_year = Column(Integer, nullable=True)
    priority = Column(String(20), nullable=False, default="medium")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="goals")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    profile_id = Column(Integer, ForeignKey("financial_profiles.id"), nullable=False, index=True)
    risk_band = Column(String(30), nullable=False)
    suggested_allocation = Column(JSON, nullable=False)
    suggested_instruments = Column(JSON, nullable=False)
    explanation = Column(JSON, nullable=False)
    portfolio_insights = Column(JSON, nullable=False)
    learning_notes = Column(JSON, nullable=False)
    fire_summary = Column(JSON, nullable=False)
    volatility_note = Column(Text, nullable=False)
    model_confidence = Column(Float, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="recommendations")
    profile = relationship("FinancialProfile", back_populates="recommendations")


class FirePlan(Base):
    __tablename__ = "fire_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    profile_id = Column(Integer, ForeignKey("financial_profiles.id"), nullable=True, index=True)
    target_amount = Column(Float, nullable=False)
    annual_withdrawal_rate = Column(Float, nullable=False, default=0.04)
    current_portfolio = Column(Float, nullable=False)
    monthly_investment = Column(Float, nullable=False)
    annual_return_expectation = Column(Float, nullable=False)
    years_to_fire = Column(Float, nullable=True)
    projected_portfolio = Column(Float, nullable=False)
    required_nest_egg = Column(Float, nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="fire_plans")
    profile = relationship("FinancialProfile", back_populates="fire_plans")


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token = Column(String(255), nullable=False, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="sessions")


class MarketAsset(Base):
    __tablename__ = "market_assets"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(20), nullable=False, unique=True, index=True)
    instrument_name = Column(String(120), nullable=False)
    asset_class = Column(String(50), nullable=False)
    category = Column(String(50), nullable=False)
    risk_level = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    snapshots = relationship("MarketSnapshot", back_populates="asset", cascade="all, delete-orphan")


class MarketSnapshot(Base):
    __tablename__ = "market_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("market_assets.id"), nullable=False, index=True)
    snapshot_date = Column(Date, nullable=False, index=True)
    annual_return_1y = Column(Float, nullable=False, default=0)
    annualized_volatility_1y = Column(Float, nullable=False, default=0)
    max_drawdown_1y = Column(Float, nullable=False, default=0)
    expense_ratio = Column(Float, nullable=False, default=0)
    liquidity_score = Column(Float, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    asset = relationship("MarketAsset", back_populates="snapshots")
