#!/usr/bin/env python3
"""
Remove Cursor-related wording from Jira issue descriptions and drop the
cursor-ready label. Uses Jira REST API v3 (ADF descriptions) and
POST /rest/api/3/search/jql for issue search (legacy /search was removed).

Environment:
  JIRA_EMAIL       Atlassian account email
  JIRA_API_TOKEN   API token (https://id.atlassian.com/manage-profile/security/api-tokens)
  JIRA_BASE_URL    Optional, default https://cagdaskahramann.atlassian.net

Usage:
  export JIRA_EMAIL=you@example.com
  export JIRA_API_TOKEN=...
  python3 scripts/jira_clean_cursor_descriptions.py
  python3 scripts/jira_clean_cursor_descriptions.py --dry-run
"""

from __future__ import annotations

import argparse
import base64
import copy
import json
import os
import re
import ssl
import sys
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

DEFAULT_BASE = "https://cagdaskahramann.atlassian.net"
# Sprint-3 tasks used label cursor-ready; also catch description text without the label.
DEFAULT_JQL = 'project = SCRUM AND (labels = cursor-ready OR description ~ "cursor")'

CURSOR_LABEL = "cursor-ready"

# Phrase-level cleanup (case-insensitive), longest first
_PHRASE_SUBS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"(?i)\bcursor[-\s]?ready\b"), ""),
    (re.compile(r"(?i)\bfor\s+cursor\b"), "for developers"),
    (re.compile(r"(?i)\bwith\s+cursor\b"), "locally"),
    (re.compile(r"(?i)\bin\s+cursor\b"), "in the editor"),
    (re.compile(r"(?i)\busing\s+cursor\b"), "using your editor"),
    (re.compile(r"(?i)\bcursor\s+ile\b"), ""),
    (re.compile(r"(?i)\bcursor'?dan\b"), ""),
    (re.compile(r"(?i)\bcursor\s+üzerinden\b"), ""),
    (re.compile(r"(?i)\bcursor\s+üzerinden\s+kolayca\b"), "kolayca"),
    (re.compile(r"(?i)\biyice\s+cursor\s+dan\s+anlaşılacak\s+şekilde\b"), "net şekilde"),
    (re.compile(r"(?i)\bcursor\s+dan\s+anlaşılacak\s+şekilde\b"), "net şekilde"),
    (re.compile(r"(?i)\bcursor\s+için\b"), ""),
    (re.compile(r"(?i)\bcursor-ready\b"), ""),
    (re.compile(r"(?i)\bco-authored-by:\s*cursor\b.*", re.DOTALL), ""),
]


def _scrub_text(text: str) -> str:
    s = text
    for pat, repl in _PHRASE_SUBS:
        s = pat.sub(repl, s)
    s = re.sub(r"(?i)\bcursor\b", "", s)
    s = re.sub(r"[ \t]{2,}", " ", s)
    s = re.sub(r"\s*\n\s*", "\n", s)
    s = re.sub(r"\(\s*\)", "", s)
    s = re.sub(r"\[\s*\]", "", s)
    s = re.sub(r"\s{2,}", " ", s).strip()
    s = re.sub(r"^[,:;–\-•\s]+", "", s)
    s = re.sub(r"[,:;–\-•\s]+$", "", s)
    return s.strip()


def _clean_adf_node(node: Any) -> Any:
    if not isinstance(node, dict):
        return node
    if node.get("type") == "text":
        new_t = _scrub_text(node.get("text", ""))
        if not new_t:
            return None
        out = copy.deepcopy(node)
        out["text"] = new_t
        return out
    if "content" in node and isinstance(node["content"], list):
        new_children: list[Any] = []
        for child in node["content"]:
            cleaned = _clean_adf_node(child)
            if cleaned is not None:
                new_children.append(cleaned)
        if not new_children:
            return None
        out = copy.deepcopy(node)
        out["content"] = new_children
        return out
    return copy.deepcopy(node)


