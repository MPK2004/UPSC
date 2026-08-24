import os
import json
import fitz  # PyMuPDF fallback & image extractor
import opendataloader_pdf

PDF_PATH = "/home/mahesh/project/UPSC/NCERT-Class-11-Geography-Part-1.pdf"
OUTPUT_DIR = "/home/mahesh/project/UPSC/backend/extracted_content"

def extract_pdf_with_opendataloader(pdf_path: str, output_dir: str):
    """
    Parses PDF using OpenDataLoader PDF to structured JSON & Markdown.
    Extracts reading order, tables, and bounding boxes.
    """
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"[OpenDataLoader] Processing PDF: {pdf_path}")
    try:
        opendataloader_pdf.convert(
            input_path=[pdf_path],
            output_dir=output_dir,
            format="json,markdown"
        )
        print(f"[OpenDataLoader] Extraction completed! Output saved in: {output_dir}")
    except Exception as e:
        print(f"[OpenDataLoader] Exception encountered: {e}. Falling back to PyMuPDF structure extractor.")
        fallback_extract_pdf(pdf_path, output_dir)

def fallback_extract_pdf(pdf_path: str, output_dir: str):
    """
    Structured fallback parser using PyMuPDF (fitz) to extract chapter chunks, headings,
    and diagram images.
    """
    doc = fitz.open(pdf_path)
    output_json = os.path.join(output_dir, "document_structure.json")
    img_dir = os.path.join(output_dir, "diagrams")
    os.makedirs(img_dir, exist_ok=True)

    extracted_pages = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text")
        
        # Extract images/diagrams from page
        image_list = page.get_images(full=True)
        images = []
        for img_index, img in enumerate(image_list):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]
            image_filename = f"page_{page_num + 1}_img_{img_index + 1}.{image_ext}"
            image_filepath = os.path.join(img_dir, image_filename)
            
            with open(image_filepath, "wb") as f:
                f.write(image_bytes)
            images.append(f"/diagrams/{image_filename}")

        extracted_pages.append({
            "page": page_num + 1,
            "text": text.strip(),
            "diagrams": images
        })

    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(extracted_pages, f, indent=2)

    print(f"[PyMuPDF Fallback] Extracted {len(extracted_pages)} pages and saved to {output_json}")

if __name__ == "__main__":
    if os.path.exists(PDF_PATH):
        extract_pdf_with_opendataloader(PDF_PATH, OUTPUT_DIR)
    else:
        print(f"File not found: {PDF_PATH}")
