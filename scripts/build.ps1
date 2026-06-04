param (
    [Parameter(Mandatory=$false, HelpMessage="Custom tag for the image (defaults to version in pyproject.toml)")]
    [string]$Tag = $null,

    [Parameter(Mandatory=$false, HelpMessage="Target platform (e.g., linux/arm64)")]
    [string]$Platform = $null
)

# Determine version from pyproject.toml if not specified
if ([string]::IsNullOrEmpty($Tag)) {
    $pyprojectPath = Join-Path $PSScriptRoot "..\pyproject.toml"
    if (Test-Path $pyprojectPath) {
        $content = Get-Content -Raw -Path $pyprojectPath
        if ($content -match 'version\s*=\s*"([^"]+)"') {
            $Tag = $Matches[1]
            Write-Host "Found version '$Tag' in pyproject.toml" -ForegroundColor Green
        }
    }
}

if ([string]::IsNullOrEmpty($Tag)) {
    $Tag = "0.1.0"
    Write-Host "Could not parse version from pyproject.toml, defaulting to '$Tag'" -ForegroundColor Yellow
}

$VersionTag = "map2poster:$Tag"
$LatestTag = "map2poster:latest"

if (-not [string]::IsNullOrEmpty($Platform)) {
    Write-Host "Building Docker image for platform '$Platform' locally..." -ForegroundColor Cyan
    docker buildx build --platform $Platform --load -t $VersionTag -t $LatestTag (Resolve-Path "$PSScriptRoot/..").Path
} else {
    Write-Host "Building Docker image locally..." -ForegroundColor Cyan
    docker build -t $VersionTag -t $LatestTag (Resolve-Path "$PSScriptRoot/..").Path
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker build failed!"
    exit 1
}

Write-Host "Successfully built local images:" -ForegroundColor Green
Write-Host " - $VersionTag" -ForegroundColor Green
Write-Host " - $LatestTag" -ForegroundColor Green
