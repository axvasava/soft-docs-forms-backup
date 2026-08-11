import os
from pathlib import Path


# ---------------------------------------
# CONFIGURATION
# ---------------------------------------

# Add exact filenames here
TARGET_FILENAMES = [
    "autosize.min.js",
    "bootstrap.min.css",
    "form.json",
    "jquery.maskedinput.js",
    "liveViewModel.js",
]

# Set to True to preview matches only
# Set to False to actually delete files
DRY_RUN = False


def delete_exact_filenames(
    root_folder: str,
    target_filenames: list[str],
    dry_run: bool = False,
):
    """
    Find and optionally delete files with exact filename matches
    from the given folder and all subfolders.

    Args:
        root_folder: The top-level folder to search.
        target_filenames: List of exact file names to match.
        dry_run: If True, only report matches. If False, delete them.
    """

    root_path = Path(root_folder)

    if not root_path.exists():
        print(f"Folder does not exist: {root_path}")
        return

    if not root_path.is_dir():
        print(f"Path is not a folder: {root_path}")
        return

    # Remove blanks and duplicates
    cleaned_filenames = list({
        file_name.strip()
        for file_name in target_filenames
        if file_name.strip()
    })

    if not cleaned_filenames:
        print("No valid target filenames configured.")
        return

    matches: list[Path] = []

    for current_root, _, files in os.walk(root_path):
        for file_name in files:
            if file_name in cleaned_filenames:
                full_path = Path(current_root) / file_name
                matches.append(full_path)

    if not matches:
        print("\nNo matching files found for:")
        for file_name in cleaned_filenames:
            print(f" - {file_name}")
        return

    print(f"\nFound {len(matches)} matching file(s):\n")

    for match in matches:
        print(match)

    if dry_run:
        print("\nDry run enabled. No files were deleted.")
        return

    deleted_count = 0
    failed_count = 0

    print("\nDeleting files...\n")

    for match in matches:
        try:
            match.unlink()
            print(f"Deleted: {match}")
            deleted_count += 1
        except Exception as exc:
            print(f"Failed to delete: {match}")
            print(f"Reason: {exc}")
            failed_count += 1

    print("\nDone.")
    print(f"Deleted: {deleted_count}")
    print(f"Failed: {failed_count}")


if __name__ == "__main__":
    folder_input = input("Enter the folder path to search: ").strip()

    delete_exact_filenames(
        root_folder=folder_input,
        target_filenames=TARGET_FILENAMES,
        dry_run=DRY_RUN,
    )