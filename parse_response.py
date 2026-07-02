import json
import base64

with open("response.json", "r", encoding="utf-8") as f:
    data = json.load(f)

print("Top-level keys:", list(data.keys()))
print("Success value:", data.get("success"))

inner = data.get("data")
print("Type of data['data']:", type(inner))

if isinstance(inner, dict):
    print("Keys inside data['data']:", list(inner.keys()))
elif isinstance(inner, list):
    print("data['data'] is a list with", len(inner), "items")
    if len(inner) > 0:
        print("First item type:", type(inner[0]))
        if isinstance(inner[0], dict):
            print("Keys inside first item:", list(inner[0].keys()))

# Try to find and save debug images wherever they are
def find_and_save(obj, path=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            new_path = f"{path}.{k}" if path else k
            if k in ("debug_inner", "debug_full") and isinstance(v, str):
                img_data = v
                if img_data.startswith("data:image"):
                    img_data = img_data.split(",", 1)[1]
                fname = f"{k}.jpg"
                with open(fname, "wb") as out:
                    out.write(base64.b64decode(img_data))
                print("Saved:", fname, "from path:", new_path)
            else:
                find_and_save(v, new_path)
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            find_and_save(item, f"{path}[{i}]")

find_and_save(data)