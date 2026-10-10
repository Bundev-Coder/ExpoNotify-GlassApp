import os
import re

package_path = "node_modules/expo-modules-jsi/apple/Package.swift"
script_path = "node_modules/expo-modules-jsi/apple/scripts/build-xcframework.sh"
cxx_header = "node_modules/expo-modules-jsi/apple/Sources/ExpoModulesJSI-Cxx/include/RuntimeScheduler.h"

# 1. Patch Package.swift to only target iOS (Xcode scheme IDERunDestination fix)
if os.path.exists(package_path):
    with open(package_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Target only iOS
    content = re.sub(r'platforms:\s*\[[\s\S]*?\],', 'platforms: [.iOS("16.4")],', content)

    # Remove experimental upcoming features if present
    content = content.replace('.enableUpcomingFeature("InferIsolatedConformances"),', '')
    content = content.replace('.enableUpcomingFeature("NonisolatedNonsendingByDefault"),', '')

    with open(package_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully patched Package.swift: pinned platforms to iOS 16.4.")

# 2. Patch RuntimeScheduler.h: remove SWIFT_RETURNS_RETAINED from C++ constructors
if os.path.exists(cxx_header):
    with open(cxx_header, "r", encoding="utf-8") as f:
        cxx_content = f.read()
    cxx_content = cxx_content.replace("SWIFT_RETURNS_RETAINED RuntimeScheduler(", "RuntimeScheduler(")
    cxx_content = cxx_content.replace("SWIFT_RETURNS_RETAINED RuntimeScheduler()", "RuntimeScheduler()")
    with open(cxx_header, "w", encoding="utf-8") as f:
        f.write(cxx_content)
    print("Successfully patched RuntimeScheduler.h: removed SWIFT_RETURNS_RETAINED from constructors.")

# 3. Remove -quiet from build-xcframework.sh for verbose build logs
if os.path.exists(script_path):
    with open(script_path, "r", encoding="utf-8") as f:
        s_content = f.read()
    s_content = s_content.replace("-quiet", "")
    with open(script_path, "w", encoding="utf-8") as f:
        f.write(s_content)
    print("Successfully removed -quiet from build-xcframework.sh.")
