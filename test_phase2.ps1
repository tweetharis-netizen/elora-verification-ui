$base = "http://localhost:4000/api"
$pass = 0
$fail = 0

function Test-Step {
    param($name, [scriptblock]$block)
    try {
        $result = & $block
        Write-Host "PASS [OK] $name" -ForegroundColor Green
        $script:pass++
        return $result
    }
    catch {
        Write-Host "FAIL [!!] $name => $_" -ForegroundColor Red
        $script:fail++
        return $null
    }
}

function Check {
    param($condition, $msg)
    if (-not $condition) { throw $msg }
}

Write-Host ""
Write-Host "=== SECTION 1: Environment Setup ===" -ForegroundColor Cyan

$teacher = Test-Step "1a. Create real teacher in SQLite" {
    $b = [System.Text.Encoding]::UTF8.GetBytes('{"id":"u_test_teacher","name":"Real Ms. Chan","email":"chan_test@elora-real.com","role":"teacher"}')
    $wr = [System.Net.WebRequest]::Create("$base/auth/signup")
    $wr.Method = "POST"; $wr.ContentType = "application/json"; $wr.ContentLength = $b.Length
    $s = $wr.GetRequestStream(); $s.Write($b, 0, $b.Length); $s.Close()
    $resp = $wr.GetResponse()
    $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
    $reader.ReadToEnd() | ConvertFrom-Json
}

$student = Test-Step "1b. Create real student in SQLite" {
    $b = [System.Text.Encoding]::UTF8.GetBytes('{"id":"u_test_student","name":"Real Sam Kim","email":"sam_test@elora-real.com","role":"student"}')
    $wr = [System.Net.WebRequest]::Create("$base/auth/signup")
    $wr.Method = "POST"; $wr.ContentType = "application/json"; $wr.ContentLength = $b.Length
    $s = $wr.GetRequestStream(); $s.Write($b, 0, $b.Length); $s.Close()
    $resp = $wr.GetResponse()
    $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
    $reader.ReadToEnd() | ConvertFrom-Json
}

$parent = Test-Step "1c. Create real parent in SQLite" {
    $b = [System.Text.Encoding]::UTF8.GetBytes('{"id":"u_test_parent","name":"Real Mr. Kim","email":"parent_test@elora-real.com","role":"parent"}')
    $wr = [System.Net.WebRequest]::Create("$base/auth/signup")
    $wr.Method = "POST"; $wr.ContentType = "application/json"; $wr.ContentLength = $b.Length
    $s = $wr.GetRequestStream(); $s.Write($b, 0, $b.Length); $s.Close()
    $resp = $wr.GetResponse()
    $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
    $result = $reader.ReadToEnd() | ConvertFrom-Json
    
    # Manually link the parent to student in sqlite for tests since there is no UI route for this yet
    node add_link.cjs
    
    $result
}

$tHeaders = @{ "x-user-id" = "u_test_teacher"; "x-user-role" = "teacher" }
$sHeaders = @{ "x-user-id" = "u_test_student"; "x-user-role" = "student" }
$pHeaders = @{ "x-user-id" = "u_test_parent"; "x-user-role" = "parent" }

Test-Step "1d. Real teacher authenticates via requireAuth middleware" {
    $r = Invoke-RestMethod -Uri "$base/classes" -Headers $tHeaders
    Check ($r -ne $null) "Expected non-null response"
    Write-Host "   Auth succeeded. Classes count: $($r.Count)"
}

Write-Host ""
Write-Host "=== SECTION 2: Teacher Class Creation ===" -ForegroundColor Cyan

$class = $null
$class = Test-Step "2a. Teacher creates a real class" {
    $b = [System.Text.Encoding]::UTF8.GetBytes('{"name":"Science 101","subject":"Biology","scheduleTime":"Mon 9am"}')
    $wr = [System.Net.WebRequest]::Create("$base/classes")
    $wr.Method = "POST"; $wr.ContentType = "application/json"; $wr.ContentLength = $b.Length
    $wr.Headers["x-user-id"] = "u_test_teacher"; $wr.Headers["x-user-role"] = "teacher"
    $s = $wr.GetRequestStream(); $s.Write($b, 0, $b.Length); $s.Close()
    $resp = $wr.GetResponse()
    $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
    $reader.ReadToEnd() | ConvertFrom-Json
}

$classId = if ($class) { $class.id } else { "" }
$joinCode = if ($class) { $class.joinCode } else { "" }

