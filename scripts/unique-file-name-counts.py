import os
from collections import defaultdict
from datetime import datetime

def count_filenames(root_path):
    """
    Recursively count occurrences of each unique file name.
    """
    filename_counts = defaultdict(int)

    for dirpath, dirnames, filenames in os.walk(root_path):
        for filename in filenames:
            filename_counts[filename] += 1

    return filename_counts


def count_top_level_folders(root_path):
    """
    Count only the immediate subfolders (non-recursive).
    """
    return sum(
        1 for entry in os.scandir(root_path)
        if entry.is_dir()
    )


def write_markdown(root_path, filename_counts, folder_count):
    """
    Write results to a markdown file in the root directory.
    """
    output_path = os.path.join(root_path, "unique_file_name_count.md")

    with open(output_path, "w", encoding="utf-8") as f:
        # Header
        f.write("# File Report\n\n")
        f.write(f"Generated: {datetime.now()}\n\n")

        # Folder summary
        f.write("## Top-Level Folder Count\n\n")
        f.write(f"{folder_count}\n\n")

        # File counts
        f.write("## File Name Counts (Recursive)\n\n")
        f.write("| File Name | Count |\n")
        f.write("|----------|-------|\n")

        for filename, count in sorted(filename_counts.items()):
            f.write(f"| {filename} | {count} |\n")

    return output_path


if __name__ == "__main__":
    root_folder = r"C:\Users\axvasava\Desktop\repos\soft-docs-forms-backup\backups\2026-05-08_105836\extracted"

    filename_counts = count_filenames(root_folder)
    folder_count = count_top_level_folders(root_folder)

    output_file = write_markdown(root_folder, filename_counts, folder_count)

    print(f"Report written to: {output_file}")