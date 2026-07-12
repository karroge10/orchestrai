Add-Type -AssemblyName System.Drawing
$size = 256
$bitmap = [System.Drawing.Bitmap]::new($size, $size)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$rectangle = [System.Drawing.Rectangle]::new(0, 0, $size, $size)
$background = [System.Drawing.Drawing2D.LinearGradientBrush]::new($rectangle, [System.Drawing.Color]::FromArgb(111, 97, 255), [System.Drawing.Color]::FromArgb(40, 184, 223), 45)
$graphics.FillRectangle($background, $rectangle)
$glow = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(235, 255, 255, 255))
$path = [System.Drawing.Drawing2D.GraphicsPath]::new()
$points = @(
  [System.Drawing.PointF]::new(128, 40),
  [System.Drawing.PointF]::new(148, 105),
  [System.Drawing.PointF]::new(216, 128),
  [System.Drawing.PointF]::new(148, 151),
  [System.Drawing.PointF]::new(128, 216),
  [System.Drawing.PointF]::new(108, 151),
  [System.Drawing.PointF]::new(40, 128),
  [System.Drawing.PointF]::new(108, 105)
)
$path.AddPolygon($points)
$graphics.FillPath($glow, $path)
$icon = [System.Drawing.Icon]::FromHandle($bitmap.GetHicon())
$output = Join-Path $PSScriptRoot 'icon.ico'
$stream = [System.IO.File]::Create($output)
$icon.Save($stream)
$stream.Dispose()
$icon.Dispose()
$path.Dispose()
$glow.Dispose()
$background.Dispose()
$graphics.Dispose()
$bitmap.Dispose()
Write-Output $output