Test-Step "2b. Class appears in teacher class list" {
    $classes = Invoke-RestMethod -Uri "$base/classes" -Headers $tHeaders
    $found = $classes | Where-Object { $_.id -eq $classId }
    Check ($found -ne $null) "Class $classId not found in list"
    Write-Host "   JoinCode: $($found.joinCode), Students: $($found.studentsCount)"
}

Write-Host ""
Write-Host "=== SECTION 3: Student Joins Class ===" -ForegroundColor Cyan

Test-Step "3a. Student joins class using join code" {
    $b = [System.Text.Encoding]::UTF8.GetBytes("{`"joinCode`":`"$joinCode`"}")
    $wr = [System.Net.WebRequest]::Create("$base/classes/join")
    $wr.Method = "POST"; $wr.ContentType = "application/json"; $wr.ContentLength = $b.Length
    $wr.Headers["x-user-id"] = "u_test_student"; $wr.Headers["x-user-role"] = "student"
    $s = $wr.GetRequestStream(); $s.Write($b, 0, $b.Length); $s.Close()
    $resp = $wr.GetResponse()
    $result = (New-Object System.IO.StreamReader($resp.GetResponseStream())).ReadToEnd() | ConvertFrom-Json
    Check ($result.classroom -ne $null) "No classroom returned"
    Write-Host "   Joined: $($result.classroom.name)"
}

Test-Step "3b. Student class list shows the joined class" {
    $classes = Invoke-RestMethod -Uri "$base/classes/mine" -Headers $sHeaders
    $found = $classes | Where-Object { $_.id -eq $classId }
    Check ($found -ne $null) "Joined class not in student list"
    Write-Host "   Class found with teacherName: $($found.teacherName)"
}

Write-Host ""
Write-Host "=== SECTION 4: Teacher Creates Assignments ===" -ForegroundColor Cyan

$futureDate = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
$pastDate   = (Get-Date).AddDays(-2).ToString("yyyy-MM-dd")

$draftAssignment = Test-Step "4a. Teacher creates DRAFT assignment" {
    $json = "{`"classroomId`":`"$classId`",`"title`":`"Draft Quiz`",`"description`":`"Not yet published`",`"dueDate`":`"$futureDate`",`"publish`":false}"
    $b = [System.Text.Encoding]::UTF8.GetBytes($json)
    $wr = [System.Net.WebRequest]::Create("$base/assignments")
    $wr.Method = "POST"; $wr.ContentType = "application/json"; $wr.ContentLength = $b.Length
    $wr.Headers["x-user-id"] = "u_test_teacher"; $wr.Headers["x-user-role"] = "teacher"
    $s = $wr.GetRequestStream(); $s.Write($b, 0, $b.Length); $s.Close()
    $resp = $wr.GetResponse()
    (New-Object System.IO.StreamReader($resp.GetResponseStream())).ReadToEnd() | ConvertFrom-Json
}

$publishedAssignment = Test-Step "4b. Teacher creates PUBLISHED assignment (due soon)" {
    $json = "{`"classroomId`":`"$classId`",`"title`":`"Live Quiz`",`"description`":`"Live now`",`"dueDate`":`"$futureDate`",`"publish`":true}"
    $b = [System.Text.Encoding]::UTF8.GetBytes($json)
    $wr = [System.Net.WebRequest]::Create("$base/assignments")
    $wr.Method = "POST"; $wr.ContentType = "application/json"; $wr.ContentLength = $b.Length
    $wr.Headers["x-user-id"] = "u_test_teacher"; $wr.Headers["x-user-role"] = "teacher"
    $s = $wr.GetRequestStream(); $s.Write($b, 0, $b.Length); $s.Close()
    $resp = $wr.GetResponse()
    (New-Object System.IO.StreamReader($resp.GetResponseStream())).ReadToEnd() | ConvertFrom-Json
}

$overdueAssignment = Test-Step "4c. Teacher creates PUBLISHED-OVERDUE assignment" {
    $json = "{`"classroomId`":`"$classId`",`"title`":`"Past Quiz`",`"description`":`"Already overdue`",`"dueDate`":`"$pastDate`",`"publish`":true}"
    $b = [System.Text.Encoding]::UTF8.GetBytes($json)
    $wr = [System.Net.WebRequest]::Create("$base/assignments")
    $wr.Method = "POST"; $wr.ContentType = "application/json"; $wr.ContentLength = $b.Length
    $wr.Headers["x-user-id"] = "u_test_teacher"; $wr.Headers["x-user-role"] = "teacher"
    $s = $wr.GetRequestStream(); $s.Write($b, 0, $b.Length); $s.Close()
    $resp = $wr.GetResponse()
    (New-Object System.IO.StreamReader($resp.GetResponseStream())).ReadToEnd() | ConvertFrom-Json
}

