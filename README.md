# ShawnWrt OTA

Small OTA helper for ShawnWrt builds.

It detects the local router board, finds the matching sysupgrade image in the
latest GitHub Release, verifies the GitHub SHA256 digest, and can run
`sysupgrade -T` before installing.

Supported boards:

- `cudy_tr3000-512mb-v1`
- `qihoo_360t7`

Commands:

```sh
shawnwrt-ota check
shawnwrt-ota download
shawnwrt-ota test
shawnwrt-ota install
```

`install` preserves config and records installed packages through
`sysupgrade -k`.
