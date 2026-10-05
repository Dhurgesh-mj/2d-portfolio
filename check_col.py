from PIL import Image
img = Image.open('public/comic/frame_0001.webp')
print(f"Color at x=1133, y=200: {img.getpixel((1133, 200))}")
print(f"Color at x=960, y=200: {img.getpixel((960, 200))}")