$draftId = if ($draftAssignment) { $draftAssignment.id }     else { "" }
$publishedId = if ($publishedAssignment) { $publishedAssignment.id } else { "" }
$overdueId = if ($overdueAssignment) { $overdueAssignment.id }   else { "" }

Write-Host ""
Write-Host "=== SECTION 5: Assignment List Verification ===" -ForegroundColor Cyan

Test-Step "5a. Teacher sees all 3 assignments for the class" {
    $list = Invoke-RestMethod -Uri "$base/assignments?classId=$classId" -Headers $tHeaders
    Check ($list.Count -ge 3) "Expected >=3 assignments, got $($list.Count)"
    $statuses = $list | ForEach-Object { $_.statusLabel }
    Write-Host "   Assignment statuses: $($statuses -join ', ')"
}

Test-Step "5b. DRAFT assignment shows statusLabel=DRAFT" {
    $list = Invoke-RestMethod -Uri "$base/assignments?classId=$classId" -Headers $tHeaders
    $draft = $list | Where-Object { $_.id -eq $draftId }
    Check ($draft -ne $null) "Draft assignment not found in list"
    Check ($draft.statusLabel -match "DRAFT") "Expected DRAFT label, got '$($draft.statusLabel)'"
    Write-Host "   Draft statusLabel: $($draft.statusLabel)"
}

Test-Step "5c. Published (future) assignment shows DUE SOON" {
    $list = Invoke-RestMethod -Uri "$base/assignments?classId=$classId" -Headers $tHeaders
    $pub = $list | Where-Object { $_.id -eq $publishedId }
    Check ($pub -ne $null) "Published assignment not found"
    Check ($pub.statusLabel -match "DUE") "Expected DUE label, got '$($pub.statusLabel)'"
    Write-Host "   Published statusLabel: $($pub.statusLabel)"
}

Test-Step "5d. Overdue assignment shows OVERDUE" {
    $list = Invoke-RestMethod -Uri "$base/assignments?classId=$classId" -Headers $tHeaders
    $ov = $list | Where-Object { $_.id -eq $overdueId }
    Check ($ov -ne $null) "Overdue assignment not found"
    Check ($ov.statusLabel -match "OVERDUE") "Expected OVERDUE label, got '$($ov.statusLabel)'"
    Write-Host "   Overdue statusLabel: $($ov.statusLabel)"
}

Test-Step "5e. Draft assignment has zero attempt rows" {
    $attempts = Invoke-RestMethod -Uri "$base/assignments/$draftId/attempts" -Headers $tHeaders
    Check ($attempts.Count -eq 0) "Draft should have 0 attempts, got $($attempts.Count)"
    Write-Host "   Draft attempts: 0 (correct)"
}

Test-Step "5f. Published assignment auto-created attempt for enrolled student" {
    $attempts = Invoke-RestMethod -Uri "$base/assignments/$publishedId/attempts" -Headers $tHeaders
    Check ($attempts.Count -ge 1) "Expected >=1 attempt rows, got $($attempts.Count)"
    $sa = $attempts | Where-Object { $_.studentId -eq "u_test_student" }
    Check ($sa -ne $null) "No attempt found for u_test_student"
    Write-Host "   Attempt status: $($sa.status)"
}

Write-Host ""
Write-Host "=== SECTION 6: Student Views Tasks ===" -ForegroundColor Cyan

Test-Step "6a. Student sees the Live Quiz (published, due soon)" {
    $res = Invoke-RestMethod -Uri "$base/assignments/student" -Headers $sHeaders
    $live = $res.assignments | Where-Object { $_.assignmentId -eq $publishedId }
    Check ($live -ne $null) "Student should see 'Live Quiz' in tasks"
    Write-Host "   Task statusLabel: $($live.statusLabel)"
}

Test-Step "6b. Student does NOT see Draft Quiz" {
    $res = Invoke-RestMethod -Uri "$base/assignments/student" -Headers $sHeaders
    $draft = $res.assignments | Where-Object { $_.assignmentId -eq $draftId }
    Check ($draft -eq $null) "Student should NOT see draft, but found one"
    Write-Host "   Draft correctly hidden from student"
}

Test-Step "6c. Student sees overdue assignment" {
    $res = Invoke-RestMethod -Uri "$base/assignments/student" -Headers $sHeaders
    $ov = $res.assignments | Where-Object { $_.assignmentId -eq $overdueId }
    Check ($ov -ne $null) "Student should see overdue assignment"
    Write-Host "   Overdue task statusLabel: $($ov.statusLabel)"
}

