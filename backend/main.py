from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.article import router as article_router

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(article_router, prefix="/api/article")


@app.get("/")
async def root():
    return {"message": "Hello World"}
