import pdfplumber

SOURCE = r"C:\Users\Hp\Downloads\CCNA 2 v7.0 Final Exam Answers Full - Switching, Routing and Wireless Essentials.pdf"
with pdfplumber.open(SOURCE) as pdf:
    pdf.pages[2].to_image(resolution=150).save("tmp/pdfs/sample-page-3.png", format="PNG")
    # Q1 is the sole source exhibit embedded as an image in this export (the duplicate is on page 2).
    pdf.pages[0].crop((440, 498, 665, 710)).to_image(resolution=180).save("work/q1-exhibit.png", format="PNG")
