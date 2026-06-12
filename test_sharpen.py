import os
from PIL import Image, ImageFilter, ImageEnhance

def process_frame(input_path, output_path):
    print(f"Processing {input_path}...")
    img = Image.open(input_path)
    width, height = img.size
    
    crop_bottom = 40
    img = img.crop((0, 0, width, height - crop_bottom))
    
    # 1. Upscale
    target_width = 1920
    ratio = target_width / float(width)
    target_height = int(float(height - crop_bottom) * ratio)
    resample_filter = getattr(Image, 'Resampling', Image).LANCZOS
    img = img.resize((target_width, target_height), resample_filter)
    
    # 2. Extreme Contrast & Color
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.3) # Much higher contrast
    color_enhancer = ImageEnhance.Color(img)
    img = color_enhancer.enhance(1.2)
    
    # 3. EXTREME Sharpening Pipeline
    # Pass 1: Broad unsharp mask for local contrast
    img = img.filter(ImageFilter.UnsharpMask(radius=3, percent=300, threshold=2))
    # Pass 2: Fine unsharp mask for microscopic edges
    img = img.filter(ImageFilter.UnsharpMask(radius=1, percent=200, threshold=1))
    # Pass 3: Edge enhance
    img = img.filter(ImageFilter.EDGE_ENHANCE_MORE)
    
    # Save
    img.save(output_path, quality=100, subsampling=0)
    print(f"Saved to {output_path} (Size: {target_width}x{target_height})")

if __name__ == "__main__":
    input_file = "public/flow/ezgif-frame-100.jpg"
    os.makedirs("scratch", exist_ok=True)
    output_file = "scratch/test-sharp-extreme.jpg"
    process_frame(input_file, output_file)
