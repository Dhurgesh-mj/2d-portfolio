from PIL import Image
import sys

img = Image.open('public/comic/frame_0001.webp')
w, h = img.size
print(f"Image size: {w}x{h}")

# check the center column
cx = w // 2
print(f"Center X: {cx}")

for y in range(200, 210):
    for x in range(cx - 2, cx + 3):
        print(f"({x}, {y}): {img.getpixel((x, y))}")

