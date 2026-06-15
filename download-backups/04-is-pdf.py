import json
import re
from datetime import datetime
from pathlib import Path
import csv

CURRENT_DATE = datetime.now().strftime("%Y-%m-%d")

INPUT_FILE = Path(f"./form-details/output/{CURRENT_DATE}-form-details.json")
OUTPUT_FILE = Path(f"./form-details/output/{CURRENT_DATE}-form-details-with-pdf.json")
PDF_ONLY_OUTPUT_FILE = Path(f"./form-details/output/{CURRENT_DATE}-pdf-only.json")
FULL_CSV_OUTPUT_FILE = Path(f"./form-details/output/{CURRENT_DATE}-form-details-with-pdf.csv")

FORM_ID_PREFIX_PATTERN = re.compile(r"^0*(\d+)_")


def load_json_file(file_path: Path):
    with file_path.open("r", encoding="utf-8") as file:
        return json.load(file)


def write_json_file(file_path: Path, data) -> None:
    file_path.parent.mkdir(parents=True, exist_ok=True)

    with file_path.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2)

def write_csv_file(file_path: Path, data: list[dict]) -> None:
    """Write form details to a CSV file."""

    if not data:
        return

    file_path.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = list(data[0].keys())

    with file_path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)

        writer.writeheader()
        writer.writerows(data)


def prompt_for_folder() -> Path:
    while True:
        raw_folder = input("Enter folder to scan for PDFs: ").strip().strip('"')
        folder_path = Path(raw_folder).resolve()

        if folder_path.exists() and folder_path.is_dir():
            return folder_path

        print(f"Folder not found: {folder_path}")


def get_form_id_from_path(path: Path) -> int | None:
    """
    Looks through a file path for a folder name that starts with a form ID.

    Example:
    0042_Program_Degree Proposal Form
    """

    for part in path.parts:
        match = FORM_ID_PREFIX_PATTERN.match(part)

        if match:
            return int(match.group(1))

    return None


def find_form_ids_with_pdfs(folder_path: Path) -> set[int]:
    """
    Return form IDs whose folder:
    - contains at least one PDF
    - and contains 2 or fewer total files
    """

    form_ids_with_pdfs: set[int] = set()

    checked_folders = set()

    for pdf_path in folder_path.rglob("*.pdf"):
        form_folder = pdf_path.parent

        if form_folder in checked_folders:
            continue

        checked_folders.add(form_folder)

        if not is_pdf_only_folder(form_folder):
            continue

        form_id = get_form_id_from_path(form_folder)

        if form_id is not None:
            form_ids_with_pdfs.add(form_id)

    return form_ids_with_pdfs


def add_is_pdf_field(forms, form_ids_with_pdfs: set[int]):
    """Add is_pdf based on whether the matching form folder contains a PDF."""

    for form in forms:
        form_id = int(form["form_id"])
        form["is_pdf"] = form_id in form_ids_with_pdfs

    return forms

def is_pdf_only_folder(folder_path: Path) -> bool:
    """
    A folder is considered PDF-only when:
    - it contains at least one PDF
    - and contains 2 or fewer total files
    """

    files = [p for p in folder_path.rglob("*") if p.is_file()]

    pdf_files = [p for p in files if p.suffix.lower() == ".pdf"]

    return len(pdf_files) > 0 and len(files) <= 2

def main():
    folder_path = prompt_for_folder()

    forms = load_json_file(INPUT_FILE)
    form_ids_with_pdfs = find_form_ids_with_pdfs(folder_path)
    updated_forms = add_is_pdf_field(forms, form_ids_with_pdfs)

    write_json_file(OUTPUT_FILE, updated_forms)

    # Full CSV export
    write_csv_file(FULL_CSV_OUTPUT_FILE, updated_forms)

    # Output only forms where is_pdf is true
    pdf_only_forms = [form for form in updated_forms if form.get("is_pdf")]

    write_json_file(PDF_ONLY_OUTPUT_FILE, pdf_only_forms)

    print(f"Forms checked: {len(forms)}")
    print(f"Forms with PDFs: {len(form_ids_with_pdfs)}")
    print(f"Full output written to: {OUTPUT_FILE}")
    print(f"CSV output written to: {FULL_CSV_OUTPUT_FILE}")
    print(f"PDF-only output written to: {PDF_ONLY_OUTPUT_FILE}")


if __name__ == "__main__":
    main()