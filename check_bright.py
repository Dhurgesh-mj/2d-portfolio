from PIL import Image

img = Image.open('public/comic/frame_0001.webp')
w, h = img.size

max_bright = 0
max_x = 0

for x in range(w):
    p = img.getpixel((x, 200))
    brightness = p[0] + p[1] + p[2]
    if brightness > max_bright:
        max_bright = brightness
        max_x = x

print(f"Brightest pixel at x={max_x}, color={img.getpixel((max_x, 200))}")

# Let's also check if there is a vertical line by looking for a column that is consistently bright
column_brightness = [0] * w
for x in range(w):
    for y in range(0, h, 10):
        p = img.getpixel((x, y))
        column_brightness[x] += p[0] + p[1] + p[2]

max_col_bright = max(column_brightness)
max_col_x = column_brightness.index(max_col_bright)
print(f"Brightest column at x={max_col_x}")

