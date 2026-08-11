import argparse
import json
import re
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

from playwright.sync_api import (
    Browser,
    BrowserContext,
    Page,
    Playwright,
    sync_playwright,
)

# Example run:
# python form-details/form-details.py --min-form-id 1 --max-form-id 283

# Base Softdocs URL
BASE_URL = "https://oaklandcccentral.etrieve.cloud"

# URL template for a form's settings page
FORM_SETTINGS_URL_TEMPLATE = BASE_URL + "/Index#/settings/forms/{form_id}"

# Default input file (only used if not using min/max)
DEFAULT_MARKDOWN_FILE = ""

# Current date for file naming
CURRENT_DATE = datetime.now().strftime("%Y-%m-%d")

# Output files
OUTPUT_JSON_FILE = Path(f"./form-details/output/form-details-{CURRENT_DATE}.json")
ERROR_LOG_FILE = Path("./logs/form-details-errors.log")

# Chrome / Playwright setup
DEFAULT_CDP_URL = "http://127.0.0.1:9222"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
CHROME_USER_DATA_DIR = Path.home() / "AppData/Local/ChromePlaywrightSoftdocs"

# Timing values (ms unless noted)
PAGE_LOAD_TIMEOUT_MS = 5000
POST_NAV_WAIT_MS = 500
PAGE_SETTLE_WAIT_MS = 1000
CHROME_STARTUP_WAIT_SECONDS = 2.5


def read_form_ids_from_file(input_file: Path) -> list[int]:
    """
    Reads numbers from a file and returns them as unique form IDs.
    Keeps original order, removes duplicates.
    """
    content = input_file.read_text(encoding="utf-8")
    matches = re.findall(r"\b\d+\b", content)

    seen = set()
    form_ids: list[int] = []

    for match in matches:
        form_id = int(match)

        if form_id not in seen:
            seen.add(form_id)
            form_ids.append(form_id)

    return form_ids


def launch_chrome() -> subprocess.Popen[bytes]:
    """
    Launch Chrome with remote debugging enabled so Playwright can attach.
    Uses a separate Chrome profile.
    """
    CHROME_USER_DATA_DIR.mkdir(parents=True, exist_ok=True)

    chrome_args = [
        CHROME_PATH,
        "--remote-debugging-port=9222",
        f"--user-data-dir={CHROME_USER_DATA_DIR}",
        BASE_URL,
    ]

    try:
        process = subprocess.Popen(chrome_args)
    except FileNotFoundError as exc:
        raise RuntimeError(f"Chrome executable not found at: {CHROME_PATH}") from exc

    # Give Chrome time to boot
    time.sleep(CHROME_STARTUP_WAIT_SECONDS)

    return process


def attach_to_existing_chrome(
    playwright: Playwright,
    cdp_url: str,
) -> tuple[Browser, BrowserContext]:
    """
    Attach Playwright to the running Chrome instance.
    """
    browser = playwright.chromium.connect_over_cdp(cdp_url)

    # Reuse existing tab if available
    if browser.contexts:
        context = browser.contexts[0]
    else:
        context = browser.new_context()

    return browser, context


def wait_for_page_to_settle(page: Page, wait_ms: int = PAGE_SETTLE_WAIT_MS) -> None:
    """
    Small buffer to let Softdocs (SPA) finish rendering.
    """
    page.wait_for_timeout(wait_ms)


def open_form_preview_page(page: Page, form_id: int) -> None:
    """
    Navigate to a form's settings page.
    """
    url = FORM_SETTINGS_URL_TEMPLATE.format(form_id=form_id)

    page.goto(url, wait_until="domcontentloaded", timeout=PAGE_LOAD_TIMEOUT_MS)
    page.wait_for_timeout(POST_NAV_WAIT_MS)

    wait_for_page_to_settle(page)


def fail_fast_auth_check(page: Page, form_id: int) -> None:
    """
    Opens one form to verify you are logged in.
    Stops the script early if not authenticated.
    """
    open_form_preview_page(page, form_id)

    final_url = page.url.lower()

    print(f"Fail-fast auth check for form {form_id}")
    print(f"Final URL: {page.url}")

    if "login" in final_url or "oauth" in final_url:
        raise RuntimeError("Not logged into Softdocs.")


# ---------- FIELD EXTRACTION ----------

def get_form_name(page: Page) -> str:
    """Read the form name from the input field."""
    el = page.locator(".pendo-classic-fb-name-input")
    el.wait_for(state="visible", timeout=PAGE_LOAD_TIMEOUT_MS)
    return el.input_value().strip()


def get_department(page: Page) -> str:
    """Get selected department from dropdown."""
    el = page.locator("#departments")
    el.wait_for(state="visible", timeout=PAGE_LOAD_TIMEOUT_MS)
    return el.locator("option:checked").inner_text().strip()


