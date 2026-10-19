# 把 AI 生成的高清菜品原图（hd-dishes/raw/<key>/*.png）处理成可直接上传托管的 JPEG：
#   1. 裁掉右下角生成水印（底部 84px）
#   2. 等比缩放到宽 1000px
#   3. JPEG quality 86 输出到 hd-dishes/<key>.jpg
# 用法：powershell -ExecutionPolicy Bypass -File scripts/build-hd-dishes.ps1
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$rawDir = Join-Path $root 'hd-dishes/raw'
$outDir = Join-Path $root 'hd-dishes'
$cropBottom = 84
$targetW = 1000
$quality = [long]86

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.FormatID -eq [System.Drawing.Imaging.ImageFormat]::Jpeg.Guid }

$ok = 0
$fail = 0

Get-ChildItem $rawDir -Directory | ForEach-Object {
  $key = $_.Name
  $src = Get-ChildItem $_.FullName -Filter *.png | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $src) { Write-Host "SKIP  $key (无原图)"; return }

  $out = Join-Path $outDir ($key + '.jpg')
  try {
    $img = [System.Drawing.Image]::FromFile($src.FullName)
    $cropH = [int]$img.Height - $cropBottom
    if ($cropH -le 0) { throw '裁切高度非法' }
    $targetH = [int][Math]::Round($cropH * $targetW / $img.Width)

    $bmp = New-Object System.Drawing.Bitmap $targetW, $targetH
    $bmp.SetResolution(96, 96)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $destRect = New-Object System.Drawing.Rectangle 0, 0, $targetW, $targetH
    $srcRect = New-Object System.Drawing.Rectangle 0, 0, $img.Width, $cropH
    $g.DrawImage($img, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $p = New-Object 'System.Drawing.Imaging.EncoderParameter' ([System.Drawing.Imaging.Encoder]::Quality), $quality
    $eps = New-Object System.Drawing.Imaging.EncoderParameters 1
    $eps.Param[0] = $p
    $bmp.Save($out, [System.Drawing.Imaging.ImageCodecInfo]$codec, $eps)
    $bmp.Dispose()
    $img.Dispose()

    $kb = [Math]::Round((Get-Item $out).Length / 1KB, 1)
    Write-Host ("OK    {0,-26} {1,5}x{2,-5} {3} KB" -f $key, $targetW, $targetH, $kb)
    $ok++
  } catch {
    Write-Host "FAIL  $key -> $($_.Exception.Message)"
    $fail++
  }
}

Write-Host ""
Write-Host "完成：成功 $ok 张，失败 $fail 张，输出目录 $outDir"
