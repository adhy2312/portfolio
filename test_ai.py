import os
import subprocess
from PIL import Image

def process_test_frame():
    input_file = "public/flow/ezgif-frame-100.jpg"
    cropped_file = "scratch/temp_crop.jpg"
    final_output = "scratch/test-ai-upscale.jpg"
    
    print("Cropping watermark...")
    img = Image.open(input_file)
    width, height = img.size
    img = img.crop((0, 0, width, height - 40))
    img.save(cropped_file, quality=100)
    
    # Path to executable
    exe_path = os.path.join("scratch", "realesrgan", "realesrgan-ncnn-vulkan.exe")
    
    print(f"Running RealESRGAN on {cropped_file}...")
    cmd = [
        exe_path,
        "-i", cropped_file,
        "-o", final_output,
        "-n", "realesrgan-x4plus", # The best general purpose model
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print(f"Successfully generated AI upscaled image at {final_output}")
    else:
        print(f"RealESRGAN failed:\n{result.stderr}")

if __name__ == "__main__":
    process_test_frame()
