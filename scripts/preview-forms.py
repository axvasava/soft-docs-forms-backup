import argparse
import re
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import (
    Browser,
    BrowserContext,
    Page,
    Playwright,
    sync_playwright,
)

"""
Script: Softdocs Form Scanner

What this does:
- Opens Softdocs form settings pages in Chrome using Playwright
- Lets you manually review each form one-by-one

---------------------------------------
USAGE
---------------------------------------

# 1. Default (uses built-in markdown file)
python scripts/preview-forms.py

# 2. Specify a markdown file
python scripts/preview-forms.py --markdown-file "required.md"

# 3. Use a form ID range instead of a file
python scripts/preview-forms.py --min-form-id 1 --max-form-id 290

---------------------------------------
NOTES
---------------------------------------

- You must provide EITHER:
    • --markdown-file
    • OR both --min-form-id AND --max-form-id

- If both min/max are provided, the script ignores the markdown file.

- Chrome will launch with a separate profile:
    ChromePlaywrightSoftdocs

- You must already be logged into Softdocs in that profile.
  If not, the script will fail early.

- The script pauses after each form:
    Press ENTER to continue

---------------------------------------
EXAMPLES
---------------------------------------

# Scan specific forms from a file
python scripts/preview-forms.py --markdown-file "scripts/my-forms.md" 

# Scan a continuous range
python scripts/preview-forms.py --min-form-id 1 --max-form-id 283
"""

# Main Softdocs site URL.
BASE_URL = "https://oaklandcccentral.etrieve.cloud"

# URL pattern for opening a specific form's settings page.
FORM_SETTINGS_URL_TEMPLATE = BASE_URL + "/Index#/settings/forms/{form_id}/preview"
# FORM_SETTINGS_URL_TEMPLATE = BASE_URL + "/Index#/settings/forms/{form_id}/preview"

# Default markdown file that contains the form IDs.
DEFAULT_MARKDOWN_FILE = ""

# Local Chrome debugging URL used by Playwright to attach to Chrome.
DEFAULT_CDP_URL = "http://127.0.0.1:9222"

# Local path to Chrome on Windows.
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

# Dedicated Chrome profile folder for this script.
# This keeps the script's browser session separate from your normal Chrome profile.
CHROME_USER_DATA_DIR = Path.home() / "AppData/Local/ChromePlaywrightSoftdocs"

# Timing settings.
PAGE_LOAD_TIMEOUT_MS = 5000
POST_NAV_WAIT_MS = 500
PAGE_SETTLE_WAIT_MS = 1000
CHROME_STARTUP_WAIT_SECONDS = 2.5


def read_form_ids_from_file(input_file: Path) -> list[int]:
    """
    Read form IDs from a text or markdown file.

    This finds standalone numbers, keeps them in the same order,
    and removes duplicate IDs.
    """
    content = input_file.read_text(encoding="utf-8")
    matches = re.findall(r"\b\d+\b", content)

    seen = set()
    form_ids: list[int] = []

    for match in matches:
        form_id = int(match)

        # Only add the ID the first time it appears.
        if form_id not in seen:
            seen.add(form_id)
            form_ids.append(form_id)

    return form_ids


