from backend.app.main import app

with open("openapi_schema.json", "w") as f:
    import json
    f.write(json.dumps(app.openapi(), indent=2))
