import os
import tarfile
import zipfile
import shutil

base_dir = r"c:\Users\ad\Documents\ExpoNotify_GlassApp"
tar_gz_path = os.path.join(base_dir, "build_artifact.tar.gz")
extract_dir = os.path.join(base_dir, "temp_payload")
payload_dir = os.path.join(extract_dir, "Payload")
ipa_path = os.path.join(base_dir, "NotifyGlass.ipa")

if os.path.exists(extract_dir):
    shutil.rmtree(extract_dir)
os.makedirs(payload_dir, exist_ok=True)

print("Extracting tar.gz...")
with tarfile.open(tar_gz_path, "r:gz") as tar:
    tar.extractall(path=payload_dir)

print("Creating NotifyGlass.ipa...")
with zipfile.ZipFile(ipa_path, "w", zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(extract_dir):
        for file in files:
            full_path = os.path.join(root, file)
            arcname = os.path.relpath(full_path, extract_dir)
            zipf.write(full_path, arcname)

if os.path.exists(extract_dir):
    shutil.rmtree(extract_dir)

size_mb = round(os.path.getsize(ipa_path) / (1024 * 1024), 2)
print(f"SUCCESS: Created {ipa_path} ({size_mb} MB)")
