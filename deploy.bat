@echo off
title SIPERIS - Pusat Kendali Deployment dan Operasional
color 0A

cd /d "%~dp0"

:: ===== Fix PATH jika Node baru diinstall =====
set "NODE_PATH=C:\Program Files\nodejs"
if exist "%NODE_PATH%\node.exe" (
    set "PATH=%NODE_PATH%;%PATH%"
)

:: Cek Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js belum ditemukan di PATH!
    echo Silakan install Node.js LTS dari https://nodejs.org
    echo.
    pause
    exit /b 1
)

:MENU
cls
echo =============================================================================
echo   SIPERIS - PUSAT KENDALI OPERASIONAL DAN DEPLOYMENT (WINDOWS)
echo   Sistem Informasi Perizinan Siswa Terpadu
echo =============================================================================
echo.
echo   PILIH TINDAKAN:
echo.
echo   [1] Jalankan Server Lokal (Localhost http://127.0.0.1:4173)
echo   [2] Jalankan Automated Unit Test Suite (Pengujian Sistem 100%%)
echo   [3] Unggah / Sinkronisasi 1-Klik ke GitHub dan Vercel (Auto-Deploy)
echo   [4] Backup / Ekspor Database Saat Ini ke initial_data.json
echo   [5] Buka Online Tunnel (Akses Publik Cepat via Cloudflare)
echo   [6] Keluar
echo.
echo =============================================================================
set /p PILIHAN="Masukkan nomor pilihan [1-6]: "

if "%PILIHAN%"=="1" goto :RUN_LOCAL
if "%PILIHAN%"=="2" goto :RUN_TESTS
if "%PILIHAN%"=="3" goto :RUN_GITHUB
if "%PILIHAN%"=="4" goto :RUN_BACKUP
if "%PILIHAN%"=="5" goto :RUN_TUNNEL
if "%PILIHAN%"=="6" goto :EXIT

echo.
echo [PILIHAN TIDAK VALID] Silakan masukkan angka antara 1 sampai 6.
timeout /t 2 >nul
goto :MENU
timeout /t 2 >nul
goto :MENU

:RUN_LOCAL
cls
echo =============================================================================
echo   [1] MENJALANKAN SERVER LOKAL SIPERIS (PORT 4173)
echo =============================================================================
echo.

if not exist "node_modules" (
    echo [INFO] Menjalankan npm install...
    call npm.cmd install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install gagal. Periksa koneksi internet.
        pause
        goto :MENU
    )
)

echo [INFO] Membangun bundel produksi (npm run build)...
call npm.cmd run build
if %errorlevel% neq 0 (
    echo [ERROR] Build Vite gagal!
    pause
    goto :MENU
)

echo.
echo =============================================================================
echo   SERVER BERJALAN!
echo   Buka di Browser: http://127.0.0.1:4173
echo.
echo   Akun Demo (Password: 1234):
echo     * Siswa   : 1001 / 1002 / 1003
echo     * Piket   : piket01
echo     * BK      : bk01
echo     * Wali    : wali01
echo     * Satpam  : satpam01
echo     * Admin   : admin01
echo.
echo   Tekan CTRL + C untuk menghentikan server dan kembali ke menu.
echo =============================================================================
echo.
set PORT=4173
node server/index.js
pause
goto :MENU

:RUN_TESTS
cls
echo =============================================================================
echo   [2] MENJALANKAN AUTOMATED TEST SUITE MENYELURUH
echo =============================================================================
echo.
call npm.cmd test
echo.
pause
goto :MENU

:RUN_GITHUB
cls
echo =============================================================================
echo   [3] SINKRONISASI KE GITHUB DAN VERCEL
echo =============================================================================
echo.
call upload_ke_github.bat
goto :MENU

:RUN_BACKUP
cls
echo =============================================================================
echo   [4] EKSPOR / BACKUP DATABASE KE initial_data.json
echo =============================================================================
echo.
call npm.cmd run backup
if %errorlevel% equ 0 (
    echo [SUKSES] Seluruh data berhasil dicadangkan ke berkas initial_data.json!
    echo Berkas ini akan otomatis menjadi data awal saat deploy pertama di Vercel.
) else (
    echo [ERROR] Gagal melakukan ekspor data.
)
echo.
pause
goto :MENU

:RUN_TUNNEL
cls
echo =============================================================================
echo   [5] MEMBUKA ONLINE TUNNEL (CLOUDFLARE)
echo =============================================================================
echo.
call online_tunnel.bat
goto :MENU

:EXIT
echo.
echo Terima kasih telah menggunakan SIPERIS! Sampai jumpa.
timeout /t 1 >nul
exit /b 0
