#!/usr/bin/env python3
"""Format source code for soft copyright submission with page headers and numbers."""

import os
import sys

HEADER = "益智小游戏合集平台系统 V3.2"
LINES_PER_PAGE = 50

def format_pages(inpath, outpath, start_page):
    with open(inpath, 'r', encoding='utf-8') as f:
        lines = [l.rstrip('\n').rstrip('\r') for l in f.readlines()]

    page = start_page
    idx = 0
    out_lines = []

    while idx < len(lines):
        out_lines.append('=' * 70)
        out_lines.append(f'  {HEADER}                                        第 {page} 页')
        out_lines.append('=' * 70)
        out_lines.append('')
        for _ in range(LINES_PER_PAGE):
            out_lines.append(lines[idx] if idx < len(lines) else '')
            idx += 1
        out_lines.append('')
        out_lines.append('-' * 70)
        page += 1

    with open(outpath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(out_lines))

    return page - 1

if __name__ == '__main__':
    base = os.path.dirname(os.path.abspath(__file__))
    docs = os.path.join(os.path.dirname(base), 'docs')

    front_in = os.path.join(docs, '源码前30页.txt')
    back_in = os.path.join(docs, '源码后30页.txt')
    front_out = os.path.join(docs, '源码前30页_格式化.txt')
    back_out = os.path.join(docs, '源码后30页_格式化.txt')

    last_front = format_pages(front_in, front_out, 1)
    last_back = format_pages(back_in, back_out, last_front + 1)

    print(f'Front 30 pages: pages 1-{last_front}')
    print(f'Back 30 pages: pages {last_front+1}-{last_back}')
    print(f'Output: {front_out}')
    print(f'Output: {back_out}')
