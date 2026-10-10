import os
import re

package_path = "node_modules/expo-modules-jsi/apple/Package.swift"
script_path = "node_modules/expo-modules-jsi/apple/scripts/build-xcframework.sh"
sources_dir = "node_modules/expo-modules-jsi/apple/Sources"

if os.path.exists(package_path):
    with open(package_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Downgrade tools version
    content = content.replace("swift-tools-version: 6.2", "swift-tools-version: 6.0")

    # 2. Only target iOS so xcodebuild never defaults to macOS host
    content = re.sub(r'\.tvOS\("[^"]+"\),?', '', content)
    content = re.sub(r'\.macOS\("[^"]+"\),?', '', content)

    # 3. Remove upcoming features not in 6.0
    content = content.replace('.enableUpcomingFeature("InferIsolatedConformances"),', '')
    content = content.replace('.enableUpcomingFeature("NonisolatedNonsendingByDefault"),', '')

    # 4. Remove all trailing commas before ) or ]
    content = re.sub(r',\s*(\n\s*[\)\]])', r'\1', content)

    with open(package_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully patched Package.swift for iOS ARM64 & Swift 6.0 compatibility.")

if os.path.exists(sources_dir):
    count = 0
    for root, _, files in os.walk(sources_dir):
        for f in files:
            if f.endswith(".swift"):
                p = os.path.join(root, f)
                with open(p, "r", encoding="utf-8") as sf:
                    txt = sf.read()
                if "weak let" in txt:
                    txt = txt.replace("weak let", "weak var")
                    with open(p, "w", encoding="utf-8") as sf:
                        sf.write(txt)
                    count += 1
    print(f"Successfully replaced 'weak let' -> 'weak var' in {count} Swift source files.")

if os.path.exists(script_path):
    with open(script_path, "r", encoding="utf-8") as f:
        s_content = f.read()
    s_content = s_content.replace("-quiet", "")
    with open(script_path, "w", encoding="utf-8") as f:
        f.write(s_content)
    print("Successfully removed -quiet from build-xcframework.sh for verbose build logs.")
