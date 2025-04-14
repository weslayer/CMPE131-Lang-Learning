from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import jieba
import uvicorn

app = FastAPI()

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
    
    return result

@app.get("/")
async def root():
    return {"msg": "yo"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 
    