Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('C:\Users\Administrator\Desktop\anzhoujs\Android\app\build\outputs\apk\debug\app-debug.apk')
$zip.Entries | Where-Object { $_.FullName -like 'classes*.dex' } | Select-Object FullName, Length
$zip.Dispose()
Write-Host "---"
Write-Host "NanoHTTPD check:"
$zip2 = [System.IO.Compression.ZipFile]::OpenRead('C:\Users\Administrator\Desktop\anzhoujs\Android\app\build\outputs\apk\debug\app-debug.apk')
$zip2.Entries | Where-Object { $_.FullName -like '*nanohttpd*' } | Select-Object FullName
$zip2.Dispose()