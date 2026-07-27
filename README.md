<div align="center">

# 🎵 @supasayan/ytm

**A modern, cross-platform YouTube Music Downloader & Player with High-Resolution Audio (FLAC, M4A, MP3), automatic ID3/FLAC metadata tagging, and a liquid glass Web UI.**

[![npm version](https://img.shields.io/npm/v/@supasayan/ytm.svg?style=flat-square&color=FF0000)](https://www.npmjs.com/package/@supasayan/ytm)
[![npm downloads](https://img.shields.io/npm/dm/@supasayan/ytm.svg?style=flat-square&color=blue)](https://www.npmjs.com/package/@supasayan/ytm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg?style=flat-square)](https://nodejs.org)
[![OS Support](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-informational?style=flat-square)](#-cross-platform-support)

---

### ⚡ Instant 1-Command Launch (No Setup Required)

Run directly in your terminal with zero installation:

```bash
npx @supasayan/ytm
```

</div>

---

## ✨ Features

- **🚀 Zero-Configuration Setup**: Automatically detects, downloads, and configures native `yt-dlp` and `ffmpeg` binaries dynamically for Windows, macOS, and Linux.
- **🎧 High-Resolution Audio Formats**: Download in lossless **FLAC**, **M4A (AAC)**, **MP3**, or **OPUS** audio formats.
- **🏷️ Automated Metadata & Cover Art**: Embeds high-resolution album artwork, track title, artist, album name, year, track numbers, and synced lyrics into exported audio files automatically.
- **🎶 Instant Web Music Player**: Stream tracks instantly directly from YouTube Music with a built-in player, interactive seekbar, queue management, and volume controls before downloading.
- **📂 Native OS File Manager Integration**: Open target download directories with 1-click in Windows Explorer, macOS Finder, or Linux File Managers (`xdg-open` / `zenity`).
- **⚡ Concurrent Bulk & Playlist Downloads**: Queue single tracks, top charts, or entire YouTube Music playlists with real-time download progress tracking.

---

## 💻 Installation & Usage

### Method 1: Instant Execution (Recommended)

No installation required! Simply run:

```bash
npx @supasayan/ytm
```

Your default web browser will open automatically to `http://127.0.0.1:3001` with the YTM interface ready to search and download.

---

### Method 2: Global CLI Installation

Install globally on your system to use the `ytm` command anywhere:

```bash
npm install -g @supasayan/ytm
```

Then launch from any terminal directory:

```bash
ytm
# OR
ytm-downloader
```

---

## 🖥️ Cross-Platform Support

| Operating System | Native Directory Picker | Open In File Explorer | Dependencies Handling |
| :--- | :---: | :---: | :--- |
| **Windows 10 / 11** | PowerShell `FolderBrowserDialog` | `explorer.exe` | Auto-resolves `ffmpeg.exe` & `yt-dlp.exe` |
| **macOS (Intel / Apple Silicon)** | `osascript` Finder Dialog | `open` | Auto-resolves `ffmpeg` & `yt-dlp` (quarantine cleared) |
| **Linux (Ubuntu, Debian, Fedora, Arch)** | `zenity` / `kdialog` | `xdg-open` | Auto-resolves `ffmpeg` & `yt-dlp_linux` |

---

## ⚙️ How It Works

1. **System Health Check**: On launch, the backend checks for `ffmpeg` and `yt-dlp`. If missing, it securely downloads the latest verified binaries for your OS to `~/.ytm/bin/`.
2. **YouTube Music API Proxy**: Searches tracks, albums, artists, and playlists directly via YouTube Music inner-tube APIs.
3. **Stream & Download Engine**: Uses custom `yt-dlp` extractor client rotation (`android,web,tv`) to bypass SABR rate limits and HTTP 403 Forbidden errors.
4. **Metadata Tagging**: Uses `ffmpeg` to embed cover thumbnails and ID3/FLAC metadata tags into destination files.

---

## 🐞 Issues & Contributions

Contributions, bug reports, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/sayan2302/YTMDownloader/issues).

---

## 📜 License

Distributed under the MIT License. See [LICENSE](https://github.com/sayan2302/YTMDownloader/blob/main/LICENSE) for more information.
