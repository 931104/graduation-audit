from fastapi import FastAPI
from api.route import upload, students, graduation

app = FastAPI(
    title="Graduation Check System API",
    description="NCCU Graduation Audit API",
    version="1.0.0"
)

app.include_router(upload.router)
app.include_router(students.router)
app.include_router(graduation.router)

@app.get("/")
def root():
    return {
        "message": "Welcome to Graduation Check System API",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "API is running"
    }