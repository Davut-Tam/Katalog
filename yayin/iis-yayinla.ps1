<#
.SYNOPSIS
    Katalog Stüdyo'yu IIS'te yayınlar (yayın botu).

.DESCRIPTION
    Katalog yalnız statik dosyalardan oluşur (index.html, css, js). Bot:
      1. Dosyaları hedef klasöre eşler (robocopy /MIR; .git, yayin, README gibi dosyalar gitmez).
      2. index.html'deki js / css bağlantılarına sürüm ekler (?v=...): tarayıcı önbelleği eski dosya göstermez,
         JS / CSS bir yıl önbellekte kalır, index.html her açılışta yeniden doğrulanır.
      3. web.config yazar: varsayılan belge, MIME türleri, sıkıştırma, önbellek ve güvenlik başlıkları.
         ASP.NET Core sitesinin (ör. AbellPro API) altına uygulama olarak konursa API işleyicisini devre dışı bırakır.
      4. IIS'te siteyi ya da var olan bir sitenin altında uygulamayı kurar / günceller (ayrı "No Managed Code" havuzu).
      5. Sağlık denetimi yapar ve adresi gösterir.

    Bot kipleri:
      -Izle       Proje klasörünü izler; dosya kaydedilince birkaç saniye içinde yeniden yayınlar (pencere açık kaldıkça).
      -Otomatik   Her N dakikada bir çalışan zamanlanmış görev kurar: git deposuysa uzaktan çeker (pull),
                  kaynakta değişiklik varsa yayınlar. -OtomatikKaldir ile kaldırılır.

    IIS ayarı için yönetici yetkisi gerekir; betik gerekirse kendini yönetici olarak yeniden başlatır.

.EXAMPLE
    .\iis-yayinla.ps1
    http://localhost:8080/ adresinde "Katalog" sitesini kurar ve yayınlar.

.EXAMPLE
    .\iis-yayinla.ps1 -Izle
    Yayınlar ve proje klasörünü izler: kaydettiğiniz her değişiklik yayına yansır.

.EXAMPLE
    .\iis-yayinla.ps1 -Site "Default Web Site" -Uygulama katalog
    http://localhost/katalog/ adresinde yayınlar.

