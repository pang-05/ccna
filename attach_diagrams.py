import base64
import json

with open("work/quiz-data.json", encoding="utf-8") as handle:
    questions = json.load(handle)
with open("work/q1-exhibit.png", "rb") as handle:
    diagram = "data:image/png;base64," + base64.b64encode(handle.read()).decode("ascii")

for question in questions:
    if question["id"] == 1:
        question["diagram"] = diagram

with open("work/quiz-data.json", "w", encoding="utf-8") as handle:
    json.dump(questions, handle, ensure_ascii=False, indent=2)
print("Attached the PDF's source exhibit to question 1.")
