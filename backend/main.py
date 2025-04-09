from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import jieba
import redis
import json
import uvicorn
import os

app = FastAPI()

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0)
CACHE_EXPIRATION = 3600 # 1 hour n shyt

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/tokenize/cn")
async def tokenize_chinese(q: str = Query(..., description="Chinese text to tokenize")):
    # remove spaces
    q = q.replace(" ", "")
    
    # check if in cache
    cache_key = f"tokenize:{q}"
    cached_result = redis_client.get(cache_key)
    
    if cached_result:
        # return cached result
        return json.loads(cached_result)
    
    # tokenize text if not in cache
    tokens = list(jieba.cut(q, cut_all=False))
    result = {"tokens": tokens}
    
    # cache result
    redis_client.setex(
        cache_key, 
        CACHE_EXPIRATION,
        json.dumps(result, ensure_ascii=False)
    )
    
    return result

@app.get("/")
async def root():
    return {"msg": "yo"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 
    