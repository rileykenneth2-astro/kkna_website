"""Cut the circle mark out of kkna_logo.jpeg and save it as transparent PNGs.

Stopgap until the board finds a vector (SVG/AI/EPS) logo. Usage:
    sips -s format bmp kkna_logo.jpeg --out /tmp/logo.bmp
    python3 tools/make_logo_mark.py /tmp/logo.bmp src/images
"""
import struct, sys, zlib, os

BRAND_RED = (213, 30, 62)
TEXT_BOX = (238, 195, 447, 372)  # x0, y0, x1, y1 of the "KENNEDY KING..." wordmark

def read_bmp(path):
    b = open(path, 'rb').read()
    off = struct.unpack_from('<I', b, 10)[0]
    w, h = struct.unpack_from('<ii', b, 18)
    bpp = struct.unpack_from('<H', b, 28)[0] // 8
    row = ((w * bpp + 3) // 4) * 4
    px = []
    for y in range(abs(h)):
        src_y = abs(h) - 1 - y if h > 0 else y
        base = off + src_y * row
        px.append([(b[base + x*bpp + 2], b[base + x*bpp + 1], b[base + x*bpp]) for x in range(w)])
    return w, abs(h), px

def write_png(path, w, h, rows):
    raw = b''.join(b'\x00' + bytes(v for p in r for v in p) for r in rows)
    def chunk(t, d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)) \
        + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    open(path, 'wb').write(png)

def main(bmp, out_dir):
    w, h, px = read_bmp(bmp)
    x0, y0, x1, y1 = TEXT_BOX
    alpha = [[0.0] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            if x0 <= x < x1 and y0 <= y < y1:
                continue
            a = (255 - px[y][x][1]) / (255 - 28)  # green channel: 255 on white, ~28 on the red
            alpha[y][x] = 0.0 if a < 0.08 else min(a, 1.0)
    ys = [y for y in range(h) if any(alpha[y])]
    xs = [x for x in range(w) if any(alpha[y][x] for y in range(h))]
    top, bottom, left, right = ys[0], ys[-1] + 1, xs[0], xs[-1] + 1
    for name, color, square in (('logo-mark.png', BRAND_RED, False),
                                ('logo-mark-white.png', (255, 255, 255), False),
                                ('favicon.png', BRAND_RED, True)):
        cw, ch = right - left, bottom - top
        size = max(cw, ch) if square else None
        W, H = (size, size) if square else (cw, ch)
        ox, oy = ((W - cw) // 2, (H - ch) // 2)
        rows = [[(0, 0, 0, 0)] * W for _ in range(H)]
        for y in range(ch):
            for x in range(cw):
                a = alpha[top + y][left + x]
                if a:
                    rows[oy + y][ox + x] = (*color, round(a * 255))
        write_png(os.path.join(out_dir, name), W, H, rows)
        print(name, W, 'x', H)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
