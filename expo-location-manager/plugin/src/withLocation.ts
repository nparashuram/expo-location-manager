import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
} from "expo/config-plugins";

import * as fs from "fs";
import * as path from "path";

const pkgPath = path.join(__dirname, "..", "..", "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

const withLocation: ConfigPlugin<
  {
    isAndroidBackgroundLocationEnabled?: boolean;
    isAndroidForegroundServiceEnabled?: boolean;
  } | void
> = (
  config,
  { isAndroidBackgroundLocationEnabled, isAndroidForegroundServiceEnabled } = {}
) => {
  // If the user has not specified a value for isAndroidForegroundServiceEnabled,
  // we default to the value of isAndroidBackgroundLocationEnabled because we want
  // to enable foreground by default if background location is enabled.
  const enableAndroidForegroundService =
    typeof isAndroidForegroundServiceEnabled === "undefined"
      ? isAndroidBackgroundLocationEnabled
      : isAndroidForegroundServiceEnabled;

  return AndroidConfig.Permissions.withPermissions(
    config,
    [
      // Note: these are already added in the library AndroidManifest.xml and so
      // are not required here, we may want to remove them in the future.
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
      // These permissions are optional, and not listed in the library AndroidManifest.xml
      isAndroidBackgroundLocationEnabled &&
        "android.permission.ACCESS_BACKGROUND_LOCATION",
      enableAndroidForegroundService && "android.permission.FOREGROUND_SERVICE",
      enableAndroidForegroundService &&
        "android.permission.FOREGROUND_SERVICE_LOCATION",
    ].filter(Boolean) as string[]
  );
};

export default createRunOncePlugin(withLocation, pkg.name, pkg.version);
