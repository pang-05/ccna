from pypdf import PdfReader

SOURCE = r"C:\Users\Hp\Downloads\CCNA 2 v7.0 Final Exam Answers Full - Switching, Routing and Wireless Essentials.pdf"
reader = PdfReader(SOURCE)
for image in reader.pages[0].images:
    print(image.name, len(image.data))
    if image.name.startswith("Im4"):
        with open("work/q1-exhibit.png", "wb") as handle:
            handle.write(image.data)
