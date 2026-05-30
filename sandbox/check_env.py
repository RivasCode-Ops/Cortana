#!/usr/bin/env python3
"""Validacao minima do ambiente Python."""

import sys
import platform


def main() -> int:
    print("=== Python Dev OK ===")
    print(f"Python:  {sys.version.split()[0]}")
    print(f"Arch:    {platform.machine()}")
    print(f"OS:      {platform.system()} {platform.release()}")
    print("Ambiente pronto para codar.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
