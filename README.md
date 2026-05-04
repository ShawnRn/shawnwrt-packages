# ShawnWrt Packages

OpenWrt package feed for ShawnWrt builds. This repository publishes the
router-side packages that are useful both as built-in firmware components and
as post-flash `opkg` updates.

## Packages

- `shawnwrt-ota`: safe OTA helper for ShawnWrt firmware releases.
- `luci-app-shawnwrt-ota`: LuCI page for checking, testing, downloading, and
  installing OTA updates.
- `luci-app-shawnwrt-channel-analysis`: MTK Wi-Fi channel analysis with
  spectrum-style charts and suggested channel application.
- `luci-app-shawnwrt-quickstart`: source-bundled QuickStart homepage only. It
  removes iStore, NetworkGuide, NAS, RAID, quickwifi, and online installer
  dependencies, and provides a local status API with CPU temperature support.

## Opkg Feed

The package workflow publishes a signed opkg feed to the `opkg` branch:

```sh
src/gz shawnwrt_packages https://raw.githubusercontent.com/ShawnRn/shawnwrt-packages/opkg
```

Firmware builds include the feed public key, so `opkg update` can keep normal
signature verification enabled.

GitHub Pages mirrors the same files for browser inspection:
<https://shawnrn.github.io/shawnwrt-packages/>

## OTA Usage

Commands:

```sh
shawnwrt-ota check
shawnwrt-ota download
shawnwrt-ota test
shawnwrt-ota install
```

Supported OTA boards:

- `cudy_tr3000-512mb-v1`
- `qihoo_360t7`

`install` preserves config and records installed packages through
`sysupgrade -k`.

In LuCI, open **System -> ShawnWrt OTA**.

## Build

```sh
scripts/build-opkg-feed.sh
```

The output is written to `dist/`. CI signs and publishes the feed when the
`SHAWNWRT_OTA_USIGN_SECRET_KEY` secret is available.
