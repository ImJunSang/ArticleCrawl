from typing_extensions import TypedDict
from random import randint

from bson import ObjectId
from fastapi import Request, APIRouter
from pydantic import BaseModel

from routers import mongo_client

router = APIRouter()
db = mongo_client["newsapi"]
collection = db["chip_war"]

# Change here. What keywords do you want to search?
keywords = ["Samsung", "Korea"]


class Doc(TypedDict):
    _id: ObjectId
    url: str


class RequestBody(BaseModel):
    id: str
    text: list[str]
    error: str


query = {"paragraphs": {"$exists": False}}

# If you want to save as a csv file,
# you can modify functions below using not MongoDB but local csv file.


@router.get("/url_to_update")
def session_login():
    total = collection.count_documents(query)
    doc: Doc = collection.find_one(query, skip=randint(0, total - 1))
    result = {"id": doc["_id"].__str__(), "url": doc["url"], "keywords": keywords}
    return result


@router.post("/update")
def session_check(request: Request, body: RequestBody):
    collection.update_one(
        {"_id": ObjectId(body.id)},
        {"$set": {"paragraphs": body.text, "error": body.error}},
    )

    total = collection.count_documents(query)
    doc: Doc = collection.find_one(query, skip=randint(0, total - 1))
    result = {"id": doc["_id"].__str__(), "url": doc["url"]}
    return result