def _clean_description(adf: dict[str, Any] | None) -> dict[str, Any] | None:
    if not adf or adf.get("type") != "doc":
        return adf
    out = copy.deepcopy(adf)
    content = out.get("content")
    if not isinstance(content, list):
        return out
    new_blocks: list[Any] = []
    for block in content:
        c = _clean_adf_node(block)
        if c is not None:
            new_blocks.append(c)
    out["content"] = new_blocks
    return out


def _labels_without_cursor(labels: list[str] | None) -> list[str]:
    if not labels:
        return []
    return [x for x in labels if x.lower() != CURSOR_LABEL.lower()]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Print changes only")
    parser.add_argument("--jql", default=os.environ.get("JIRA_JQL", DEFAULT_JQL))
    args = parser.parse_args()

    email = os.environ.get("JIRA_EMAIL", "").strip()
    token = os.environ.get("JIRA_API_TOKEN", "").strip()
    base = os.environ.get("JIRA_BASE_URL", DEFAULT_BASE).rstrip("/")

    if not email or not token:
        print("Set JIRA_EMAIL and JIRA_API_TOKEN.", file=sys.stderr)
        return 1

    auth = base64.b64encode(f"{email}:{token}".encode()).decode()
    ctx = ssl.create_default_context()

    def api(method: str, path: str, data: dict[str, Any] | None = None) -> Any:
        url = f"{base}{path}"
        body = json.dumps(data).encode() if data is not None else None
        req = Request(
            url,
            data=body,
            method=method,
            headers={
                "Authorization": f"Basic {auth}",
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        )
        with urlopen(req, context=ctx) as resp:
            raw = resp.read().decode()
            if not raw:
                return None
            return json.loads(raw)

    def search_page(next_page_token: str | None) -> dict[str, Any]:
        """Jira Cloud: legacy POST /rest/api/3/search was removed; use /search/jql."""
        payload: dict[str, Any] = {
            "jql": args.jql,
            "maxResults": 50,
            "fields": ["summary", "description", "labels"],
        }
        if next_page_token:
            payload["nextPageToken"] = next_page_token
        return api("POST", "/rest/api/3/search/jql", payload)

    updated = 0
    next_token: str | None = None
    while True:
        try:
            page = search_page(next_token)
        except HTTPError as e:
            err = e.read().decode() if e.fp else str(e)
            print(f"HTTP {e.code}: {err}", file=sys.stderr)
            return 1
        except URLError as e:
            print(f"Network error: {e}", file=sys.stderr)
            return 1

        issues = page.get("issues") or []
        if not issues:
            break
        for issue in issues:
            key = issue["key"]
            fields = issue.get("fields") or {}
            desc = fields.get("description")
            labels = list(fields.get("labels") or [])
            new_desc = _clean_description(desc) if desc else desc
            if (
                isinstance(new_desc, dict)
                and new_desc.get("type") == "doc"
                and not (new_desc.get("content") or [])
            ):
                new_desc = desc
            new_labels = _labels_without_cursor(labels)

            desc_changed = json.dumps(new_desc, sort_keys=True) != json.dumps(desc, sort_keys=True)
            labels_changed = new_labels != labels

            if not desc_changed and not labels_changed:
                print(f"{key}: skip (no cursor content)")
                continue

            print(f"{key}: update description={desc_changed} labels={labels_changed}")
            if args.dry_run:
                continue

            body: dict[str, Any] = {"fields": {}}
            if desc_changed:
                body["fields"]["description"] = new_desc
            if labels_changed:
                body["fields"]["labels"] = new_labels
            try:
                api("PUT", f"/rest/api/3/issue/{key}", body)
                updated += 1
            except HTTPError as e:
                err = e.read().decode() if e.fp else str(e)
                print(f"  FAILED {e.code}: {err}", file=sys.stderr)
                return 1

        if page.get("isLast"):
            break
        next_token = page.get("nextPageToken")
        if not next_token:
            print("Warning: no nextPageToken but isLast is false; stopping.", file=sys.stderr)
            break

    if args.dry_run:
        print("Dry run complete.")
    else:
        print(f"Updated {updated} issue(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