.EXAMPLE
    .\iis-yayinla.ps1 -Site "AbellPro.Api" -Uygulama katalog
    AbellPro API sitesinin içinde (https://api.firma.com.tr/katalog/) yayınlar; katalog sunucu adresini kendisi bulur.

.EXAMPLE
    .\iis-yayinla.ps1 -IISKur -GuvenlikDuvari -Otomatik -Dakika 10
    Eksik IIS bileşenlerini kurar, ağdan erişim için bağlantı noktasını açar, 10 dakikada bir güncelleyen görevi kurar.
#>
[CmdletBinding()]
param(
    [string]$Kaynak = "",                                    # index.html'in bulunduğu proje klasörü (boşsa betiğin üst klasörü)
    [string]$Hedef = "C:\inetpub\katalog",                   # IIS'in sunacağı klasör
    [string]$Site = "Katalog",                               # IIS site adı
    [string]$Uygulama = "",                                  # doluysa sitenin altında /<ad> uygulaması (site var olmalı)
    [int]$Port = 8080,                                       # yeni sitenin http bağlantı noktası
    [string]$HostAdi = "",                                   # isteğe bağlı ana bilgisayar adı (ör. katalog.firma.local)
    [string]$SertifikaParmakIzi = "",                        # verilirse 443'te https bağlaması (HostAdi gerekir)
    [string]$Havuz = "Katalog",                              # uygulama havuzu (No Managed Code)
    [switch]$IISKur,                                         # eksik IIS bileşenlerini kur
    [switch]$GuvenlikDuvari,                                 # Windows Güvenlik Duvarı'nda bağlantı noktasını aç
    [switch]$Izle,                                           # klasörü izle, değişince yeniden yayınla
    [switch]$Otomatik,                                       # zamanlanmış güncelleme görevi kur
    [int]$Dakika = 10,
    [switch]$OtomatikKaldir,
    [switch]$Guncelle,                                       # (görev kipi) değişiklik varsa yalnız dosyaları yayınla
    [switch]$YalnizDosyalar,                                 # IIS ayarına dokunmadan yalnız dosyaları hedefe yaz
    [switch]$Ac                                              # bitince tarayıcıda aç
)

$ErrorActionPreference = "Stop"
# Windows PowerShell 5.1'de $PSScriptRoot parametre varsayılanlarında boştur; burada hesaplanır
if (-not $Kaynak) { $Kaynak = Split-Path -Parent $PSScriptRoot }
$GorevAdi = "Katalog Yayin Botu"
$appcmd = Join-Path $env:windir "System32\inetsrv\appcmd.exe"
$gitVar = [bool](Get-Command git -ErrorAction SilentlyContinue)
$utf8 = New-Object System.Text.UTF8Encoding($false)

# ── Günlük ───────────────────────────────────────────────────────
$gunlukKlasor = Join-Path $env:ProgramData "KatalogYayin"
$gunluk = Join-Path $gunlukKlasor "bot.log"
function Yaz([string]$mesaj, [string]$tur = "bilgi") {
    $satir = "{0}  {1,-6} {2}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $tur.ToUpper(), $mesaj
    $renk = @{ bilgi = "Gray"; tamam = "Green"; uyari = "Yellow"; hata = "Red" }[$tur]
    if (-not $renk) { $renk = "Gray" }
    Write-Host $satir -ForegroundColor $renk
    try {
        if (-not (Test-Path $gunlukKlasor)) { New-Item -ItemType Directory -Path $gunlukKlasor -Force | Out-Null }
        if ((Test-Path $gunluk) -and (Get-Item $gunluk).Length -gt 1MB) { Move-Item $gunluk "$gunluk.old" -Force }
        Add-Content -Path $gunluk -Value $satir -Encoding UTF8
    } catch { }
}

function YoneticiMi {
    $kimlik = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
    return $kimlik.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# ── Kaynak imzası: değişiklik var mı? ────────────────────────────
function GitCalistir([string[]]$a) { $ErrorActionPreference = "Continue"; & git.exe -c safe.directory=* -C $Kaynak @a 2>$null }
function SonDegisiklik {
    $yollar = @((Join-Path $Kaynak "index.html"), (Join-Path $Kaynak "css"), (Join-Path $Kaynak "js"))
    $son = Get-ChildItem -Path $yollar -Recurse -File | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
    return $son.LastWriteTimeUtc.ToString("yyyyMMddHHmmss")
}
function KaynakImzasi {
    if ($gitVar -and (Test-Path (Join-Path $Kaynak ".git"))) {
        $h = GitCalistir @("rev-parse", "--short", "HEAD")
        if ($h) {
            $kirli = GitCalistir @("status", "--porcelain", "--", "index.html", "css", "js")
            if ($kirli) { return "$h-" + (SonDegisiklik) }    # kaydedilmemiş (commit edilmemiş) değişiklik de yayınlanır
            return "$h"
        }
    }
    return SonDegisiklik
}
function YayindakiImza {
    $f = Join-Path $Hedef "surum.txt"
    if (Test-Path $f) { return (Get-Content $f -TotalCount 1) }
    return ""
}

# ── web.config ──────────────────────────────────────────────────
$webConfig = @'
<?xml version="1.0" encoding="utf-8"?>
<!-- Katalog Stüdyo — yayın botu tarafından yazılır; elle değiştirmeyin (her yayında yenilenir). -->
<configuration>
  <system.webServer>
    <!-- ASP.NET Core sitesinin (ör. AbellPro API) altına konursa istekler API'ye değil dosyalara gitsin -->
    <handlers>
      <remove name="aspNetCore" />
    </handlers>
    <defaultDocument enabled="true">
      <files>
        <clear />
        <add value="index.html" />
      </files>
    </defaultDocument>
    <directoryBrowse enabled="false" />
    <staticContent>
      <remove fileExtension=".html" />
      <mimeMap fileExtension=".html" mimeType="text/html; charset=utf-8" />
      <remove fileExtension=".js" />
      <mimeMap fileExtension=".js" mimeType="text/javascript; charset=utf-8" />
      <remove fileExtension=".css" />
      <mimeMap fileExtension=".css" mimeType="text/css; charset=utf-8" />
      <remove fileExtension=".json" />
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <remove fileExtension=".webp" />
      <mimeMap fileExtension=".webp" mimeType="image/webp" />
      <remove fileExtension=".woff2" />
      <mimeMap fileExtension=".woff2" mimeType="font/woff2" />
      <remove fileExtension=".txt" />
      <mimeMap fileExtension=".txt" mimeType="text/plain; charset=utf-8" />
      <!-- js / css bağlantıları sürümlü (?v=...): uzun süre önbellekte kalabilir -->
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="365.00:00:00" />
    </staticContent>
    <urlCompression doStaticCompression="true" doDynamicCompression="false" />
    <httpProtocol>
      <customHeaders>
        <remove name="X-Powered-By" />
        <remove name="X-Content-Type-Options" />
        <add name="X-Content-Type-Options" value="nosniff" />
        <remove name="Referrer-Policy" />
        <add name="Referrer-Policy" value="strict-origin-when-cross-origin" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
  <!-- Giriş sayfası ve sürüm dosyası her açılışta yeniden doğrulanır -->
  <location path="index.html">
    <system.webServer>
      <staticContent>
        <clientCache cacheControlMode="DisableCache" />
      </staticContent>
    </system.webServer>
  </location>
  <location path="surum.txt">
    <system.webServer>
      <staticContent>
        <clientCache cacheControlMode="DisableCache" />
      </staticContent>
    </system.webServer>
  </location>
</configuration>
'@

# ── Dosyaları yayınla ────────────────────────────────────────────
function Esle([string]$kaynak, [string]$hedef, [string[]]$ek) {
    $ErrorActionPreference = "Continue"
    $cikti = & robocopy.exe $kaynak $hedef @ek /R:2 /W:2 /NJH /NJS /NP /NDL /NFL 2>&1
    if ($LASTEXITCODE -ge 8) { throw "Kopyalama başarısız ($kaynak → $hedef, robocopy kodu $LASTEXITCODE): $cikti" }
}
function DosyalariYayinla([string]$imza) {
    if (-not (Test-Path (Join-Path $Kaynak "index.html"))) { throw "Kaynak klasörde index.html yok: $Kaynak" }
    if (-not (Test-Path $Hedef)) { New-Item -ItemType Directory -Path $Hedef -Force | Out-Null }
    Esle (Join-Path $Kaynak "css") (Join-Path $Hedef "css") @("/MIR")
    Esle (Join-Path $Kaynak "js") (Join-Path $Hedef "js") @("/MIR")
    Copy-Item (Join-Path $Kaynak "index.html") (Join-Path $Hedef "index.html") -Force
    # Sürümlü bağlantılar: js/... ve css/... → js/...?v=<sürüm>
    $surum = ($imza -replace "[^0-9A-Za-z-]", "")
    $yol = Join-Path $Hedef "index.html"
    $html = [IO.File]::ReadAllText($yol, $utf8)
    $html = [regex]::Replace($html, '(src|href)="((?:js|css)/[^"?#]+)"', ('$1="$2?v=' + $surum + '"'))
    [IO.File]::WriteAllText($yol, $html, $utf8)
    [IO.File]::WriteAllText((Join-Path $Hedef "web.config"), $webConfig, $utf8)
    [IO.File]::WriteAllText((Join-Path $Hedef "surum.txt"), "$imza`r`n$(Get-Date -Format s)`r`n", $utf8)
    $adet = (Get-ChildItem $Hedef -Recurse -File | Measure-Object).Count
    Yaz "Dosyalar yayınlandı → $Hedef ($adet dosya, sürüm $imza)" "tamam"
}

# ── IIS ─────────────────────────────────────────────────────────
function Appcmd([string[]]$a, [switch]$Sessiz) {
    $ErrorActionPreference = "Continue"
    $cikti = & $appcmd @a 2>&1
    if ($LASTEXITCODE -ne 0 -and -not $Sessiz) { throw "appcmd $($a -join ' ') başarısız: $cikti" }
    return $cikti
}
function Var([string]$tur, [string]$ad) {
    $ErrorActionPreference = "Continue"
    $cikti = & $appcmd list $tur $ad 2>$null
    return ($LASTEXITCODE -eq 0 -and [bool]$cikti)
}

function IISBilesenleriniKur {
    Yaz "IIS bileşenleri denetleniyor / kuruluyor…"
    if (Get-Command Install-WindowsFeature -ErrorAction SilentlyContinue) {
        # Windows Server
        Install-WindowsFeature Web-Server, Web-Static-Content, Web-Default-Doc, Web-Http-Errors, Web-Stat-Compression, Web-Mgmt-Console | Out-Null
    } else {
        # Windows 10 / 11
        $ozellikler = "IIS-WebServerRole", "IIS-WebServer", "IIS-CommonHttpFeatures", "IIS-StaticContent", "IIS-DefaultDocument", "IIS-HttpErrors", "IIS-HttpCompressionStatic", "IIS-ManagementConsole"
        foreach ($o in $ozellikler) {
            $d = Get-WindowsOptionalFeature -Online -FeatureName $o
            if ($d -and $d.State -ne "Enabled") { Enable-WindowsOptionalFeature -Online -FeatureName $o -All -NoRestart | Out-Null; Yaz "Kuruldu: $o" "tamam" }
        }
    }
}

function IISAyarla {
    if (-not (Test-Path $appcmd)) { throw "IIS kurulu değil. -IISKur ile çalıştırın ya da Windows Özellikleri'nden Internet Information Services'ı açın." }

    # Statik dosya için .NET'siz ayrı havuz (ASP.NET Core sitesinin havuzunu paylaşmaz)
    if (-not (Var "apppool" "/name:$Havuz")) {
        Appcmd @("add", "apppool", "/name:$Havuz", "/managedRuntimeVersion:", "/managedPipelineMode:Integrated") | Out-Null
        Yaz "Uygulama havuzu oluşturuldu: $Havuz" "tamam"
    }

    if ($Uygulama) {
        $yol = "/" + $Uygulama.Trim("/")
        if (-not (Var "site" "/name:$Site")) {
            $siteler = (& $appcmd list site /text:name) -join ", "
            throw "IIS'te '$Site' sitesi yok. Var olan siteler: $siteler"
        }
        $kimlik = "$Site$yol"
        if (Var "app" "/app.name:$kimlik") {
            Appcmd @("set", "vdir", "/vdir.name:$kimlik/", "/physicalPath:$Hedef") | Out-Null
            Appcmd @("set", "app", "/app.name:$kimlik", "/applicationPool:$Havuz") | Out-Null
            Yaz "Uygulama güncellendi: $kimlik" "tamam"
        } else {
            Appcmd @("add", "app", "/site.name:$Site", "/path:$yol", "/physicalPath:$Hedef", "/applicationPool:$Havuz") | Out-Null
            Yaz "Uygulama oluşturuldu: $kimlik" "tamam"
        }
    } else {
        if (Var "site" "/name:$Site") {
            Appcmd @("set", "vdir", "/vdir.name:$Site/", "/physicalPath:$Hedef") | Out-Null
            Appcmd @("set", "app", "/app.name:$Site/", "/applicationPool:$Havuz") | Out-Null
            Yaz "Site güncellendi: $Site" "tamam"
        } else {
            $baglama = "http/*:${Port}:$HostAdi"
            Appcmd @("add", "site", "/name:$Site", "/physicalPath:$Hedef", "/bindings:$baglama") | Out-Null
            Appcmd @("set", "app", "/app.name:$Site/", "/applicationPool:$Havuz") | Out-Null
            Yaz "Site oluşturuldu: $Site ($baglama)" "tamam"
        }
        if ($SertifikaParmakIzi) { HttpsBagla }
    }

    # IIS kullanıcıları hedef klasörü okuyabilsin
    $ErrorActionPreference = "Continue"
    & icacls.exe $Hedef /grant "IIS_IUSRS:(OI)(CI)RX" /T /Q 2>&1 | Out-Null
    $ErrorActionPreference = "Stop"
    Appcmd @("start", "apppool", "/apppool.name:$Havuz") -Sessiz | Out-Null
    Appcmd @("start", "site", "/site.name:$Site") -Sessiz | Out-Null
}

function HttpsBagla {
    $ErrorActionPreference = "Continue"
    if (-not $HostAdi) { throw "https bağlaması için -HostAdi gerekir (ör. katalog.firma.local)." }
    $bilgi = "*:443:$HostAdi"
    $mevcut = (& $appcmd list site "/name:$Site" /text:bindings) -join ","
    if ($mevcut -notmatch [regex]::Escape("https/$bilgi")) {
        Appcmd @("set", "site", "/site.name:$Site", "/+bindings.[protocol='https',bindingInformation='$bilgi',sslFlags='1']") | Out-Null
    }
    & netsh http delete sslcert "hostnameport=${HostAdi}:443" 2>$null | Out-Null
    $s = & netsh http add sslcert "hostnameport=${HostAdi}:443" "certhash=$SertifikaParmakIzi" "appid={4dc3e181-e14b-4a21-b022-59fc669b0914}" certstorename=MY 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Sertifika bağlanamadı: $s" }
    Yaz "https bağlandı: https://$HostAdi/" "tamam"
}

function GuvenlikDuvariniAc {
    $ad = "Katalog Stüdyo (TCP $Port)"
    if (-not (Get-NetFirewallRule -DisplayName $ad -ErrorAction SilentlyContinue)) {
        New-NetFirewallRule -DisplayName $ad -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow -Profile Domain, Private | Out-Null
        Yaz "Güvenlik duvarında $Port açıldı (Etki alanı / Özel ağ)" "tamam"
    }
}

function YayinAdresi {
    if ($YalnizDosyalar) { return $null }
    if ($Uygulama) {
        $b = ((& $appcmd list site "/name:$Site" /text:bindings) -join ",").Split(",") | Where-Object { $_ -like "http/*" } | Select-Object -First 1
        if (-not $b) { $b = "http/*:80:" }
        $p = $b.Substring(5).Split(":")
        $ana = if ($p[2]) { $p[2] } else { "localhost" }
        $port = if ($p[1] -and $p[1] -ne "80") { ":" + $p[1] } else { "" }
        return "http://$ana$port/" + $Uygulama.Trim("/") + "/"
    }
    $ana = if ($HostAdi) { $HostAdi } else { "localhost" }
    $port = if ($Port -ne 80) { ":$Port" } else { "" }
    return "http://$ana$port/"
}

function SaglikDenetimi([string]$adres, [string]$imza) {
    try {
        $sayfa = Invoke-WebRequest -Uri $adres -UseBasicParsing -TimeoutSec 15
        if ($sayfa.StatusCode -ne 200 -or $sayfa.Content -notmatch "Katalog") { throw "Beklenmeyen yanıt ($($sayfa.StatusCode))" }
        $js = Invoke-WebRequest -Uri ($adres + "js/temel.js?v=deneme") -UseBasicParsing -TimeoutSec 15
        $tur = $js.Headers["Content-Type"]
        if ($tur -notmatch "javascript") { throw "js dosyası yanlış türle geliyor: $tur" }
        $s = (Invoke-WebRequest -Uri ($adres + "surum.txt") -UseBasicParsing -TimeoutSec 15).Content
        if ($s -notmatch [regex]::Escape($imza)) { Yaz "Sunulan sürüm henüz güncel değil (önbellek?)" "uyari" }
        Yaz "Sağlık denetimi geçti: $adres" "tamam"
        return $true
    } catch {
        Yaz "Sağlık denetimi başarısız: $($_.Exception.Message)" "hata"
        return $false
    }
}

# ── Zamanlanmış görev ────────────────────────────────────────────
function OtomatikKur {
    $arg = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Guncelle -Kaynak `"$Kaynak`" -Hedef `"$Hedef`""
    $eylem = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $arg
    $tetik = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes $Dakika)
    $kim = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    $ayar = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 10) -MultipleInstances IgnoreNew
    Register-ScheduledTask -TaskName $GorevAdi -Action $eylem -Trigger $tetik -Principal $kim -Settings $ayar -Force | Out-Null
    Yaz "Zamanlanmış görev kuruldu: '$GorevAdi' — her $Dakika dakikada bir denetler (günlük: $gunluk)" "tamam"
}

# ── Klasör izleme ────────────────────────────────────────────────
function KlasoruIzle {
    $izleyici = New-Object System.IO.FileSystemWatcher $Kaynak
    $izleyici.IncludeSubdirectories = $true
    $izleyici.NotifyFilter = [IO.NotifyFilters]"FileName, DirectoryName, LastWrite, Size"
    $izleyici.EnableRaisingEvents = $true
    Yaz "İzleniyor: $Kaynak (index.html, css, js). Durdurmak için Ctrl+C." "tamam"
    $sonImza = KaynakImzasi
    try {
        while ($true) {
            $olay = $izleyici.WaitForChanged([IO.WatcherChangeTypes]::All, 1000)
            if ($olay.TimedOut) { continue }
            $ad = $olay.Name -replace "/", "\"
            if ($ad -notmatch '^(index\.html$|css\\|js\\)') { continue }
            # Editörlerin art arda yazmalarını tek yayında topla
            do { $olay = $izleyici.WaitForChanged([IO.WatcherChangeTypes]::All, 700) } while (-not $olay.TimedOut)
            $imza = KaynakImzasi
            if ($imza -eq $sonImza) { continue }
            try { DosyalariYayinla $imza; $sonImza = $imza } catch { Yaz $_.Exception.Message "hata" }
        }
    } finally { $izleyici.Dispose() }
}

# ════════════════════════════════════════════════════════════════
$Kaynak = (Resolve-Path $Kaynak).Path

# Görev kipi: git'ten çek, kaynak değiştiyse yalnız dosyaları yayınla
if ($Guncelle) {
    try {
        if ($gitVar -and (Test-Path (Join-Path $Kaynak ".git"))) {
            GitCalistir @("fetch", "--quiet") | Out-Null
            $yerel = GitCalistir @("rev-parse", "HEAD"); $uzak = GitCalistir @("rev-parse", "@{u}")
            if ($uzak -and $yerel -ne $uzak) {
                $ErrorActionPreference = "Continue"
                $c = & git.exe -c safe.directory=* -C $Kaynak pull --ff-only 2>&1
                $ErrorActionPreference = "Stop"
                if ($LASTEXITCODE -ne 0) { throw "git pull başarısız: $c" }
                Yaz "Uzaktaki değişiklikler çekildi ($($uzak.Substring(0, 7)))"
            }
        }
        $imza = KaynakImzasi
        if ($imza -eq (YayindakiImza)) { exit 0 }
        DosyalariYayinla $imza
        exit 0
    } catch { Yaz $_.Exception.Message "hata"; exit 1 }
}

if ($OtomatikKaldir) {
    if (-not (YoneticiMi)) { throw "Görevi kaldırmak için PowerShell'i yönetici olarak açın." }
    Unregister-ScheduledTask -TaskName $GorevAdi -Confirm:$false -ErrorAction SilentlyContinue
    Yaz "Zamanlanmış görev kaldırıldı: $GorevAdi" "tamam"
    exit 0
}

# IIS ayarı yönetici ister: gerekirse kendini yönetici olarak yeniden başlat
if (-not $YalnizDosyalar -and -not (YoneticiMi)) {
    Write-Host "Yönetici yetkisi gerekiyor; onay penceresi açılıyor…" -ForegroundColor Yellow
    $arglar = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-NoExit", "-File", "`"$PSCommandPath`"")
    foreach ($k in $PSBoundParameters.Keys) {
        $v = $PSBoundParameters[$k]
        if ($v -is [switch]) { if ($v.IsPresent) { $arglar += "-$k" } } else { $arglar += "-$k"; $arglar += "`"$v`"" }
    }
    if (-not $PSBoundParameters.ContainsKey("Kaynak")) { $arglar += "-Kaynak"; $arglar += "`"$Kaynak`"" }
    Start-Process -FilePath (Get-Process -Id $PID).Path -Verb RunAs -ArgumentList $arglar
    exit 0
}

try {
    Yaz "Katalog Stüdyo yayını başlıyor: $Kaynak → $Hedef"
    if ($IISKur) { IISBilesenleriniKur }
    $imza = KaynakImzasi
    DosyalariYayinla $imza
    if (-not $YalnizDosyalar) {
        IISAyarla
        if ($GuvenlikDuvari -and -not $Uygulama) { GuvenlikDuvariniAc }
        if ($Otomatik) { OtomatikKur }
        $adres = YayinAdresi
        Start-Sleep -Milliseconds 500
        SaglikDenetimi $adres $imza | Out-Null
        Write-Host ""
        Write-Host "  Katalog yayında: $adres" -ForegroundColor Green
        Write-Host ""
        if ($Ac) { Start-Process $adres }
    }
    if ($Izle) { KlasoruIzle }
} catch {
    Yaz $_.Exception.Message "hata"
    exit 1
}
