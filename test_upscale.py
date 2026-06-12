import os
from PIL import Image

def process_frame(input_path, output_path):
    print(f"Processing {input_path}...")
    img = Image.open(input_path)
    
    # Dimensions: 848 x 478
    width, height = img.size
    
    # 1. Crop watermark (bottom 40 pixels)
    crop_bottom = 40
    img_cropped = img.crop((0, 0, width, height - crop_bottom))
    
    # 2. Upscale (e.g., to 1920 width, keeping aspect ratio)
    target_width = 1920
    ratio = target_width / float(width)
    target_height = int(float(height - crop_bottom) * ratio)
    
    # Use high-quality Lanczos filter
    # Fallback to ANTIALIAS for older PIL versions
    resample_filter = getattr(Image, 'Resampling', Image).LANCZOS
    
    img_upscaled = img_cropped.resize((target_width, target_height), resample_filter)
    
    # 3. Save with high quality
    img_upscaled.save(output_path, quality=95, optimize=True)
    print(f"Saved to {output_path} (Size: {target_width}x{target_height})")

if __name__ == "__main__":
    input_file = "public/flow/ezgif-frame-001.jpg"
    
    # Ensure scratch directory exists
    os.makedirs("scratch", exist_ok=True)
    output_file = "scratch/test-frame-upscaled.jpg"
    
    process_frame(input_file, output_file)
