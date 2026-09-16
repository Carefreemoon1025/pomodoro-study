param(
  [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\build")
)

Add-Type -AssemblyName System.Drawing

$OutputDirectory = [System.IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

function New-RoundedRectanglePath {
  param(
    [System.Drawing.RectangleF]$Rectangle,
    [float]$Radius
  )

  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $diameter = $Radius * 2
  $arc = [System.Drawing.RectangleF]::new(
    $Rectangle.X,
    $Rectangle.Y,
    $diameter,
    $diameter
  )
  $path.AddArc($arc, 180, 90)
  $arc.X = $Rectangle.Right - $diameter
  $path.AddArc($arc, 270, 90)
  $arc.Y = $Rectangle.Bottom - $diameter
  $path.AddArc($arc, 0, 90)
  $arc.X = $Rectangle.X
  $path.AddArc($arc, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-TomatoBitmap {
  param([int]$Size)

  $bitmap = [System.Drawing.Bitmap]::new(
    $Size,
    $Size,
    [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  )
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $scale = [float]$Size
  $backgroundRectangle = [System.Drawing.RectangleF]::new(
    $scale * 0.047,
    $scale * 0.047,
    $scale * 0.906,
    $scale * 0.906
  )
  $backgroundPath = New-RoundedRectanglePath -Rectangle $backgroundRectangle -Radius ($scale * 0.215)
  $backgroundBrush = [System.Drawing.SolidBrush]::new(
    [System.Drawing.Color]::FromArgb(255, 23, 59, 51)
  )
  $graphics.FillPath($backgroundBrush, $backgroundPath)

  $ringWidth = [Math]::Max(1.0, $scale * 0.052)
  $ringRectangle = [System.Drawing.RectangleF]::new(
    $scale * 0.165,
    $scale * 0.165,
    $scale * 0.67,
    $scale * 0.67
  )
  $trackPen = [System.Drawing.Pen]::new(
    [System.Drawing.Color]::FromArgb(255, 49, 90, 80),
    $ringWidth
  )
  $graphics.DrawEllipse($trackPen, $ringRectangle)

  $ringPen = [System.Drawing.Pen]::new(
    [System.Drawing.Color]::FromArgb(255, 247, 244, 238),
    $ringWidth
  )
  $ringPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $ringPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $graphics.DrawArc($ringPen, $ringRectangle, -90, 278)

  $bodyRectangle = [System.Drawing.RectangleF]::new(
    $scale * 0.25,
    $scale * 0.32,
    $scale * 0.50,
    $scale * 0.49
  )
  $bodyBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    $bodyRectangle,
    [System.Drawing.Color]::FromArgb(255, 255, 122, 101),
    [System.Drawing.Color]::FromArgb(255, 216, 79, 63),
    90
  )
  $graphics.FillEllipse($bodyBrush, $bodyRectangle)

  if ($Size -ge 32) {
    $highlightBrush = [System.Drawing.SolidBrush]::new(
      [System.Drawing.Color]::FromArgb(34, 255, 255, 255)
    )
    $graphics.FillEllipse(
      $highlightBrush,
      $scale * 0.34,
      $scale * 0.40,
      $scale * 0.14,
      $scale * 0.075
    )
    $highlightBrush.Dispose()
  }

  $leafBrush = [System.Drawing.SolidBrush]::new(
    [System.Drawing.Color]::FromArgb(255, 103, 175, 125)
  )
  $leafLightBrush = [System.Drawing.SolidBrush]::new(
    [System.Drawing.Color]::FromArgb(255, 124, 193, 143)
  )

  $rightLeaf = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $rightLeaf.StartFigure()
  $rightLeaf.AddBezier(
    [System.Drawing.PointF]::new([float]($scale * 0.50), [float]($scale * 0.375)),
    [System.Drawing.PointF]::new([float]($scale * 0.55), [float]($scale * 0.300)),
    [System.Drawing.PointF]::new([float]($scale * 0.65), [float]($scale * 0.280)),
    [System.Drawing.PointF]::new([float]($scale * 0.73), [float]($scale * 0.320))
  )
  $rightLeaf.AddBezier(
    [System.Drawing.PointF]::new([float]($scale * 0.73), [float]($scale * 0.320)),
    [System.Drawing.PointF]::new([float]($scale * 0.69), [float]($scale * 0.390)),
    [System.Drawing.PointF]::new([float]($scale * 0.60), [float]($scale * 0.420)),
    [System.Drawing.PointF]::new([float]($scale * 0.50), [float]($scale * 0.380))
  )
  $rightLeaf.CloseFigure()
  $graphics.FillPath($leafBrush, $rightLeaf)

  $leftLeaf = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $leftLeaf.StartFigure()
  $leftLeaf.AddBezier(
    [System.Drawing.PointF]::new([float]($scale * 0.50), [float]($scale * 0.375)),
    [System.Drawing.PointF]::new([float]($scale * 0.45), [float]($scale * 0.300)),
    [System.Drawing.PointF]::new([float]($scale * 0.35), [float]($scale * 0.280)),
    [System.Drawing.PointF]::new([float]($scale * 0.27), [float]($scale * 0.320))
  )
  $leftLeaf.AddBezier(
    [System.Drawing.PointF]::new([float]($scale * 0.27), [float]($scale * 0.320)),
    [System.Drawing.PointF]::new([float]($scale * 0.31), [float]($scale * 0.390)),
    [System.Drawing.PointF]::new([float]($scale * 0.40), [float]($scale * 0.420)),
    [System.Drawing.PointF]::new([float]($scale * 0.50), [float]($scale * 0.380))
  )
  $leftLeaf.CloseFigure()
  $graphics.FillPath($leafLightBrush, $leftLeaf)

  $stemPen = [System.Drawing.Pen]::new(
    [System.Drawing.Color]::FromArgb(255, 47, 118, 80),
    [Math]::Max(1.4, $scale * 0.034)
  )
  $stemPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $stemPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $graphics.DrawLine(
    $stemPen,
    [float]($scale * 0.50),
    [float]($scale * 0.35),
    [float]($scale * 0.535),
    [float]($scale * 0.215)
  )

  if ($Size -ge 64) {
    $dotBrush = [System.Drawing.SolidBrush]::new(
      [System.Drawing.Color]::FromArgb(255, 247, 244, 238)
    )
    $graphics.FillEllipse(
      $dotBrush,
      $scale * 0.505,
      $scale * 0.165,
      $scale * 0.035,
      $scale * 0.035
    )
    $dotBrush.Dispose()
  }

  $stemPen.Dispose()
  $leafLightBrush.Dispose()
  $leafBrush.Dispose()
  $leftLeaf.Dispose()
  $rightLeaf.Dispose()
  $bodyBrush.Dispose()
  $ringPen.Dispose()
  $trackPen.Dispose()
  $backgroundBrush.Dispose()
  $backgroundPath.Dispose()
  $graphics.Dispose()

  return $bitmap
}

function Convert-BitmapToPngBytes {
  param([System.Drawing.Bitmap]$Bitmap)

  $stream = [System.IO.MemoryStream]::new()
  $Bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
  $bytes = $stream.ToArray()
  $stream.Dispose()
  return $bytes
}

function Save-BitmapPng {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [string]$Path
  )

  $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
}

$iconSizes = @(16, 24, 32, 48, 64, 128, 256)
$iconEntries = @()

foreach ($size in $iconSizes) {
  $bitmap = New-TomatoBitmap -Size $size
  $iconEntries += [PSCustomObject]@{
    Size = $size
    Bytes = Convert-BitmapToPngBytes -Bitmap $bitmap
  }
  $bitmap.Dispose()
}

$png512 = New-TomatoBitmap -Size 512
Save-BitmapPng -Bitmap $png512 -Path (Join-Path $OutputDirectory "icon.png")
$png512.Dispose()

$tray32 = New-TomatoBitmap -Size 32
Save-BitmapPng -Bitmap $tray32 -Path (Join-Path $OutputDirectory "tray.png")
$tray32.Dispose()

$tray64 = New-TomatoBitmap -Size 64
Save-BitmapPng -Bitmap $tray64 -Path (Join-Path $OutputDirectory "tray@2x.png")
$tray64.Dispose()

$icoPath = Join-Path $OutputDirectory "icon.ico"
$stream = [System.IO.File]::Create($icoPath)
$writer = [System.IO.BinaryWriter]::new($stream)

$writer.Write([UInt16]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]$iconEntries.Count)

$offset = 6 + (16 * $iconEntries.Count)
foreach ($entry in $iconEntries) {
  $dimension = if ($entry.Size -eq 256) { 0 } else { $entry.Size }
  $writer.Write([Byte]$dimension)
  $writer.Write([Byte]$dimension)
  $writer.Write([Byte]0)
  $writer.Write([Byte]0)
  $writer.Write([UInt16]1)
  $writer.Write([UInt16]32)
  $writer.Write([UInt32]$entry.Bytes.Length)
  $writer.Write([UInt32]$offset)
  $offset += $entry.Bytes.Length
}

foreach ($entry in $iconEntries) {
  $writer.Write([Byte[]]$entry.Bytes)
}

$writer.Dispose()
$stream.Dispose()

Write-Output "Generated icon.png, tray.png, tray@2x.png, and icon.ico in $OutputDirectory"