def launch_chrome() -> subprocess.Popen[bytes]:
    """
    Launch Chrome with remote debugging turned on.

    Playwright needs remote debugging enabled so it can attach to this
    Chrome window and control it.
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
        raise RuntimeError(
            f"Chrome executable not found at: {CHROME_PATH}"
        ) from exc

    # Give Chrome a moment to fully start before Playwright tries to attach.
    time.sleep(CHROME_STARTUP_WAIT_SECONDS)

    return process


def attach_to_existing_chrome(
    playwright: Playwright,
    cdp_url: str,
) -> tuple[Browser, BrowserContext]:
    """
    Attach Playwright to the Chrome window that was just opened.
    """
    browser = playwright.chromium.connect_over_cdp(cdp_url)

    # Use the existing browser context if Chrome already has one.
    # Otherwise, create a new context.
    if browser.contexts:
        context = browser.contexts[0]
    else:
        context = browser.new_context()

    return browser, context


def wait_for_page_to_settle(page: Page, wait_ms: int = PAGE_SETTLE_WAIT_MS) -> None:
    """
    Give the Softdocs single-page app a little extra time to finish loading.
    """
    page.wait_for_timeout(wait_ms)


def open_form_preview_page(page: Page, form_id: int) -> None:
    """
    Open the settings page for one form ID.
    """
    url = FORM_SETTINGS_URL_TEMPLATE.format(form_id=form_id)

    page.goto(url, wait_until="domcontentloaded", timeout=PAGE_LOAD_TIMEOUT_MS)
    page.wait_for_timeout(POST_NAV_WAIT_MS)

    wait_for_page_to_settle(page)


def fail_fast_auth_check(page: Page, form_id: int) -> None:
    """
    Check whether the Chrome profile is already logged in.

    This runs before scanning the full list so the script fails early
    instead of opening every form while logged out.
    """
    open_form_preview_page(page, form_id)

    final_url = page.url.lower()

    print(f"Fail-fast auth check for form {form_id}")
    print(f"Final URL: {page.url}")

    # If Softdocs sends us to a login page, stop the script.
    if "login" in final_url or "oauth" in final_url:
        raise RuntimeError(
            "Auth check failed. Chrome opened successfully, but the profile is not logged in."
        )


def scan_forms(page: Page, form_ids: list[int]) -> None:
    """
    Open each form settings page one at a time.

    The script pauses after each form so you can review it manually
    before moving to the next one.
    """
    total_forms = len(form_ids)

    for index, form_id in enumerate(form_ids, start=1):
        print(f"\n[{index}/{total_forms}] Processing form ID {form_id}...")

        try:
            open_form_preview_page(page, form_id)
            print(f"  - opened: {page.url}")

            # Manual pause between forms.
            input("Press ENTER to continue to the next form...")

        except Exception as exc:
            print(f"  - failed: {str(exc).strip()}")

            # Pause so you can fix/check the issue before continuing.
            input("Issue encountered. Fix manually if needed, then press ENTER to continue...")

def get_form_ids(args: argparse.Namespace) -> list[int]:
    """
    Get form IDs from either:

    1. A markdown/text file
    2. A min/max form ID range
    """
    using_range = args.min_form_id is not None or args.max_form_id is not None

    if using_range:
        if args.min_form_id is None or args.max_form_id is None:
            print("ERROR: Both --min-form-id and --max-form-id are required when using a range.")
            sys.exit(96)

        if args.min_form_id > args.max_form_id:
            print("ERROR: --min-form-id cannot be greater than --max-form-id.")
            sys.exit(95)

        return list(range(args.min_form_id, args.max_form_id + 1))

    markdown_file = Path(args.markdown_file).resolve()

    if not markdown_file.exists():
        print(f"ERROR: Markdown file not found: {markdown_file}")
        sys.exit(98)

    return read_form_ids_from_file(markdown_file)

def main() -> None:
    """
    Main script flow:

    1. Read command-line arguments.
    2. Get form IDs from either a markdown file or a min/max range.
    3. Launch Chrome.
    4. Attach Playwright to Chrome.
    5. Check login.
    6. Open each form one at a time.
    """
    parser = argparse.ArgumentParser()

    parser.add_argument("--markdown-file", default=DEFAULT_MARKDOWN_FILE)
    parser.add_argument("--min-form-id", type=int)
    parser.add_argument("--max-form-id", type=int)
    parser.add_argument("--cdp-url", default=DEFAULT_CDP_URL)

    args = parser.parse_args()

    form_ids = get_form_ids(args)

    if not form_ids:
        print("ERROR: No form IDs found.")
        sys.exit(97)

    print(f"Found {len(form_ids)} form IDs.")

    browser: Browser | None = None
    chrome_process: subprocess.Popen[bytes] | None = None

    try:
        chrome_process = launch_chrome()

        with sync_playwright() as playwright:
            try:
                browser, context = attach_to_existing_chrome(
                    playwright=playwright,
                    cdp_url=args.cdp_url,
                )
            except Exception as exc:
                raise RuntimeError(
                    "Could not attach to Chrome after launch. "
                    "Make sure Chrome supports remote debugging and the port is available."
                ) from exc

            page = context.new_page()

            first_form_id = form_ids[0]
            fail_fast_auth_check(page, form_id=first_form_id)

            scan_forms(page=page, form_ids=form_ids)

            print("\nDone.")
            sys.exit(0)

    except Exception as exc:
        print(f"ERROR: {str(exc).strip()}")
        sys.exit(1)


if __name__ == "__main__":
    main()