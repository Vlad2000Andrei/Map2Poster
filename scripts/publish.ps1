param (
    [Parameter(Mandatory=$true, HelpMessage="Your Docker Hub username")]
    [string]$Username,

    [Parameter(Mandatory=$false, HelpMessage="Custom tag for the image (defaults to version in pyproject.toml)")]
    [string]$Tag = $null,

    [Parameter(Mandatory=$false, HelpMessage="Target platforms (comma-separated, defaults to 'linux/amd64,linux/arm64')")]
    [string]$Platforms = "linux/amd64,linux/arm64"
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

$Username = $Username.ToLower()
$ImageBase = "$Username/map2poster"
$VersionTag = "${ImageBase}:${Tag}"
$LatestTag = "${ImageBase}:latest"

Write-Host "Building and pushing multi-platform Docker image for platforms '$Platforms'..." -ForegroundColor Cyan
docker buildx build --platform $Platforms -t $VersionTag -t $LatestTag --push (Resolve-Path "$PSScriptRoot/..").Path

if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker build/push failed! Make sure you have buildx set up and are logged in using 'docker login'."
    exit 1
}

Write-Host "Successfully published $VersionTag and $LatestTag to Docker Hub!" -ForegroundColor Green
