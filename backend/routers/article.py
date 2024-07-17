from typing import TypedDict
from random import randint
import csv
import os
import json

from bson import ObjectId
from fastapi import Request, APIRouter
from pydantic import BaseModel

from routers import mongo_client

router = APIRouter()
db = mongo_client["newsapi"]
collection = db["chip_war"]

# Change here. What keywords do you want to search?
keywords = ["SK Hynix", "Hynix"]


class Doc(TypedDict):
    _id: ObjectId
    url: str


class RequestBody(BaseModel):
    id: str
    text: list[str]
    error: str


query = {"paragraphs": {"$exists": False}}

##### MongoDB Version - Comment out below and uncomment CSV Version to switch the data type #####


# @router.get("/get_start")
# def get_start():
#     total = collection.count_documents(query)
#     doc: Doc = collection.find_one(query, skip=randint(0, total - 1))
#     result = {"id": doc["_id"].__str__(), "url": doc["url"], "keywords": keywords}
#     return result


# @router.post("/update")
# def update(request: Request, body: RequestBody):
#     collection.update_one(
#         {"_id": ObjectId(body.id)},
#         {"$set": {"paragraphs": body.text, "error": body.error}},
#     )

#     total = collection.count_documents(query)
#     doc: Doc = collection.find_one(query, skip=randint(0, total - 1))
#     result = {"id": doc["_id"].__str__(), "url": doc["url"]}
#     return result


##### CSV Version - Change the source and output csv file path below #####

source_path = "data/example.hynix.csv"
output_path = "data/example.hynix.output.csv"


@router.get("/get_start")
def get_start():
    skip = 0
    if os.path.isfile(output_path):
        with open(output_path, "r") as f:
            reader = csv.reader(f)
            reader.__next__()
            skip = sum(1 for _ in reader)
    with open(source_path, "r") as f:
        reader = csv.reader(f)
        reader.__next__()
        for _ in range(skip):
            reader.__next__()
        row = reader.__next__()
    result = {"id": json.dumps(row), "url": row[1], "keywords": keywords}
    return result


@router.post("/update")
def update(request: Request, body: RequestBody):
    if not os.path.isfile(output_path):
        with open(output_path, "w") as f:
            reader = csv.writer(f)
            reader.writerow(
                [
                    "index",
                    "url",
                    "title",
                    "date",
                    "press",
                    "text",
                    "paragraphs",
                    "error",
                ]
            )
            reader.writerow([*json.loads(body.id), body.text, body.error])
    else:
        with open(output_path, "a") as f:
            reader = csv.writer(f)
            reader.writerow([*json.loads(body.id), body.text, body.error])
    result = get_start()
    return result
