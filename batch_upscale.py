import os
import glob
from PIL import Image

def batch_process(input_dir, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    
    # Get all frames, sorted
    files = sorted(glob.glob(os.path.join(input_dir, "ezgif-frame-*.jpg")))
    
    if not files:
        print("No files found!")
        return
        
    print(f"Found {len(files)} frames. Starting batch process...")
    
    for i, file_path in enumerate(files):
        filename = os.path.basename(file_path)
        output_path = os.path.join(output_dir, filename)
        
        img = Image.open(file_path)
        width, height = img.size
        
        # Crop bottom 40 pixels
        crop_bottom = 40
        img_cropped = img.crop((0, 0, width, height - crop_bottom))
        
        # Upscale to 1920 width
        target_width = 1920
        ratio = target_width / float(width)
        target_height = int(float(height - crop_bottom) * ratio)
        
        resample_filter = getattr(Image, 'Resampling', Image).LANCZOS
        img_upscaled = img_cropped.resize((target_width, target_height), resample_filter)
        
        # Overwrite the original in public/flow
        img_upscaled.save(output_path, quality=95, optimize=True)
        
        if (i + 1) % 10 == 0:
            print(f"Processed {i + 1}/{len(files)} frames...")

    print("Batch processing complete!")

if __name__ == "__main__":
    # We will process in-place by writing to a temp dir then replacing, 
    # or just write directly to public/flow since PIL loads the whole image into memory anyway.
    # To be safe, let's write directly to public/flow (it replaces the file).
    input_directory = "public/flow"
    batch_process(input_directory, input_directory)
