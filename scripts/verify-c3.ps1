[CmdletBinding()]
param(
    [string]$ComposeFile = 'docker-compose.distributed.yml'
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repositoryRoot

function Assert-Endpoint {
    param(
        [Parameter(Mandatory = $true)][string]$Uri,
        [Parameter(Mandatory = $true)][string]$Name
    )

    $response = Invoke-WebRequest -UseBasicParsing -Uri $Uri -TimeoutSec 15
    if ($response.StatusCode -ne 200) {
        throw "$Name returned HTTP $($response.StatusCode)."
    }

    [PSCustomObject]@{
        Check = $Name
        Status = $response.StatusCode
        Body = $response.Content
    }
}

& docker compose -f $ComposeFile up -d
if ($LASTEXITCODE -ne 0) {
    throw 'The distributed Compose composition did not start.'
}

$checks = @(
    Assert-Endpoint -Name 'Amaranta API health' -Uri 'http://127.0.0.1:8083/health'
    Assert-Endpoint -Name 'Catalog readiness' -Uri 'http://127.0.0.1:8082/health/ready'
)

$correlationId = [guid]::NewGuid().ToString()
$catalogResponse = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8082/v1/products' -Headers @{
    'x-correlation-id' = $correlationId
} -TimeoutSec 15

if ($catalogResponse.Headers['x-correlation-id'] -ne $correlationId) {
    throw 'Catalog did not return the supplied correlation ID.'
}

$checks += [PSCustomObject]@{
    Check = 'Catalog correlation propagation'
    Status = $catalogResponse.StatusCode
    Body = $catalogResponse.Content
}

$checks | Format-Table -AutoSize
