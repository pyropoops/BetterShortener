import requests
import json

data = {"url": "http://youtube.com/"}
res = requests.post("http://138.68.183.151:3000/api/shorten", data).json()
print(json.dumps(res, indent=2))