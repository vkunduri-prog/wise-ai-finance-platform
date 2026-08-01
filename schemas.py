from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field


RiskTolerance = Literal["low", "moderate", "high"]
KnowledgeLevel = Literal["beginner", "intermediate", "advanced"]
Country = Literal["US"]


class SignupIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    user: UserOut
    token: str
    message: str


class FinancialProfileBase(BaseModel):
    age: int = Field(ge=18, le=100)
    annual_income: float = Field(ge=0)
    monthly_expenses: float = Field(ge=0)
    cash_savings: float = Field(ge=0)
    total_assets: float = Field(ge=0)
    total_debt: float = Field(ge=0)
    dependents: int = Field(default=0, ge=0, le=20)
    risk_tolerance: RiskTolerance
    knowledge_level: KnowledgeLevel
    goal_years: int = Field(ge=1, le=50)
    target_amount: float = Field(ge=0)
    retirement_target_age: Optional[int] = Field(default=None, ge=30, le=90)
    country: Country = "US"
    notes: Optional[str] = Field(default=None, max_length=1000)


class FinancialProfileCreate(FinancialProfileBase):
    user_id: int


class FinancialProfileOut(FinancialProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


class InvestmentHoldingIn(BaseModel):
    user_id: int
    asset_type: str = Field(min_length=2, max_length=50)
    instrument_name: str = Field(min_length=2, max_length=120)
    ticker: Optional[str] = Field(default=None, max_length=20)
    amount_invested: float = Field(ge=0)
    current_value: float = Field(ge=0)
    purchase_date: Optional[str] = Field(default=None, max_length=20)


class InvestmentHoldingOut(InvestmentHoldingIn):
    id: int

    class Config:
        from_attributes = True


class GoalIn(BaseModel):
    user_id: int
    goal_type: str = Field(min_length=2, max_length=50)
    target_amount: float = Field(ge=0)
    target_year: Optional[int] = Field(default=None, ge=2024, le=2100)
    priority: Literal["low", "medium", "high"] = "medium"


class GoalOut(GoalIn):
    id: int

    class Config:
        from_attributes = True


class RecommendationRequest(BaseModel):
    user_id: int
    profile_id: Optional[int] = None


class RecommendedInstrument(BaseModel):
    asset_class: str
    instrument_name: str
    ticker: str
    category: str
    risk_level: str
    rationale: str
    annual_return_1y: float = 0.0
    annualized_volatility_1y: float = 0.0
    max_drawdown_1y: float = 0.0
    expense_ratio: float = 0.0
    liquidity_score: float = 0.0


class RecommendationOut(BaseModel):
    id: Optional[int] = None
    user_id: Optional[int] = None
    profile_id: Optional[int] = None
    risk_band: str
    suggested_allocation: Dict[str, float]
    suggested_instruments: List[RecommendedInstrument]
    explanation: List[str]
    portfolio_insights: List[str]
    learning_notes: List[str]
    fire_summary: Dict[str, Any]
    volatility_note: str
    model_confidence: float

    class Config:
        from_attributes = True


class LearningPathIn(BaseModel):
    knowledge_level: KnowledgeLevel
    risk_tolerance: RiskTolerance
    goal_years: int = Field(ge=1, le=50)


class LearningPathOut(BaseModel):
    path: List[str]


class FireCalcIn(BaseModel):
    user_id: int
    profile_id: Optional[int] = None
    current_age: int = Field(ge=18, le=100)
    target_amount: float = Field(ge=0)
    current_portfolio: float = Field(ge=0)
    monthly_investment: float = Field(ge=0)
    annual_return_expectation: float = Field(ge=0, le=1)
    annual_withdrawal_rate: float = Field(default=0.04, ge=0.01, le=0.1)


class FireCalcOut(BaseModel):
    id: Optional[int] = None
    user_id: Optional[int] = None
    profile_id: Optional[int] = None
    required_nest_egg: float
    years_to_fire: Optional[float]
    projected_portfolio: float
    message: str


class DashboardOut(BaseModel):
    user: UserOut
    profile: Optional[FinancialProfileOut]
    latest_recommendation: Optional[RecommendationOut]
    latest_fire_plan: Optional[FireCalcOut]
    holdings: List[InvestmentHoldingOut]
    goals: List[GoalOut]
    analytics: Dict[str, Any]


class MarketSnapshotInstrument(BaseModel):
    asset_class: str
    instrument_name: str
    ticker: str
    category: str
    risk_level: str
    annual_return_1y: float
    annualized_volatility_1y: float
    max_drawdown_1y: float
    expense_ratio: float
    liquidity_score: float


class MarketSnapshotOut(BaseModel):
    data_available: bool
    instruments: List[MarketSnapshotInstrument]


class MarketSyncOut(BaseModel):
    synced_assets: int
    synced_snapshots: int
    snapshot_date: Optional[str]
