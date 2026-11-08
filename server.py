"""Local-only sample-site server and Google Safe Browsing URL lookup proxy."""

from __future__ import annotations

import json
import os
import re
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit, urlunsplit
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parent
SAMPLES = ROOT / "samples"
HOST = "127.0.0.1"
PORT = 8000
API_ENDPOINT = "https://safebrowsing.googleapis.com/v5/urls:search"
MAX_BODY_BYTES = 16_384
URL_CACHE: dict[str, tuple[float, dict[str, object]]] = {}


def sanitize_url(raw_url: str) -> str:
    """Remove credentials, query/fragment data, and long path-token segments."""
    parsed = urlsplit(raw_url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise ValueError("Only HTTP and HTTPS page URLs can be checked.")

    host = parsed.hostname.encode("idna").decode("ascii").lower()
    if ":" in host and not host.startswith("["):
        host = f"[{host}]"
    port = f":{parsed.port}" if parsed.port else ""
    path_segments = parsed.path.split("/")
    safe_segments = [
        "[redacted]" if re.fullmatch(r"[a-z0-9_-]{16,}|[a-f0-9-]{24,}", segment, re.I) else segment
        for segment in path_segments
    ]
    safe_path = "/".join(safe_segments) or "/"
    return urlunsplit((parsed.scheme, host + port, safe_path, "", ""))


def parse_cache_seconds(value: object) -> int:
    if not isinstance(value, str):
        return 0
    match = re.fullmatch(r"(\d+(?:\.\d+)?)s", value.strip())
    if not match:
        return 0
    return max(0, int(float(match.group(1))))


def lookup_url(url: str) -> dict[str, object]:
    api_key = os.environ.get("GOOGLE_SAFE_BROWSING_API_KEY", "").strip()
    if not api_key:
        return {
            "status": "not_configured",
            "message": "URL reputation is not configured. Add a Safe Browsing API key to the local server environment.",
        }

    now = time.time()
    cached = URL_CACHE.get(url)
    if cached and cached[0] > now:
        return cached[1]
    if cached:
        URL_CACHE.pop(url, None)

    query = urlencode({"key": api_key, "urls": url})
    request = Request(
        f"{API_ENDPOINT}?{query}",
        headers={"Accept": "application/json", "User-Agent": "AI-WebShield-Student-Prototype/0.2"},
        method="GET",
    )
    try:
        with urlopen(request, timeout=8) as response:
            payload = json.loads(response.read(256_000).decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, OSError, ValueError):
        return {
            "status": "unavailable",
            "message": "Google Safe Browsing could not complete the URL check.",
        }

    threats = payload.get("threats", []) if isinstance(payload, dict) else []
    threat_types = sorted(
        {
            threat_type
            for item in threats if isinstance(item, dict)
            for threat_type in item.get("threatTypes", []) if isinstance(threat_type, str)
        }
    )
    status = "match" if threat_types else "not_listed"
    cache_seconds = parse_cache_seconds(payload.get("cacheDuration") if isinstance(payload, dict) else None)
    result: dict[str, object] = {
        "status": status,
        "threatTypes": threat_types,
        "message": "" if threat_types else "No Safe Browsing list match was found.",
    }
    if cache_seconds:
        URL_CACHE[url] = (now + cache_seconds, result)
    return result


class WebShieldHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SAMPLES), **kwargs)

    def log_message(self, _format: str, *_args) -> None:
        # Avoid writing visited page paths or submitted lookup data to terminal logs.
        return

    def _set_extension_cors(self) -> None:
        origin = self.headers.get("Origin", "")
        if origin.startswith("chrome-extension://"):
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, status_code: int, payload: dict[str, object]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self._set_extension_cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _extension_origin_allowed(self) -> bool:
        origin = self.headers.get("Origin", "")
        return not origin or origin.startswith("chrome-extension://")

    def do_OPTIONS(self) -> None:
        if not self._extension_origin_allowed():
            self._send_json(403, {"status": "unavailable", "message": "Extension requests only."})
            return
        self.send_response(204)
        self._set_extension_cors()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self) -> None:
        if self.path == "/api/status":
            if not self._extension_origin_allowed():
                self._send_json(403, {"status": "unavailable", "message": "Extension requests only."})
                return
            configured = bool(os.environ.get("GOOGLE_SAFE_BROWSING_API_KEY", "").strip())
            self._send_json(200, {"configured": configured})
            return
        super().do_GET()

    def do_POST(self) -> None:
        if self.path != "/api/scan" or not self._extension_origin_allowed():
            self._send_json(403, {"status": "unavailable", "message": "Extension requests only."})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 1 or length > MAX_BODY_BYTES:
                raise ValueError("Invalid request size.")
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            raw_url = payload.get("url") if isinstance(payload, dict) else None
            if not isinstance(raw_url, str):
                raise ValueError("A page URL is required.")
            sanitized_url = sanitize_url(raw_url)
        except (UnicodeDecodeError, json.JSONDecodeError, ValueError):
            self._send_json(400, {"status": "unavailable", "message": "The page URL could not be checked."})
            return

        self._send_json(200, lookup_url(sanitized_url))


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), WebShieldHandler)
    print(f"AI WebShield local scanner: http://{HOST}:{PORT}/")
    print("Serving the sample pages and URL reputation endpoint. Press Ctrl+C to stop.")
    server.serve_forever()
