#!/usr/bin/env python3
"""A five-second, dependency-free scrollback test for the Tarot shell."""

from __future__ import annotations

import signal
import sys
import time


COLORS = ("\033[95m", "\033[96m", "\033[92m", "\033[93m", "\033[91m")
DIM = "\033[2m"
RESET = "\033[0m"
STOPPED = False


def interrupt(_signal: int, _frame: object) -> None:
    global STOPPED
    STOPPED = True


def emit(index: int, total: int) -> None:
    color = COLORS[index % len(COLORS)]
    phase = ("scanning", "threading", "mapping", "stabilizing", "relaying")[index % 5]
    service = ("WarpGen", "Vite", "Express", "Mongo probe", "Port registry")[index % 5]
    width = 8 + (index % 20)
    progress = "█" * width + "░" * (28 - width)
    stamp = time.strftime("%H:%M:%S")
    detail = f"packet={index + 1:03d}/{total} · orbit={index % 12:02d} · signal=nominal"
    if index % 13 == 9:
        detail = "warning: aurora interference detected; retrying harmlessly"
    if index % 17 == 12:
        detail = "trace: simulated error stream captured and catalogued"
    print(f"{DIM}{stamp}{RESET} {color}✦ {service:<13}{RESET} {phase:<12} {color}[{progress}]{RESET} {detail}", flush=True)


def main() -> int:
    signal.signal(signal.SIGINT, interrupt)
    total = 100
    print(f"{COLORS[0]}TAROT TERMINAL STORM{RESET} · 5 seconds · native scrollback exercise", flush=True)
    for index in range(total):
        if STOPPED:
            print(f"{COLORS[3]}Tarot storm interrupted — returning to your shell.{RESET}", flush=True)
            return 130
        emit(index, total)
        time.sleep(0.05)
    print(f"{COLORS[2]}Storm complete — all 100 lines should be available in normal Terminal scrollback.{RESET}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
