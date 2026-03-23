$lines = [System.IO.File]::ReadAllLines('test_results_utf8.txt', [System.Text.Encoding]::UTF8)
foreach ($line in $lines) {
    if (($line -match 'FAIL \[') -or ($line -match 'PASS \[') -or ($line -match '===') -or ($line -match 'PASSED') -or ($line -match 'FAILED')) {
        Write-Output $line
    }
}
