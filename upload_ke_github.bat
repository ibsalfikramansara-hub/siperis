@echo off
setlocal EnableDelayedExpansion
title SIPERIS - Upload ke GitHub dan Vercel Auto-Deploy
color 0B

echo =============================================================================
echo   SIPERIS - 1-KLIK SINKRONISASI KE GITHUB DAN VERCEL
echo =============================================================================
echo.

cd /d "%~dp0"

:: 1. Deteksi Git di berbagai lokasi instalasi umum Windows
if exist "C:\Program Files\Git\cmd\git.exe" (
    set "PATH=C:\Program Files\Git\cmd;%PATH%"
)
if exist "C:\Program Files (x86)\Git\cmd\git.exe" (
    set "PATH=C:\Program Files (x86)\Git\cmd;%PATH%"
)
if exist "%LOCALAPPDATA%\Programs\Git\cmd\git.exe" (
    set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"
)

where git >nul 2>nul
if %errorlevel% neq 0 goto :GIT_NOT_FOUND

:: 2. Inisialisasi Git repository jika belum ada
if not exist ".git" (
    echo [INFO] Menginisialisasi repositori Git lokal...
    git init
    git branch -M main
)

:: 3. Pastikan identitas Git terkonfigurasi di repository
git config user.name >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Menyetel nama pengembang default...
    git config user.name "Pengembang SIPERIS"
)

git config user.email >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Menyetel email pengembang default...
    git config user.email "pengembang@siperis.local"
)

:: 4. Periksa apakah remote origin sudah ada
git remote get-url origin >nul 2>nul
if %errorlevel% equ 0 goto :DO_STAGE

echo [INFO] Repositori remote GitHub belum terhubung.
echo.
echo Langkah mudah membuat repositori GitHub:
echo 1. Buka browser Anda: https://github.com/new
echo 2. Buat repositori baru (misal nama: siperis)
echo 3. Salin URL repositori (misal: https://github.com/username/siperis.git)
echo.
set "REPO_URL="
set /p REPO_URL="Tempelkan URL Repositori GitHub Anda: "

if not defined REPO_URL goto :EMPTY_URL
if "%REPO_URL%"=="" goto :EMPTY_URL

git remote add origin %REPO_URL%
echo [OK] Remote origin berhasil disetel ke: %REPO_URL%
echo.

:DO_STAGE
echo.
echo [1/3] Menyiapkan file dan mengecek .gitignore...
git add .

echo.
echo [2/3] Menyimpan commit pembaruan...
git commit -m "Auto deploy update %date% %time%" >nul 2>nul
echo [OK] Berkas siap diunggah.

echo.
echo [3/3] Mengunggah ke GitHub branch main...
echo -----------------------------------------------------------------------------
echo PETUNJUK OTENTIKASI:
echo Jika muncul pop-up browser GitHub, silakan login dengan browser Anda.
echo Setelah push berhasil, Vercel akan otomatis mendeteksi dan men-deploy!
echo -----------------------------------------------------------------------------
echo.

git branch -M main
git push -u origin main
if %errorlevel% equ 0 goto :PUSH_SUCCESS

echo.
echo [INFO] Mencoba sinkronisasi branch remote dengan git pull rebase...
git pull origin main --rebase
git push -u origin main
if %errorlevel% equ 0 goto :PUSH_SUCCESS

goto :PUSH_FAILED

:PUSH_SUCCESS
echo.
echo =============================================================================
echo   [SUKSES] Berkas berhasil diunggah ke GitHub!
echo   Vercel akan otomatis melakukan build dan deploy versi terbaru.
echo =============================================================================
echo.
pause
exit /b 0

:PUSH_FAILED
echo.
echo =============================================================================
echo   [PERINGATAN] Gagal mengunggah ke GitHub.
echo.
echo   Penyebab umum:
echo   1. URL repositori belum benar atau belum dibuat di GitHub.
echo   2. Belum login ke akun GitHub di komputer ini.
echo   3. Periksa koneksi internet Anda.
echo =============================================================================
echo.
pause
exit /b 1

:EMPTY_URL
echo.
echo [ERROR] URL repositori tidak boleh kosong!
echo Silakan jalankan kembali skrip ini dan masukkan URL repositori GitHub Anda.
echo.
pause
exit /b 1

:GIT_NOT_FOUND
echo.
echo =============================================================================
echo   [ERROR] Git belum terpasang di komputer Anda!
echo.
echo   Silakan unduh dan pasang Git terlebih dahulu (Gratis):
echo   👉 https://git-scm.com/download/win
echo.
echo   Setelah memasang Git, klik 2x kembali file upload_ke_github.bat ini.
echo =============================================================================
echo.
pause
exit /b 1
