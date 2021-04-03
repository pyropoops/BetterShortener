import requests
import json

data = {"url": "http://youtube.com/"}
res = requests.post("http://localhost:3000/api/shorten", data).json()
print(json.dumps(res, indent=2))