import csv
import json
from pathlib import Path
from typing import Any


# Root backup directory
BACKUPS_ROOT = Path("backups")

# Backup run folder to inspect
RUN_FOLDER = "2026-11-11_081511"  # update this for the backup run you want to inspect

# Input/output file names within the run folder
MANIFEST_NAME = "manifest.json"
CSV_NAME = "failed_form_ids.csv"

# Output options
INCLUDE_ERROR_COLUMN = True
PRINT_CLI_ARG_STRING = True


def load_manifest(manifest_path: Path) -> dict[str, Any]:
    """
    Loads and validates the manifest JSON.
    """
    with manifest_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, dict):
        raise ValueError(f"Manifest root must be a JSON object: {manifest_path.resolve()}")

    return data


def get_failed_entries(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Extracts failed form entries from the manifest results.

    Keeps only:
    - form_id
    - error
    """
    results = manifest.get("results", [])
    if not isinstance(results, list):
        raise ValueError("Manifest field 'results' must be a list.")

    failed_entries: list[dict[str, Any]] = []

    for entry in results:
        if not isinstance(entry, dict):
            continue

        if entry.get("status") != "failed":
            continue

        form_id = entry.get("form_id")
        error = entry.get("error") or ""

        if isinstance(form_id, int):
            failed_entries.append(
                {
                    "form_id": form_id,
                    "error": str(error),
                }
            )

    return failed_entries


def write_failed_csv(csv_path: Path, failed_entries: list[dict[str, Any]], include_error_column: bool) -> None:
    """
    Writes failed form IDs to CSV.

    Can optionally include the error message column.
    """
    csv_path.parent.mkdir(parents=True, exist_ok=True)

    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)

        if include_error_column:
            writer.writerow(["form_id", "error"])
            for entry in failed_entries:
                writer.writerow([entry["form_id"], entry["error"]])
        else:
            writer.writerow(["form_id"])
            for entry in failed_entries:
                writer.writerow([entry["form_id"]])


def main() -> None:
    """
    Builds the manifest and output paths, extracts failed entries,
    writes the CSV, and prints a summary.
    """
    run_path = BACKUPS_ROOT / RUN_FOLDER
    manifest_path = run_path / MANIFEST_NAME
    csv_path = run_path / CSV_NAME

    if not manifest_path.exists():
        raise FileNotFoundError(f"Manifest not found: {manifest_path.resolve()}")

    manifest = load_manifest(manifest_path)
    failed_entries = get_failed_entries(manifest)
    failed_form_ids = [entry["form_id"] for entry in failed_entries]

    write_failed_csv(
        csv_path=csv_path,
        failed_entries=failed_entries,
        include_error_column=INCLUDE_ERROR_COLUMN,
    )

    print(f"Manifest: {manifest_path.resolve()}")
    print(f"Failed form count: {len(failed_form_ids)}")
    print(f"CSV written to: {csv_path.resolve()}")

if __name__ == "__main__":
    main()
