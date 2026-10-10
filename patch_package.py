import os
import re

package_path = "node_modules/expo-modules-jsi/apple/Package.swift"
script_path = "node_modules/expo-modules-jsi/apple/scripts/build-xcframework.sh"
cxx_header = "node_modules/expo-modules-jsi/apple/Sources/ExpoModulesJSI-Cxx/include/RuntimeScheduler.h"
js_runtime = "node_modules/expo-modules-jsi/apple/Sources/ExpoModulesJSI/Runtime/JavaScriptRuntime.swift"

# 1. Patch Package.swift to only target iOS
if os.path.exists(package_path):
    with open(package_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Target only iOS
    content = re.sub(r'platforms:\s*\[[\s\S]*?\],', 'platforms: [.iOS("16.4")],', content)

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

# 3. Patch JavaScriptRuntime.swift: wrap call-scoped pointers in NonisolatedUnsafeVar to bypass Swift 6.2 strict concurrency data race checks
if os.path.exists(js_runtime):
    with open(js_runtime, "r", encoding="utf-8") as f:
        js_content = f.read()

    part = (
        "    nonisolated(unsafe) let thisPtr = thisPtr\n"
        "    nonisolated(unsafe) let argumentsPtr = argumentsPtr\n"
        "    nonisolated(unsafe) let resultPtr = resultPtr"
    )
    replacement = (
        "    let unsafeThisPtr = NonisolatedUnsafeVar(thisPtr)\n"
        "    let unsafeArgumentsPtr = NonisolatedUnsafeVar(argumentsPtr)\n"
        "    let unsafeResultPtr = NonisolatedUnsafeVar(resultPtr)"
    )

    js_content = js_content.replace(part, replacement)
    js_content = js_content.replace(
        "nonisolated(unsafe) let resultPtr = resultPtr",
        "let unsafeResultPtr = NonisolatedUnsafeVar(resultPtr)"
    )
    js_content = js_content.replace(
        "UnsafeMutablePointer(mutating: thisPtr).move()",
        "UnsafeMutablePointer(mutating: unsafeThisPtr.value).move()"
    )
    js_content = js_content.replace(
        "JavaScriptValuesBuffer(runtime, start: argumentsPtr, count: argumentsCount)",
        "JavaScriptValuesBuffer(runtime, start: unsafeArgumentsPtr.value, count: argumentsCount)"
    )
    js_content = js_content.replace(
        "JavaScriptUnownedValue(runtime.pointee, thisPtr)",
        "JavaScriptUnownedValue(runtime.pointee, unsafeThisPtr.value)"
    )
    js_content = js_content.replace(
        "writeJSIValue(to: resultPtr)",
        "writeJSIValue(to: unsafeResultPtr.value)"
    )

    with open(js_runtime, "w", encoding="utf-8") as f:
        f.write(js_content)
    print("Successfully patched JavaScriptRuntime.swift: wrapped call-scoped pointers with NonisolatedUnsafeVar.")

# 4. Remove -quiet from build-xcframework.sh for verbose build logs
if os.path.exists(script_path):
    with open(script_path, "r", encoding="utf-8") as f:
        s_content = f.read()
    s_content = s_content.replace("-quiet", "")
    with open(script_path, "w", encoding="utf-8") as f:
        f.write(s_content)
    print("Successfully removed -quiet from build-xcframework.sh.")
