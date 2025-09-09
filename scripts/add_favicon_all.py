import os

FAVICON_LINES = [
    '<link rel="icon" type="image/webp" href="/assets/images/vitalora logo.webp">',
    '<link rel="shortcut icon" type="image/webp" href="/assets/images/vitalora logo.webp">',
]


def insert_before_closing_head(content: str):
    lower = content.lower()
    idx = lower.rfind("</head>")
    if idx == -1:
        return None

    # Determine indentation based on the line where </head> appears
    line_start = content.rfind("\n", 0, idx) + 1
    indent = ""
    while line_start < len(content) and content[line_start] in (" ", "\t"):
        indent += content[line_start]
        line_start += 1

    injection = "\n".join(indent + line for line in FAVICON_LINES) + "\n"
    return content[:idx] + injection + content[idx:]


def file_needs_update(path: str) -> bool:
    try:
        with open(path, "r", encoding="utf-8") as f:
            txt = f.read()
        return "vitalora logo.webp" not in txt
    except Exception:
        return False


def process_file(path: str) -> bool:
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        updated = insert_before_closing_head(content)
        if updated is None:
            return False
        with open(path, "w", encoding="utf-8") as f:
            f.write(updated)
        return True
    except Exception:
        return False


def main():
    changed = 0
    for root, _, files in os.walk("."):
        for name in files:
            if not name.endswith(".html"):
                continue
            path = os.path.join(root, name)
            if not file_needs_update(path):
                continue
            if process_file(path):
                print(f"Updated favicon in {path}")
                changed += 1
    print(f"Done. Files updated: {changed}")


if __name__ == "__main__":
    main()


