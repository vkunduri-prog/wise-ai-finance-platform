from sqlalchemy import create_engine
from sqlalchemy import inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

from .config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_runtime_schema():
    inspector = inspect(engine)
    if "recommendations" in inspector.get_table_names():
        columns = {column["name"] for column in inspector.get_columns("recommendations")}
        if "portfolio_insights" not in columns:
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE recommendations ADD COLUMN portfolio_insights JSON NULL"))
                connection.execute(text("UPDATE recommendations SET portfolio_insights = '[]' WHERE portfolio_insights IS NULL"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
