@echo off
title SIPERIS - Online Tunnel (Cloudflare Instant Access)
color 0E

echo =============================================================================
echo   SIPERIS - CLOUDFLARE ONLINE TUNNEL (AKSES INTERNET INSTAN)
echo   100%% Gratis Selamanya Tanpa Kartu Kredit dan Tanpa Buka Port Router
echo =============================================================================
echo.

cd /d "%~dp0"
set PORT=4173

:: 1. Cek apakah binary cloudflared sudah tersedia
where cloudflared >nul 2>nul
if %errorlevel% equ 0 (
    set CLOUDFLARED_BIN=cloudflared
    goto :RUN_TUNNEL
)

if exist "cloudflared.exe" (
    set CLOUDFLARED_BIN=.\cloudflared.exe
    goto :RUN_TUNNEL
)

:: 2. Unduh cloudflared.exe jika belum ada
echo [INFO] Menyiapkan Cloudflare Tunnel portable (cloudflared.exe)...
echo Mengunduh versi resmi dari Cloudflare GitHub...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe', 'cloudflared.exe')" >nul 2>nul

if exist "cloudflared.exe" (
    echo [OK] Cloudflare Tunnel portable berhasil diunduh.
    set CLOUDFLARED_BIN=.\cloudflared.exe
    goto :RUN_TUNNEL
)

:: 3. Fallback jika unduhan gagal (gunakan localtunnel via npx)
echo [PERINGATAN] Unduhan cloudflared gagal. Menggunakan alternatif npx localtunnel...
echo Membuka tunnel ke http://127.0.0.1:%PORT%...
npx localtunnel --port %PORT%
pause
exit /b 0

:RUN_TUNNEL
echo.
echo =============================================================================
echo   MEMBUKA TEROWONGAN PUBLIK KE SERVER LOKAL PORT %PORT%...
echo   Tautan publik gratis (https://xxxx.trycloudflare.com) akan muncul di bawah.
echo   Bagikan tautan tersebut kepada guru, satpam, atau siswa untuk dicoba!
echo   (Biarkan jendela ini tetap terbuka selama server ingin bisa diakses online)
echo =============================================================================
echo.

%CLOUDFLARED_BIN% tunnel --url http://127.0.0.1:%PORT%

pause

