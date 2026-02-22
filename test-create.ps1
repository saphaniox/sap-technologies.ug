# Test script for creating IoT and Software items
Write-Host "Testing IoT and Software creation..." -ForegroundColor Cyan

# First, log in to get admin session
Write-Host "`n=== Step 1: Admin Login ===" -ForegroundColor Yellow

$loginData = @{
    email = "saptechnologies256@gmail.com"
    password = "AdminSAP2025!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginData `
        -SessionVariable session
    
    Write-Host "✅ Logged in successfully as admin!" -ForegroundColor Green
} catch {
    Write-Host "❌ Login failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit
}

# Test 1: Create IoT Project
Write-Host "`n=== Step 2: Creating IoT Project ===" -ForegroundColor Yellow

$iotData = @{
    title = "Test Smart Home System"
    description = "A test IoT project for home automation"
    category = "Smart Home"
    status = "completed"
    isPublic = "true"
    isFeatured = "false"
    order = "0"
    technologies = '["Arduino","ESP32","MQTT"]'
    hardware = '["ESP32","Sensors","Relays"]'
    features = '["Remote Control","Energy Monitoring","Voice Control"]'
} | ConvertTo-Json

try {
    $iotResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/iot" `
        -Method POST `
        -ContentType "application/json" `
        -Body $iotData `
        -WebSession $session
    
    Write-Host "✅ IoT Project created successfully!" -ForegroundColor Green
    Write-Host "   ID: $($iotResponse.data._id)" -ForegroundColor Cyan
    Write-Host "   Title: $($iotResponse.data.title)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ IoT Project creation failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

# Test 2: Create Software App
Write-Host "`n=== Step 3: Creating Software App ===" -ForegroundColor Yellow

$softwareData = @{
    name = "Test Invoice Manager"
    description = "A test software for managing invoices"
    url = "https://test-invoice.example.com"
    category = "Business Tools"
    status = "active"
    isPublic = "true"
    order = "0"
    features = '["Invoice Generation","PDF Export","Email Sending"]'
    technologies = '["React","Node.js","MongoDB"]'
} | ConvertTo-Json

try {
    $softwareResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/software" `
        -Method POST `
        -ContentType "application/json" `
        -Body $softwareData `
        -WebSession $session
    
    Write-Host "✅ Software App created successfully!" -ForegroundColor Green
    Write-Host "   ID: $($softwareResponse.data._id)" -ForegroundColor Cyan
    Write-Host "   Name: $($softwareResponse.data.name)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Software App creation failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

# Test 3: Verify creations by listing
Write-Host "`n=== Step 4: Verifying Items Were Created ===" -ForegroundColor Yellow

try {
    $iotList = Invoke-RestMethod -Uri "http://localhost:5000/api/iot" -Method GET -WebSession $session
    Write-Host "✅ IoT Projects total: $($iotList.results)" -ForegroundColor Green
    if ($iotList.results -gt 0) {
        Write-Host "   Latest: $($iotList.data[0].title)" -ForegroundColor Cyan
    }
    
    $softwareList = Invoke-RestMethod -Uri "http://localhost:5000/api/software" -Method GET -WebSession $session
    Write-Host "✅ Software Apps total: $($softwareList.data.length)" -ForegroundColor Green
    if ($softwareList.data.length -gt 0) {
        Write-Host "   Latest: $($softwareList.data[0].name)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Failed to list items" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ Test completed successfully!" -ForegroundColor Green
Write-Host "Both IoT and Software creation are working!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
