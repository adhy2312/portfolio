import urllib.request
import zipfile
import os

url = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesrgan-ncnn-vulkan-20220424-windows.zip"
zip_path = "scratch/realesrgan.zip"
extract_path = "scratch/realesrgan"

print("Downloading RealESRGAN...")
urllib.request.urlretrieve(url, zip_path)
print("Download complete. Extracting...")

with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall(extract_path)

print("Extraction complete.")
