<div align="center">

# 🎵 @supasayan/openspot

**OpenSpot — A modern, cross-platform Music Downloader, Player & Song Lore Platform with High-Resolution Audio (FLAC, M4A, MP3), Karaoke Synced Lyrics, and a liquid glass Web UI.**

[![npm version](https://img.shields.io/npm/v/@supasayan/openspot.svg?style=flat-square&color=FF0000)](https://www.npmjs.com/package/@supasayan/openspot)
[![npm downloads](https://img.shields.io/npm/dm/@supasayan/openspot.svg?style=flat-square&color=blue)](https://www.npmjs.com/package/@supasayan/openspot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg?style=flat-square)](https://nodejs.org)
[![OS Support](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-informational?style=flat-square)](#-cross-platform-support)

---

### ⚡ Instant 1-Command Launch (No Setup Required)

Run directly in your terminal with zero installation:

```bash
npx @supasayan/openspot
```

</div>

---

## ✨ Features

- **🚀 Zero-Configuration Setup**: Automatically detects, downloads, and configures native `yt-dlp` and `ffmpeg` binaries dynamically for Windows, macOS, and Linux.
- **🎧 High-Resolution Audio Formats**: Download in lossless **FLAC**, **M4A (AAC)**, **MP3**, or **OPUS** audio formats.
- **🎤 Live Synced Karaoke Lyrics**: Real-time LRC timestamp synchronization with interactive vocal density curves and click-to-seek stanza navigation.
- **💡 "Behind The Song" Lore Spotlight**: Right-side liquid glass drawer surfacing song writing origin stories, verified artist interview quotes, and chart achievements.
- **🏷️ Automated Metadata & Cover Art**: Embeds high-resolution album artwork, track title, artist, album name, year, track numbers, and synced lyrics into exported audio files automatically.
- **🎶 Instant Web Music Player**: Stream tracks instantly directly with a built-in player, interactive seekbar, queue management, and volume controls before downloading.
- **📂 Native OS File Manager Integration**: Open target download directories with 1-click in Windows Explorer, macOS Finder, or Linux File Managers (`xdg-open` / `zenity`).
- **⚡ Concurrent Bulk & Playlist Downloads**: Queue single tracks, top charts, or entire playlists with real-time download progress tracking.

---

## 💻 Installation & Usage

### Method 1: Instant Execution (Recommended)

No installation required! Simply run:

```bash
npx @supasayan/openspot
```

Your default web browser will open automatically to `http://127.0.0.1:3001` with the OpenSpot interface ready to search and stream.

---

### Method 2: Global CLI Installation

Install globally on your system to use the `openspot` command anywhere:

```bash
npm install -g @supasayan/openspot
```

Then launch from any terminal directory:

```bash
openspot
# OR
openspot-cli
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

1. **System Health Check**: On launch, the backend checks for `ffmpeg` and `yt-dlp`. If missing, it securely downloads the latest verified binaries for your OS to `~/.openspot/bin/`.
2. **Music API Proxy**: Searches tracks, albums, artists, and playlists directly via high-speed music inner-tube APIs.
3. **Stream & Download Engine**: Uses custom `yt-dlp` extractor client rotation (`android,web,tv`) to bypass SABR rate limits and HTTP 403 Forbidden errors.
4. **Metadata Tagging**: Uses `ffmpeg` to embed cover thumbnails and ID3/FLAC metadata tags into destination files.

---

## 📜 License

Distributed under the MIT License.
