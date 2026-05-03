import os
from rembg import remove
from PIL import Image

input_path = 'src/assets/dp.jpg'
output_path = 'src/assets/dp-cutout.png'

print(f"Processing {input_path}...")
input_img = Image.open(input_path)
output_img = remove(input_img)
output_img.save(output_path)
print(f"Saved transparent image to {output_path}")
