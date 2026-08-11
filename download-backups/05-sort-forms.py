import json
import shutil
from pathlib import Path

JSON_FILE = Path("./form-details/output/form-details-deduped-with-pdf-2026-05-08.json")

CATEGORY_RULES = [
    {
        "name": "PDFs",
        "match": lambda form: form.get("is_pdf") is True,
    },
    {
        "name": "Developer and Admin",
        "match": lambda form: form.get("form_group") in ["Developer", "Admin"],
    },
    {
        "name": "Test",
        "match": lambda form: form.get("form_group") == "Test",
    },
    {
        "name": "Dashboards",
        "match": lambda form: form.get("form_group") == "Dashboards",
    },
    {
        "name": "Utility Forms",
        "match": lambda form: form.get("form_group") == "Utility Forms",
    },
        {
        "name": "Deprecated",
        "match": lambda form: form.get("form_group") == "Deprecated",
    },
]


def prompt_for_folder() -> Path:
    while True:
        raw = input("Enter extracted forms folder: ").strip().strip('"')
        path = Path(raw).resolve()

        if path.exists() and path.is_dir():
            return path

        print(f"Folder not found: {path}")


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def build_form_lookup(forms):
    """
    Build lookup keyed by form ID.
    """

    lookup = {}

    for form in forms:
        lookup[int(form["form_id"])] = form

    return lookup


def get_form_id_from_folder(folder_name: str) -> int | None:
    """
    Extract form ID from folder names like:
    0042_Program_Degree Proposal Form
    """

    prefix = folder_name.split("_")[0]

    if prefix.isdigit():
        return int(prefix)

    return None


def determine_category(form: dict) -> str | None:
    """
    Return the first matching category.
    """

    for rule in CATEGORY_RULES:
        if rule["match"](form):
            return rule["name"]

    return None


def move_folder(source_folder: Path, destination_root: Path, category: str):
    """
    Move folder into category folder.
    """

    category_folder = destination_root / category
    category_folder.mkdir(parents=True, exist_ok=True)

    destination = category_folder / source_folder.name

    if destination.exists():
        print(f"Skipping existing destination: {destination}")
        return

    shutil.move(str(source_folder), str(destination))

    print(f"Moved -> {category}: {source_folder.name}")


def main():
    extracted_forms_folder = prompt_for_folder()

    forms = load_json(JSON_FILE)
    form_lookup = build_form_lookup(forms)

    moved_count = 0

    for item in extracted_forms_folder.iterdir():
        if not item.is_dir():
            continue

        form_id = get_form_id_from_folder(item.name)

        if form_id is None:
            continue

        form = form_lookup.get(form_id)

        if not form:
            continue

        category = determine_category(form)

        if not category:
            continue

        move_folder(
            source_folder=item,
            destination_root=extracted_forms_folder,
            category=category,
        )

        moved_count += 1

    print()
    print(f"Folders moved: {moved_count}")


if __name__ == "__main__":
    main()