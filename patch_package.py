import os
import re

package_path = "node_modules/expo-modules-jsi/apple/Package.swift"
script_path = "node_modules/expo-modules-jsi/apple/scripts/build-xcframework.sh"
sources_dir = "node_modules/expo-modules-jsi/apple/Sources"
cxx_header = "node_modules/expo-modules-jsi/apple/Sources/ExpoModulesJSI-Cxx/include/RuntimeScheduler.h"

# 1. Patch Package.swift
if os.path.exists(package_path):
    with open(package_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Downgrade tools version
    content = content.replace("swift-tools-version: 6.2", "swift-tools-version: 6.0")

    # Only target iOS so xcodebuild never defaults to macOS host
    content = re.sub(r'\.tvOS\("[^"]+"\),?', '', content)
    content = re.sub(r'\.macOS\("[^"]+"\),?', '', content)

    # Remove upcoming features not in 6.0
    content = content.replace('.enableUpcomingFeature("InferIsolatedConformances"),', '')
    content = content.replace('.enableUpcomingFeature("NonisolatedNonsendingByDefault"),', '')

    # Set swiftLanguageModes to [.v5] for maximum compatibility with weak var & Sendable
    content = content.replace("swiftLanguageModes: [.v6]", "swiftLanguageModes: [.v5]")

    # Remove all trailing commas before ) or ]
    content = re.sub(r',\s*(\n\s*[\)\]])', r'\1', content)

    with open(package_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully patched Package.swift for iOS ARM64 & Swift 6.0/5.0 compatibility.")

# 2. Patch RuntimeScheduler.h to remove invalid SWIFT_RETURNS_RETAINED from C++ constructors
if os.path.exists(cxx_header):
    with open(cxx_header, "r", encoding="utf-8") as f:
        cxx_content = f.read()
    cxx_content = cxx_content.replace("SWIFT_RETURNS_RETAINED RuntimeScheduler(", "RuntimeScheduler(")
    cxx_content = cxx_content.replace("SWIFT_RETURNS_RETAINED RuntimeScheduler()", "RuntimeScheduler()")
    with open(cxx_header, "w", encoding="utf-8") as f:
        f.write(cxx_content)
    print("Successfully patched RuntimeScheduler.h: removed SWIFT_RETURNS_RETAINED from constructors.")

# 3. Patch Swift sources: weak let -> weak var, add @unchecked Sendable
if os.path.exists(sources_dir):
    count = 0
    for root, _, files in os.walk(sources_dir):
        for f in files:
            if f.endswith(".swift"):
                p = os.path.join(root, f)
                with open(p, "r", encoding="utf-8") as sf:
                    txt = sf.read()
                changed = False
                if "weak let" in txt:
                    txt = txt.replace("weak let", "weak var")
                    changed = True
                if "class JavaScriptPropNameID: JavaScriptType" in txt and "@unchecked Sendable" not in txt:
                    txt = txt.replace("class JavaScriptPropNameID: JavaScriptType", "class JavaScriptPropNameID: JavaScriptType, @unchecked Sendable")
                    changed = True
                if "class JavaScriptValue: JavaScriptType, Equatable, Escapable" in txt and "@unchecked Sendable" not in txt:
                    txt = txt.replace("class JavaScriptValue: JavaScriptType, Equatable, Escapable", "class JavaScriptValue: JavaScriptType, Equatable, Escapable, @unchecked Sendable")
                    changed = True
                if "class JavaScriptError: Error, Sendable" in txt:
                    txt = txt.replace("class JavaScriptError: Error, Sendable", "class JavaScriptError: Error, @unchecked Sendable")
                    changed = True
                if changed:
                    with open(p, "w", encoding="utf-8") as sf:
                        sf.write(txt)
                    count += 1
    print(f"Successfully patched {count} Swift source files for Swift 6.0 & Sendable compatibility.")

# 4. Remove -quiet from build-xcframework.sh
if os.path.exists(script_path):
    with open(script_path, "r", encoding="utf-8") as f:
        s_content = f.read()
    s_content = s_content.replace("-quiet", "")
    with open(script_path, "w", encoding="utf-8") as f:
        f.write(s_content)
    print("Successfully removed -quiet from build-xcframework.sh for verbose build logs.")
