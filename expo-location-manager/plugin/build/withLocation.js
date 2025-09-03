"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k in ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const pkgPath = path.join(__dirname, "..", "..", "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

const withLocation = (config, { isAndroidBackgroundLocationEnabled, isAndroidForegroundServiceEnabled, } = {}) => {
    // If the user has not specified a value for isAndroidForegroundServiceEnabled,
    // we default to the value of isAndroidBackgroundLocationEnabled because we want
    // to enable foreground by default if background location is enabled.
    const enableAndroidForegroundService = typeof isAndroidForegroundServiceEnabled === "undefined"
        ? isAndroidBackgroundLocationEnabled
        : isAndroidForegroundServiceEnabled;
    return config_plugins_1.AndroidConfig.Permissions.withPermissions(config, [
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
    ].filter(Boolean));
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withLocation, pkg.name, pkg.version);
