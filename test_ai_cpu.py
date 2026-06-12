import os
import subprocess
from PIL import Image

def process_test_frame():
    input_file = "public/flow/ezgif-frame-100.jpg"
    cropped_file = "scratch/temp_crop.jpg"
    final_output = "scratch/test-ai-upscale-cpu.jpg"
    
    img = Image.open(input_file)
    width, height = img.size
    img = img.crop((0, 0, width, height - 40))
    img.save(cropped_file, quality=100)
    
    exe_path = os.path.join("scratch", "realesrgan", "realesrgan-ncnn-vulkan.exe")
    
    print(f"Running RealESRGAN on CPU on {cropped_file}...")
    cmd = [
        exe_path,
        "-i", cropped_file,
        "-o", final_output,
        "-n", "realesrgan-x4plus",
        "-g", "-1", # Force CPU
    ]
    
    subprocess.run(cmd, capture_output=True, text=True)
    
    # Check if black
    img_out = Image.open(final_output)
    extrema = img_out.getextrema()
    if extrema == ((0, 0), (0, 0), (0, 0)):
        print("STILL BLACK!")
    else:
        print("Success! Image is not black.")

if __name__ == "__main__":
    process_test_frame()
