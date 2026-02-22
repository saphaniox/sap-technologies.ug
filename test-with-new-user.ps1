# Test script with new user registration
Write-Host "Testing IoT and Software creation with new test user..." -ForegroundColor Cyan

# Step 1: Register a test user
Write-Host "`n=== Step 1: Registering Test User ===" -ForegroundColor Yellow

$registerData = @{
    name = "Test Admin"
    email = "testadmin@test.com"
    password = "TestPass123!"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/signup" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerData `
        -SessionVariable session
    
    Write-Host "✅ User registered successfully!" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -like "*400*") {
        Write-Host "⚠️  User already exists, will try to login instead" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Registration failed!" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Step 2: Login
Write-Host "`n=== Step 2: Logging In ===" -ForegroundColor Yellow

$loginData = @{
    email = "testadmin@test.com"
    password = "TestPass123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginData `
        -SessionVariable session
    
    Write-Host "✅ Logged in successfully!" -ForegroundColor Green
    Write-Host "   User: $($loginResponse.user.name)" -ForegroundColor Cyan
    Write-Host "   Role: $($loginResponse.user.role)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Login failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit
}

# Check if user is admin
if ($loginResponse.user.role -ne "admin") {
    Write-Host "`n⚠️  Warning: User is not an admin. Some operations may fail." -ForegroundColor Yellow
    Write-Host "You may need to manually promote this user to admin in the database." -ForegroundColor Yellow
}

# Step 3: Create IoT Project
Write-Host "`n=== Step 3: Creating IoT Project ===" -ForegroundColor Yellow

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

# Step 4: Create Software App
Write-Host "`n=== Step 4: Creating Software App ===" -ForegroundColor Yellow

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

# Step 5: Verify creations
Write-Host "`n=== Step 5: Verifying Items ===" -ForegroundColor Yellow

try {
    $iotList = Invoke-RestMethod -Uri "http://localhost:5000/api/iot" -Method GET -WebSession $session
    Write-Host "✅ IoT Projects total: $($iotList.results)" -ForegroundColor Green
    if ($iotList.results -gt 0) {
        Write-Host "   Latest project: $($iotList.data[0].title)" -ForegroundColor Cyan
    }
    
    $softwareList = Invoke-RestMethod -Uri "http://localhost:5000/api/software" -Method GET -WebSession $session
    Write-Host "✅ Software Apps total: $($softwareList.data.length)" -ForegroundColor Green
    if ($softwareList.data.length -gt 0) {
        Write-Host "   Latest app: $($softwareList.data[0].name)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Failed to list items" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ Test completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
