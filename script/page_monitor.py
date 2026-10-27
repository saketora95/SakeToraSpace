"""定期爬取指定網頁，檢查頁面是否包含／不包含指定字串。

讀取同目錄下的 config.json，依設定的間隔重複檢查；任何一項檢查不符時發出提示音並以醒目顏色顯示。

用法：
    python page_monitor.py            # 持續監看，Ctrl+C 結束
    python page_monitor.py --once     # 只檢查一輪
    python page_monitor.py --config other.json
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

DEFAULT_CONFIG = Path(__file__).resolve().parent / "config.json"
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/130.0 Safari/537.36"
)
MIN_INTERVAL_SECONDS = 10

RESET = "\033[0m"
OK_STYLE = "\033[32m"
FAIL_STYLE = "\033[1;97;41m"
ERROR_STYLE = "\033[1;30;43m"
DIM_STYLE = "\033[2m"


class ConfigError(Exception):
    pass


@dataclass
class Target:
    name: str
    url: str
    must_contain: list = field(default_factory=list)
    must_not_contain: list = field(default_factory=list)


@dataclass
class Config:
    interval_seconds: int
    timeout_seconds: int
    user_agent: str
    beep: bool
    targets: list


def _to_string_list(value, where):
    """接受字串或字串陣列；空字串、空陣列、null 都視為留空。"""
    if value is None:
        return []
    if isinstance(value, str):
        return [value] if value.strip() else []
    if isinstance(value, list):
        if not all(isinstance(item, str) for item in value):
            raise ConfigError(f"{where} 只能包含字串")
        return [item for item in value if item.strip()]
    raise ConfigError(f"{where} 必須是字串或字串陣列")


def load_config(path):
    try:
        raw = json.loads(Path(path).read_text(encoding="utf-8-sig"))
    except FileNotFoundError:
        raise ConfigError(f"找不到設定檔：{path}")
    except json.JSONDecodeError as exc:
        raise ConfigError(f"設定檔不是有效的 JSON（第 {exc.lineno} 行）：{exc.msg}")

    interval = raw.get("interval_seconds", 600)
    if not isinstance(interval, (int, float)) or interval < MIN_INTERVAL_SECONDS:
        raise ConfigError(f"interval_seconds 必須是不小於 {MIN_INTERVAL_SECONDS} 的數字")

    timeout = raw.get("timeout_seconds", 20)
    if not isinstance(timeout, (int, float)) or timeout <= 0:
        raise ConfigError("timeout_seconds 必須是正數")

    raw_targets = raw.get("targets")
    if not isinstance(raw_targets, list) or not raw_targets:
        raise ConfigError("targets 必須是至少包含一個網頁的陣列")

    targets = []
    for index, item in enumerate(raw_targets, start=1):
        where = f"targets 第 {index} 項"
        if not isinstance(item, dict):
            raise ConfigError(f"{where} 必須是物件")
        url = item.get("url")
        if not isinstance(url, str) or not url.startswith(("http://", "https://")):
            raise ConfigError(f"{where} 的 url 必須是 http:// 或 https:// 開頭的網址")
        target = Target(
            name=str(item.get("name") or url),
            url=url,
            must_contain=_to_string_list(item.get("must_contain"), f"{where} 的 must_contain"),
            must_not_contain=_to_string_list(item.get("must_not_contain"), f"{where} 的 must_not_contain"),
        )
        if not target.must_contain and not target.must_not_contain:
            raise ConfigError(f"{where}（{target.name}）的 must_contain 與 must_not_contain 至少要填寫一項")
        targets.append(target)

    return Config(
        interval_seconds=int(interval),
        timeout_seconds=int(timeout),
        user_agent=str(raw.get("user_agent") or DEFAULT_USER_AGENT),
        beep=bool(raw.get("beep", True)),
        targets=targets,
    )


def fetch(url, timeout, user_agent):
    request = urllib.request.Request(url, headers={"User-Agent": user_agent})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        body = response.read()
        charset = response.headers.get_content_charset() or "utf-8"
    try:
        return body.decode(charset, errors="replace")
    except LookupError:
        return body.decode("utf-8", errors="replace")


def check_target(target, config):
    """回傳 (是否全部通過, 結果列表)；結果為 (狀態, 說明)，狀態為 ok / fail / error。"""
    try:
        html = fetch(target.url, config.timeout_seconds, config.user_agent)
    except urllib.error.HTTPError as exc:
        return False, [("error", f"HTTP {exc.code} {exc.reason}")]
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        reason = getattr(exc, "reason", exc)
        return False, [("error", f"無法取得頁面：{reason}")]

    results = []
    for text in target.must_contain:
        if text in html:
            results.append(("ok", f"包含「{text}」"))
        else:
            results.append(("fail", f"應包含但找不到「{text}」"))
    for text in target.must_not_contain:
        if text in html:
            results.append(("fail", f"不應包含但出現了「{text}」"))
        else:
            results.append(("ok", f"未包含「{text}」"))
    return all(status == "ok" for status, _ in results), results


def beep():
    try:
        import winsound

        for _ in range(3):
            winsound.Beep(1200, 250)
            time.sleep(0.1)
    except (ImportError, RuntimeError):
        sys.stdout.write("\a")
        sys.stdout.flush()


def print_target_result(target, passed, results):
    if passed:
        print(f"{OK_STYLE}[通過]{RESET} {target.name}")
    else:
        print(f"{FAIL_STYLE} [不符] {target.name} {RESET}")
        print(f"       {DIM_STYLE}{target.url}{RESET}")
    for status, message in results:
        if status == "ok":
            print(f"       {OK_STYLE}✓{RESET} {message}")
        elif status == "fail":
            print(f"       {FAIL_STYLE} ✗ {message} {RESET}")
        else:
            print(f"       {ERROR_STYLE} ! {message} {RESET}")


def run_round(config):
    print(f"\n=== {datetime.now():%Y-%m-%d %H:%M:%S} 開始檢查 {len(config.targets)} 個網頁 ===")
    failed = 0
    for target in config.targets:
        passed, results = check_target(target, config)
        print_target_result(target, passed, results)
        if not passed:
            failed += 1
    if failed:
        print(f"{FAIL_STYLE} 共 {failed} 個網頁檢查不符 {RESET}")
        if config.beep:
            beep()
    else:
        print(f"{OK_STYLE}全部通過{RESET}")
    return failed


def main():
    parser = argparse.ArgumentParser(description="定期檢查網頁是否包含／不包含指定字串")
    parser.add_argument("--config", default=str(DEFAULT_CONFIG), help="設定檔路徑（預設為同目錄的 config.json）")
    parser.add_argument("--once", action="store_true", help="只檢查一輪後結束")
    args = parser.parse_args()

    # 讓 Windows 主控台啟用 ANSI 顏色與 UTF-8 輸出
    os.system("")
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    try:
        config = load_config(args.config)
    except ConfigError as exc:
        print(f"{ERROR_STYLE} 設定錯誤 {RESET} {exc}")
        return 2

    if args.once:
        return 1 if run_round(config) else 0

    print(f"每 {config.interval_seconds} 秒檢查一次，按 Ctrl+C 結束。")
    try:
        while True:
            started = time.monotonic()
            run_round(config)
            remaining = config.interval_seconds - (time.monotonic() - started)
            next_run = datetime.fromtimestamp(time.time() + max(remaining, 0))
            print(f"{DIM_STYLE}下次檢查：{next_run:%H:%M:%S}{RESET}")
            time.sleep(max(remaining, 0))
    except KeyboardInterrupt:
        print("\n已停止監看。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
