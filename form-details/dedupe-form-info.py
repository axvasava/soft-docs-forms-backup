import json
import re
from datetime import datetime
from pathlib import Path

# Current date for file naming
CURRENT_DATE = datetime.now().strftime("%Y-%m-%d")

# File paths
INPUT_FILE = Path(f"./form-details/output/form-details-{CURRENT_DATE}.json")
# INPUT_FILE = Path(f"./form-details/output/form-details-2026-04-27.json")
OUTPUT_FILE = Path(f"./form-details/output/form-details-deduped-{CURRENT_DATE}.json")


def load_json_file(file_path: Path) -> list[dict]:
    """Load the form details JSON file."""
    with file_path.open("r", encoding="utf-8") as file:
        return json.load(file)


def write_json_file(file_path: Path, data: list[dict]) -> None:
    """Write the cleaned form details JSON file."""
    file_path.parent.mkdir(parents=True, exist_ok=True)

    with file_path.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2)


def remove_consecutive_duplicate_forms(forms: list[dict]) -> list[dict]:
    """
    Remove consecutive duplicate form names.

    Keeps the first/lower form_id.
    Removes the later/higher form_id.
    """
    sorted_forms = sorted(forms, key=lambda form: form["form_id"])

    cleaned_forms = []
    previous_form_name = None

    for form in sorted_forms:
        current_form_name = form.get("form_name", "")

        if current_form_name == previous_form_name:
            continue

        cleaned_forms.append(form)
        previous_form_name = current_form_name

    return cleaned_forms


def get_derived_form_details(form_name: str) -> dict:
    """
    Create extra metadata based on the form name.
    """
    cleaned_name = form_name.strip()

    is_inactive = bool(
        re.search(r"^z[_\s-]", cleaned_name, re.IGNORECASE)
        or re.search(r"\b(old|canceled|cancelled|deprecated)\b", cleaned_name, re.IGNORECASE)
    )

    is_test = bool(
        re.search(r"\btest(?:ing)?\b", cleaned_name, re.IGNORECASE)
    )

    is_new_form_builder = bool(
        re.search(r"\s+v\d+$", cleaned_name, re.IGNORECASE)
    )

    base_form_name = re.sub(
        r"\s+v\d+$",
        "",
        cleaned_name,
        flags=re.IGNORECASE,
    ).strip()

    return {
        "is_inactive": is_inactive,
        "is_test": is_test,
        "is_new_form_builder": is_new_form_builder,
        "base_form_name": base_form_name,
    }


def add_derived_form_details(forms: list[dict]) -> list[dict]:
    """
    Add derived metadata to each deduped form object.
    """
    enriched_forms = []

    for form in forms:
        form_name = form.get("form_name", "")

        enriched_form = {
            **form,
            **get_derived_form_details(form_name),
        }

        enriched_forms.append(enriched_form)

    return enriched_forms


def main() -> None:
    forms = load_json_file(INPUT_FILE)

    cleaned_forms = remove_consecutive_duplicate_forms(forms)
    enriched_forms = add_derived_form_details(cleaned_forms)

    write_json_file(OUTPUT_FILE, enriched_forms)

    print(f"Original count: {len(forms)}")
    print(f"Cleaned count: {len(cleaned_forms)}")
    print(f"Removed count: {len(forms) - len(cleaned_forms)}")
    print(f"Output written to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()