def get_form_group(page: Page) -> str:
    """Get selected form group from dropdown."""
    el = page.locator("#formGroups")
    el.wait_for(state="visible", timeout=PAGE_LOAD_TIMEOUT_MS)
    return el.locator("option:checked").inner_text().strip()


def get_anonymous(page: Page) -> bool:
    """Check if anonymous toggle is on."""
    el = page.locator("input#anonymous_access_toggle")
    el.wait_for(state="attached", timeout=PAGE_LOAD_TIMEOUT_MS)
    return el.is_checked()


def get_published(page: Page) -> bool:
    """
    Determine publish state from button text.
    """
    el = page.locator(".pendo-classic-fb-publish-toggle")
    el.wait_for(state="visible", timeout=PAGE_LOAD_TIMEOUT_MS)

    text = el.inner_text().strip().lower()

    if "un-publish" in text:
        return True
    if "publish" in text:
        return False

    raise ValueError(f"Unexpected publish button text: {text}")


def get_form_details(page: Page, form_id: int) -> dict:
    """
    Build a full form record from the page.
    """
    return {
        "form_id": form_id,
        "form_name": get_form_name(page),
        "department": get_department(page),
        "form_group": get_form_group(page),
        "anonymous": get_anonymous(page),
        "published": get_published(page),
    }


# ---------- FILE WRITING ----------

def append_to_json_file(file_path: Path, data: dict) -> None:
    """
    Append a record to a JSON array file.
    Creates file if missing.
    """
    if file_path.exists():
        try:
            existing_data = json.loads(file_path.read_text(encoding="utf-8"))
            if not isinstance(existing_data, list):
                existing_data = []
        except json.JSONDecodeError:
            existing_data = []
    else:
        existing_data = []

    existing_data.append(data)

    file_path.write_text(json.dumps(existing_data, indent=2), encoding="utf-8")


def write_error_log(file_path: Path, form_id: int, error_message: str) -> None:
    """
    Log errors instead of stopping execution.
    """
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")

    file_path.parent.mkdir(parents=True, exist_ok=True)

    with file_path.open("a", encoding="utf-8") as file:
        file.write(f"[{timestamp}] form_id={form_id} error={error_message}\n")


# ---------- MAIN LOOP ----------

def scan_forms(page: Page, form_ids: list[int]) -> None:
    """
    Loop through forms:
    open → extract → save → continue
    """
    total_forms = len(form_ids)

    for index, form_id in enumerate(form_ids, start=1):
        print(f"\n[{index}/{total_forms}] Processing form ID {form_id}...")

        try:
            open_form_preview_page(page, form_id)

            form_details = get_form_details(page, form_id)

            print(f"  - form_name: {form_details['form_name']}")

            append_to_json_file(OUTPUT_JSON_FILE, form_details)

            # Small delay to avoid SPA timing issues
            page.wait_for_timeout(300)

        except Exception as exc:
            error_message = str(exc).strip()

            print(f"  - failed: {error_message}")

            write_error_log(ERROR_LOG_FILE, form_id, error_message)

            page.wait_for_timeout(300)


# ---------- INPUT HANDLING ----------

def get_form_ids(args: argparse.Namespace) -> list[int]:
    """
    Get form IDs from file or range.
    """
    using_range = args.min_form_id is not None or args.max_form_id is not None

    if using_range:
        if args.min_form_id is None or args.max_form_id is None:
            sys.exit("Both --min-form-id and --max-form-id required.")

        return list(range(args.min_form_id, args.max_form_id + 1))

    file = Path(args.markdown_file)

    if not file.exists():
        sys.exit(f"File not found: {file}")

    return read_form_ids_from_file(file)


# ---------- ENTRY POINT ----------

def main() -> None:
    parser = argparse.ArgumentParser()

    parser.add_argument("--markdown-file", default=DEFAULT_MARKDOWN_FILE)
    parser.add_argument("--min-form-id", type=int)
    parser.add_argument("--max-form-id", type=int)
    parser.add_argument("--cdp-url", default=DEFAULT_CDP_URL)

    args = parser.parse_args()

    form_ids = get_form_ids(args)

    print(f"Found {len(form_ids)} form IDs.")

    try:
        launch_chrome()

        with sync_playwright() as playwright:
            browser, context = attach_to_existing_chrome(playwright, args.cdp_url)

            page = context.new_page()

            fail_fast_auth_check(page, form_ids[0])

            scan_forms(page, form_ids)

            print("\nDone.")

    except Exception as exc:
        print(f"ERROR: {str(exc).strip()}")
        sys.exit(1)


if __name__ == "__main__":
    main()