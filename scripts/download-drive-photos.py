#!/usr/bin/env python3
"""Descarga fotos de carpetas Drive (linkFotos) → public/assets/products/drive/{key}/"""

from __future__ import annotations

import codecs
import json
import re
import subprocess
import sys
import tempfile
import time
import unicodedata
import urllib.error
import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image

# Logs visibles al instante (no buffer)
try:
    sys.stdout.reconfigure(line_buffering=True)  # type: ignore[attr-defined]
except Exception:
    pass

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "src/data/business.seed.json"
OUT_DIR = ROOT / "public/assets/products/drive"
MAP_PATH = ROOT / "src/data/drive-images.json"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
MAX_IMAGES = 8
MAX_SIDE = 1400
WEBP_QUALITY = 80
SIZE_CHART_NAME = re.compile(
    r"tabla|medidas|talles|plantilla|^mod\s*[:_\-]",
    re.I,
)


def folder_id(url: str | None) -> str | None:
    if not url:
        return None
    m = re.search(r"/folders/([a-zA-Z0-9_-]+)", url)
    return m.group(1) if m else None


def slugify(text: str) -> str:
    s = unicodedata.normalize("NFD", text.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def row_key(row: dict) -> str:
    marca = (row.get("marca") or "").strip()
    modelo = (row.get("modelo") or "").strip()
    color = (row.get("color") or "").strip()
    return slugify(f"{marca}-{modelo}-{color}")


def list_folder_files(fid: str) -> list[tuple[str, str]]:
    url = f"https://drive.google.com/drive/folders/{fid}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as r:
        html = r.read().decode("utf-8", "replace")
    m = re.search(r"window\['_DRIVE_ivd'\]\s*=\s*'((?:\\'|[^'])*)'", html)
    if not m:
        return []
    # Drive serializa con escapes tipo \x5b; errors=ignore evita warnings
    decoded = codecs.decode(
        m.group(1).encode("latin1", "backslashreplace"),
        "unicode_escape",
        errors="ignore",
    )
    data = json.loads(decoded)
    files: list[tuple[str, str]] = []

    def walk(o):
        if isinstance(o, list):
            if (
                len(o) >= 4
                and isinstance(o[0], str)
                and isinstance(o[2], str)
                and isinstance(o[3], str)
                and (o[3].startswith("image/") or o[2].lower().endswith(
                    (".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif")
                ))
            ):
                files.append((o[0], o[2]))
            for x in o:
                walk(x)

    walk(data)

    def score(name: str) -> tuple:
        n = name.lower()
        heic = 1 if n.endswith((".heic", ".heif")) else 0
        return (
            0 if n.startswith("modelo") else 1,
            heic,
            0 if n.endswith((".jpg", ".jpeg", ".png", ".webp")) else 1,
            0 if "fullsize" in n or "vsco" in n else 1,
            name,
        )

    usable = [
        (fid, name)
        for fid, name in set(files)
        if not SIZE_CHART_NAME.search(name)
    ]
    # Más candidatos: algunos fallan (HEIC / basura)
    return sorted(usable, key=lambda t: score(t[1]))[: MAX_IMAGES * 3]


def download_file(file_id: str) -> bytes:
    url = f"https://drive.google.com/uc?export=download&id={file_id}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=90) as r:
        data = r.read()
    # confirm virus scan interstitial for large files
    if b"confirm=" in data[:2000] and b"<!DOCTYPE" in data[:200]:
        m = re.search(rb"confirm=([0-9A-Za-z_]+)", data)
        if m:
            url2 = f"https://drive.google.com/uc?export=download&confirm={m.group(1).decode()}&id={file_id}"
            req2 = urllib.request.Request(url2, headers={"User-Agent": UA})
            with urllib.request.urlopen(req2, timeout=90) as r2:
                data = r2.read()
    return data


def open_image(raw: bytes, name: str) -> Image.Image | None:
    try:
        return Image.open(BytesIO(raw))
    except Exception:
        pass
    # HEIC / formatos raros → sips (macOS)
    suffix = Path(name).suffix or ".bin"
    with tempfile.TemporaryDirectory() as td:
        src = Path(td) / f"in{suffix}"
        jpg = Path(td) / "out.jpg"
        src.write_bytes(raw)
        try:
            subprocess.run(
                ["sips", "-s", "format", "jpeg", str(src), "--out", str(jpg)],
                check=True,
                capture_output=True,
            )
            return Image.open(jpg)
        except Exception as e:
            print(f"  skip convert ({name}): {e}")
            return None


def to_webp(raw: bytes, dest: Path, name: str) -> bool:
    im = open_image(raw, name)
    if im is None:
        return False
    try:
        im = im.convert("RGB")
        w, h = im.size
        scale = min(1.0, MAX_SIDE / max(w, h))
        if scale < 1:
            im = im.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
        dest.parent.mkdir(parents=True, exist_ok=True)
        im.save(dest, "WEBP", quality=WEBP_QUALITY, method=4)
        return True
    except Exception as e:
        print(f"  skip save: {e}")
        return False


def main() -> None:
    seed = json.loads(SEED.read_text(encoding="utf-8"))
    rows = seed.get("ecommerce") or []
    mapping: dict[str, list[str]] = {}
    if MAP_PATH.exists():
        mapping = json.loads(MAP_PATH.read_text(encoding="utf-8"))

    seen_folders: dict[str, str] = {}  # folderId → key already done

    for i, row in enumerate(rows, 1):
        key = row_key(row)
        if not key:
            continue
        fid = folder_id(row.get("linkFotos"))
        if not fid:
            print(f"[{i}/{len(rows)}] {key}: sin carpeta Drive")
            continue

        dest_dir = OUT_DIR / key
        existing = sorted(dest_dir.glob("*.webp")) if dest_dir.exists() else []
        if len(existing) >= MAX_IMAGES:
            mapping[key] = [f"/assets/products/drive/{key}/{p.name}" for p in existing]
            print(f"[{i}/{len(rows)}] {key}: ya tiene {len(existing)} fotos")
            continue

        if fid in seen_folders:
            src_key = seen_folders[fid]
            mapping[key] = mapping.get(src_key, [])
            print(f"[{i}/{len(rows)}] {key}: reusa carpeta de {src_key}")
            continue

        print(f"[{i}/{len(rows)}] {key}: listando {fid}…")
        try:
            files = list_folder_files(fid)
        except Exception as e:
            print(f"  ERROR list: {e}")
            time.sleep(1)
            continue

        if not files:
            print("  sin imágenes")
            continue

        paths: list[str] = []
        n = 0
        for file_id, name in files:
            if SIZE_CHART_NAME.search(name):
                print(f"  skip tabla de talles: {name}")
                continue
            if n >= MAX_IMAGES:
                break
            out = dest_dir / f"{n + 1:02d}.webp"
            if out.exists() and out.stat().st_size > 1000:
                paths.append(f"/assets/products/drive/{key}/{out.name}")
                n += 1
                continue
            print(f"  ↓ {name} ({file_id[:8]}…)")
            try:
                raw = download_file(file_id)
                if to_webp(raw, out, name):
                    paths.append(f"/assets/products/drive/{key}/{out.name}")
                    n += 1
            except urllib.error.HTTPError as e:
                print(f"  HTTP {e.code}")
            except Exception as e:
                print(f"  ERR {e}")
            time.sleep(0.25)

        mapping[key] = paths
        seen_folders[fid] = key
        MAP_PATH.write_text(
            json.dumps(mapping, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"  → {len(paths)} fotos")

    MAP_PATH.write_text(
        json.dumps(mapping, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"\nListo: {len(mapping)} variantes → {MAP_PATH}")


if __name__ == "__main__":
    main()
