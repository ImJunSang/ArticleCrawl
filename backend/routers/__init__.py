from pymongo import MongoClient

from config import config

mongo_client = MongoClient(
    config["mongo_uri"], tls=True, tlsAllowInvalidCertificates=True, tz_aware=True
)
db = mongo_client[config["db"]]
