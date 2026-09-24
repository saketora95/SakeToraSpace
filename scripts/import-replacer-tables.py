"""Convert RODiffChecker's literal Python tables without executing the source."""
import argparse
import ast
import json
import re
import io
import tokenize
from pathlib import Path


def convert(source, output, regex_only=False):
    text = source.read_text(encoding="utf-8-sig")
    nodes = {node.targets[0].id: node.value for node in ast.parse(text).body
             if isinstance(node, ast.Assign) and isinstance(node.targets[0], ast.Name)}
    literal_node = nodes["LITERAL_REPLACE_TABLE"]
    literals = ast.literal_eval(literal_node)
    lines = text.splitlines()
    layers = []
    for name in ("FIRST_LAYER_REGEX_REPLACE_RULES", "SECOND_LAYER_REGEX_REPLACE_RULES"):
        rules = ast.literal_eval(nodes[name])
        converted = []
        for rule in rules:
            assert not rule.get("flags"), "Review regex flags before importing"
            pattern = rule["pattern"]
            re.compile(pattern)
            # Keep the Python pattern for inspection; compile the browser equivalent.
            browser_pattern = re.sub(r"\(\?P<([a-zA-Z_][a-zA-Z_0-9]*)>", r"(?<\1>", pattern)
            browser_pattern = browser_pattern.replace(r"\d", r"\p{Decimal_Number}")
            browser_pattern = browser_pattern.replace(r"\s", r"[\t-\r\x1c-\x20\x85\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]")
            browser_pattern = browser_pattern.replace(".+?", r"[^\n]+?")
            converted.append({"pattern": pattern, "browserPattern": browser_pattern,
                              "replacement": rule["replacement"]})
        layers.append(converted)
    output.mkdir(parents=True, exist_ok=True)
    header = '"use strict";\n// Generated from RODiffChecker/function/iteminfo_effect_table.py.\n// Update with scripts/import-replacer-tables.py; do not merge the legacy tables.\n'
    def declaration(name, value):
        return f"const {name} = {json.dumps(value, ensure_ascii=False, indent=2)};\n"
    comments = [token for token in tokenize.generate_tokens(io.StringIO(text).readline)
                if token.type == tokenize.COMMENT]
    def regex_declaration(name, source_name, rules):
        node = nodes[source_name]
        before = node.lineno - 2
        while before >= 0 and not lines[before].strip():
            before -= 1
        after = node.end_lineno
        while after < len(lines) and not lines[after].strip():
            after += 1
        prefix = "// " + lines[before].strip() + "\n" if before >= 0 and lines[before].strip().startswith("#region") else ""
        suffix = "// " + lines[after].strip() + "\n" if after < len(lines) and lines[after].strip().startswith("#endregion") else ""
        events = [(token.start, "  // " + token.string) for token in comments
                  if node.lineno <= token.start[0] <= node.end_lineno]
        for rule_node, rule in zip(node.elts, rules):
            encoded = json.dumps(rule, ensure_ascii=False, indent=2)
            events.append(((rule_node.lineno, rule_node.col_offset),
                           "\n".join("  " + line for line in encoded.splitlines()) + ","))
        return prefix + f"const {name} = [\n" + "\n".join(value for _, value in sorted(events)) + "\n];\n" + suffix
    if not regex_only:
        (output / "replaceList.js").write_text(header
            + declaration("replaceDictionary", literals), encoding="utf-8")
    (output / "replaceRegexList.js").write_text(header
        + "// Source order and maintenance comments are retained; the engine sorts each layer at runtime.\n"
        + regex_declaration("firstLayerRegexRules", "FIRST_LAYER_REGEX_REPLACE_RULES", layers[0])
        + regex_declaration("secondLayerRegexRules", "SECOND_LAYER_REGEX_REPLACE_RULES", layers[1]), encoding="utf-8")
    print(f"Imported {len(literals)} literal entries, {len(layers[0])}/{len(layers[1])} regex rules")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "assets/js/tools/ragnarok/replacer-data")
    parser.add_argument("--regex-only", action="store_true", help="Update regex tables without overwriting word/skill tables")
    args = parser.parse_args()
    convert(args.source, args.output, args.regex_only)