Write-Host ""
Write-Host "=== SECTION 7: Student Submits ===" -ForegroundColor Cyan

Test-Step "7a. Student submits the Live Quiz" {
    $res = Invoke-RestMethod -Uri "$base/assignments/student" -Headers $sHeaders
    $live = $res.assignments | Where-Object { $_.assignmentId -eq $publishedId }
    $attemptId = $live.attemptId

    $json = "{`"gameSessionId`":`"demo_session`",`"score`":87}"
    $b = [System.Text.Encoding]::UTF8.GetBytes($json)
    $wr = [System.Net.WebRequest]::Create("$base/assignments/attempt/$attemptId/submit")
    $wr.Method = "POST"; $wr.ContentType = "application/json"; $wr.ContentLength = $b.Length
    $wr.Headers["x-user-id"] = "u_test_student"; $wr.Headers["x-user-role"] = "student"
    $s = $wr.GetRequestStream(); $s.Write($b, 0, $b.Length); $s.Close()
    $resp = $wr.GetResponse()
    $result = (New-Object System.IO.StreamReader($resp.GetResponseStream())).ReadToEnd() | ConvertFrom-Json
    Check ($result -ne $null) "Submit returned null"
    Write-Host "   Submit OK: $($result | ConvertTo-Json -Compress)"
}

Test-Step "7b. After submit, attempt row flips to submitted" {
    $attempts = Invoke-RestMethod -Uri "$base/assignments/$publishedId/attempts" -Headers $tHeaders
    $sa = $attempts | Where-Object { $_.studentId -eq "u_test_student" }
    Check ($sa -ne $null) "Student attempt not found"
    Check ($sa.status -eq "submitted") "Expected submitted, got '$($sa.status)'"
    Write-Host "   Score recorded: $($sa.bestScore)%"
}

Test-Step "7c. Completed task status indicates SUBMITTED" {
    $res = Invoke-RestMethod -Uri "$base/assignments/student" -Headers $sHeaders
    $live = $res.assignments | Where-Object { $_.assignmentId -eq $publishedId }
    Check ($live.statusLabel -eq "SUBMITTED") "Completed assignment should say SUBMITTED"
    Write-Host "   Completed task correctly marked as SUBMITTED"
}

Write-Host ""
Write-Host "=== SECTION 8: Parent View ===" -ForegroundColor Cyan

Test-Step "8a. Parent endpoint responds" {
    $r = Invoke-RestMethod -Uri "$base/parent/children" -Headers $pHeaders
    Check ($r -ne $null) "Parent summary returned null"
    Write-Host "   Children count: $($r.Count)"
}

Write-Host ""
Write-Host "=== SECTION 9: Copilot Data Sources ===" -ForegroundColor Cyan

Test-Step "9a. Real teacher stats endpoint returns data" {
    $r = Invoke-RestMethod -Uri "$base/teacher/stats" -Headers $tHeaders
    Check ($r -ne $null) "Teacher stats null"
    Write-Host "   Stats keys: $(($r | Get-Member -MemberType NoteProperty).Name -join ', ')"
}

Test-Step "9b. Real teacher insights endpoint responds" {
    $r = Invoke-RestMethod -Uri "$base/teacher/insights/needs-attention" -Headers $tHeaders
    Check ($r -ne $null) "Insights null"
    Write-Host "   Insights items: $($r.Count)"
}

Test-Step "9c. Demo teacher_1 still works (isolation check)" {
    $demoH = @{ "x-user-id" = "teacher_1"; "x-user-role" = "teacher" }
    $r = Invoke-RestMethod -Uri "$base/teacher/stats" -Headers $demoH
    Check ($r.Count -ge 1) "Demo teacher stats should not be empty"
    Write-Host "   Demo still returns $($r.Count) stat items"
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Yellow
Write-Host "  TEST SUMMARY" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Yellow
Write-Host "  PASSED : $pass" -ForegroundColor Green
Write-Host "  FAILED : $fail" -ForegroundColor Red
Write-Host ""
Write-Host "IDs used in this test run:"
Write-Host "  teacherId   = u_test_teacher"
Write-Host "  studentId   = u_test_student"
Write-Host "  classId     = $classId | joinCode = $joinCode"
Write-Host "  draftId     = $draftId"
Write-Host "  publishedId = $publishedId"
Write-Host "  overdueId   = $overdueId"
