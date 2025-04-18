from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import jieba
import uvicorn
import os


import CDict
from contextlib import asynccontextmanager


c_dict : CDict.CDict = None
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load
    # global jp_dict
    global c_dict
    # with open("./data/jmdict.pkl", "rb") as f:
    #     jp_dict = pickle.load(f)
    # with open("./data/cedict_ts.txt", "rb") as f:
        # jp_dict = pickle.load(f)
    c_dict = CDict.CDict("./data/cedict_ts.txt")
    jieba.set_dictionary('data/dict.txt.big')
    yield
    # Deload
    # jp_dict = None
    c_dict = None



app = FastAPI(lifespan=lifespan)

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
    
    
    # tokenize text
    tokens = list(jieba.cut(q, cut_all=False))
    result = {"tokens": tokens}
    
    # cache result
    redis_client.setex(
        cache_key, 
        CACHE_EXPIRATION,
        json.dumps(result, ensure_ascii=False)
    )

    return result



@app.get("/term/cn/{term}")
async def tokenize_chinese(term: str):
    return c_dict.search(term)

@app.get("/")
async def root():
    return {"msg": "yo"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 
    