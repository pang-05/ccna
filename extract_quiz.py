import json
import re
import sys
from collections import defaultdict

import pdfplumber

SOURCE = r"C:\Users\Hp\Downloads\CCNA 2 v7.0 Final Exam Answers Full - Switching, Routing and Wireless Essentials.pdf"
OUT = r"work\quiz-data.json"


def page_lines(page, column, first_page=False):
    words = page.extract_words(extra_attrs=["fontname", "size"])
    buckets = defaultdict(list)
    for word in words:
        # Printed webpage furniture is tiny and lies outside the article column.
        in_article = 440 <= word["x0"] <= 650 if column == "right" else 40 <= word["x0"] <= 260
        if word["size"] < 6.5 or word["top"] > 520 or (first_page and word["top"] > 310) or not in_article:
            continue
        key = round(word["top"], 1)
        buckets[key].append(word)
    lines = []
    for _, group in sorted(buckets.items()):
        group.sort(key=lambda item: item["x0"])
        value = " ".join(item["text"] for item in group)
        value = re.sub(r"\s+", " ", value).strip()
        if not value or value.startswith("https://"):
            continue
        if value.startswith("CCNA 2 v7 Switching Routing and Wireless"):
            continue
        if value in {"Related Posts", "CCNA v7.0 Exam Answers"}:
            continue
        bold = sum("Bold" in item["fontname"] for item in group) >= len(group) / 2
        lines.append({"text": value, "bold": bold})
    return lines


def is_question(line):
    return line["bold"] and re.match(r"^\d+\.\s", line["text"])


def clean(parts):
    text = " ".join(parts)
    return re.sub(r"\s+", " ", text).strip()


def parse(lines):
    questions = []
    current = None
    section = None
    option_parts = []
    option_bold = None

    def flush_option():
        nonlocal option_parts, option_bold
        if current and option_parts:
            value = clean(option_parts)
            # The exported webpage places exhibit image filenames in the article flow.
            if value and not re.match(r"^CCNA 2 v7 Switching Routing and Wireless Essentials-Version-Final-Answers-\d+$", value):
                current["options"].append({"text": value, "correct": bool(option_bold)})
        option_parts, option_bold = [], None

    for line in lines:
        value = line["text"]
        if is_question(line):
            flush_option()
            if current:
                current["question"] = clean(current["question"])
                current["explanation"] = clean(current["explanation"])
                questions.append(current)
            number = int(value.split(".", 1)[0])
            current = {"id": number, "question": [value.split(".", 1)[1].strip()], "options": [], "explanation": []}
            section = "question"
            continue
        if not current:
            continue
        if value.startswith("Explanation:"):
            flush_option()
            section = "explanation"
            current["explanation"].append(value)
            continue
        if section == "question":
            # The question itself is bold, as is the correct option. A question ends at its question mark.
            if not clean(current["question"]).endswith("?"):
                current["question"].append(value)
            else:
                section = "options"
                option_parts = [value]
                option_bold = line["bold"]
        elif section == "options":
            # Choices in the print export start on distinct visual lines. Their font weight marks answers.
            flush_option()
            option_parts = [value]
            option_bold = line["bold"]
        elif section == "explanation":
            current["explanation"].append(value)
    flush_option()
    if current:
        current["question"] = clean(current["question"])
        current["explanation"] = clean(current["explanation"])
        questions.append(current)
    return questions


with pdfplumber.open(SOURCE) as pdf:
    lines = []
    for index, page in enumerate(pdf.pages):
        # The PDF places consecutive printed web pages side by side. The opening
        # sheet has navigation on the left, then every following sheet is left-to-right.
        columns = ["right"] if index == 0 else ["left", "right"]
        for column in columns:
            lines.extend(page_lines(page, column, index == 0))
questions = parse(lines)
# The print export repeats a few item numbers; retain the fullest source instance for each number.
deduplicated = {}
for item in questions:
    quality = len(item["question"]) + sum(len(option["text"]) for option in item["options"]) + len(item["explanation"])
    existing = deduplicated.get(item["id"])
    if not existing or quality > existing[0]:
        deduplicated[item["id"]] = (quality, item)
questions = [deduplicated[key][1] for key in sorted(deduplicated)]
with open(OUT, "w", encoding="utf-8") as handle:
    json.dump(questions, handle, ensure_ascii=False, indent=2)
print("questions", len(questions))
print("ids", [q["id"] for q in questions])
print("with choices", sum(bool(q["options"]) for q in questions))
print("with correct", sum(any(o["correct"] for o in q["options"]) for q in questions))
for q in questions:
    if not q["options"] or not any(o["correct"] for o in q["options"]):
        print("incomplete", q["id"], q["question"][:100])
