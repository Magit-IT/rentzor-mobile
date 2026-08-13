const { withAppBuildGradle, withProjectBuildGradle, withPodfile, withDangerousMod, withMainApplication, withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const ANDROID_MAVEN_URL = 'https://artifactory.myid.uz:443/artifactory/myid';
const ANDROID_SDK_VERSION = '3.1.9';
const IOS_SDK_VERSION = '3.1.3';

/**
 * Injects the MyID "New Flow" native SDK (myid-capture-sdk on Android,
 * MyIdSDK pod on iOS) into the Expo prebuild output, plus the Kotlin/Swift
 * bridge exposing MyIdModule.startMyId(sessionId, ...) to JS. Runs on every
 * `expo prebuild` / EAS build since android/ and ios/ are gitignored and
 * regenerated from scratch each time.
 */
function withMyId(config) {
  config = withProjectBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes(ANDROID_MAVEN_URL)) {
      const withRepo = config.modResults.contents.replace(
        /allprojects\s*{\s*repositories\s*{/,
        (match) => `${match}\n        maven { url "${ANDROID_MAVEN_URL}" }`,
      );
      if (withRepo === config.modResults.contents) {
        throw new Error(
          "withMyId: could not find 'allprojects { repositories {' in android/build.gradle — " +
          `add 'maven { url "${ANDROID_MAVEN_URL}" }' to it manually.`,
        );
      }
      config.modResults.contents = withRepo;
    }
    return config;
  });

  config = withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes('myid-capture-sdk')) {
      const withDep = config.modResults.contents.replace(
        /dependencies\s*{/,
        `dependencies {
    debugImplementation("uz.myid.sdk.capture:myid-capture-sdk-debug:${ANDROID_SDK_VERSION}")
    releaseImplementation("uz.myid.sdk.capture:myid-capture-sdk:${ANDROID_SDK_VERSION}")`,
      );
      if (withDep === config.modResults.contents) {
        throw new Error(
          "withMyId: could not find 'dependencies {' in android/app/build.gradle — " +
          'add the myid-capture-sdk dependency manually.',
        );
      }
      config.modResults.contents = withDep;
    }
    return config;
  });

  config = withPodfile(config, (config) => {
    if (!config.modResults.contents.includes("pod 'MyIdSDK'")) {
      // use_native_modules! lives inside the app's `target '...' do` block in
      // every known RN/Expo Podfile template — pods must be declared there.
      // Match the whole statement including its `config = ` assignment: SDK 54
      // templates write `config = use_native_modules!(config_command)`, and
      // splitting that line would bind `config` to the pod's return value,
      // silently dropping autolinking for every other native module.
      const withPod = config.modResults.contents.replace(
        /^([ \t]*)((?:[A-Za-z_]\w*\s*=\s*)?use_native_modules!(?:\([^)]*\))?)/m,
        (_match, indent, statement) =>
          `${indent}pod 'MyIdSDK', '${IOS_SDK_VERSION}'\n${indent}${statement}`,
      );
      if (withPod === config.modResults.contents) {
        throw new Error(
          "withMyId: could not find use_native_modules! in the generated Podfile — " +
          "add `pod 'MyIdSDK', '" + IOS_SDK_VERSION + "'` inside the app target manually.",
        );
      }
      config.modResults.contents = withPod;
    }
    return config;
  });

  config = withDangerousMod(config, [
    'android',
    (config) => {
      const pkgDir = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/java/uz/rentzor/myid',
      );
      fs.mkdirSync(pkgDir, { recursive: true });
      const sourceDir = path.join(__dirname, 'android/src/main/java/uz/rentzor/myid');
      for (const file of fs.readdirSync(sourceDir)) {
        fs.copyFileSync(path.join(sourceDir, file), path.join(pkgDir, file));
      }
      return config;
    },
  ]);

  config = withDangerousMod(config, [
    'ios',
    (config) => {
      const iosDir = config.modRequest.platformProjectRoot;
      const sourceDir = path.join(__dirname, 'ios');
      for (const file of fs.readdirSync(sourceDir)) {
        fs.copyFileSync(path.join(sourceDir, file), path.join(iosDir, file));
      }
      return config;
    },
  ]);

  // Dropping files into ios/ isn't enough — Xcode only compiles files listed
  // in the .pbxproj build phases, so register the copied Swift/ObjC bridge
  // with the main app target explicitly.
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const groupName = config.modRequest.projectName || 'MyIdBridge';
    const groupKey = project.findPBXGroupKey({ name: groupName }) || project.getFirstProject().firstProject.mainGroup;
    for (const file of ['MyIdModule.swift', 'MyIdModule.m']) {
      if (!project.hasFile(file)) {
        project.addSourceFile(file, {}, groupKey);
      }
    }
    return config;
  });

  config = withMainApplication(config, (config) => {
    if (!config.modResults.contents.includes('MyIdReactPackage')) {
      const original = config.modResults.contents;
      const withImport = original.replace(
        /^import (com\.facebook\.react\.PackageList)/m,
        `import uz.rentzor.myid.MyIdReactPackage\nimport $1`,
      );
      const withPackage = withImport.replace(
        /(PackageList\(this\)\.packages\.apply\s*{)/,
        `$1\n              add(MyIdReactPackage())`,
      );
      if (withPackage === original || withPackage === withImport) {
        throw new Error(
          'withMyId: could not find PackageList(this).packages.apply { in MainApplication.kt — ' +
          'register MyIdReactPackage() manually.',
        );
      }
      config.modResults.contents = withPackage;
    }
    return config;
  });

  return config;
}

module.exports = withMyId;
