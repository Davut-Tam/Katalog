@echo off
rem ================================================================
rem  Katalog Studyo - yerel IIS yayini
rem  Cift tiklayin: yonetici izni ister, katalogu IIS'te yayinlar
rem  (http://localhost:8080/), tarayicida acar ve proje klasorunu
rem  izler. Dosya kaydettiginizde yayin kendiliginden guncellenir.
rem  Pencereyi kapatinca izleme durur; site yayinda kalir.
rem
rem  Farkli ayar icin bu dosyayi duzenleyin, ornek:
rem    -Port 9090
rem    -Site "Default Web Site" -Uygulama katalog   (http://localhost/katalog/)
rem    -IISKur          eksik IIS bilesenlerini kurar
rem    -GuvenlikDuvari  agdaki diger cihazlar da acabilsin
rem ================================================================
setlocal
title Katalog Studyo - IIS yayini

rem Yonetici degilse ayni dosyayi yonetici olarak yeniden baslat
net session >nul 2>&1
if errorlevel 1 (
    echo Yonetici izni isteniyor...
    powershell.exe -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0iis-yayinla.ps1" -Ac -Izle
if errorlevel 1 (
    echo.
    echo Yayin basarisiz oldu. Ayrintilar: %ProgramData%\KatalogYayin\bot.log
)
pause
