# SharePoint Deployment Script for YSOD Digital Acknowledgment Form Hub
# Requires SharePoint Online Management Shell and PnP PowerShell

param(
    [Parameter(Mandatory=$true)]
    [string]$SiteUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$LibraryName = "Documents",
    
    [Parameter(Mandatory=$false)]
    [string]$FolderName = "YSOD-Forms",
    
    [Parameter(Mandatory=$false)]
    [switch]$CreateLists,
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableCustomScripts
)

# Import required modules
try {
    Import-Module PnP.PowerShell -ErrorAction Stop
    Write-Host "✅ PnP PowerShell module loaded successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ PnP PowerShell module not found. Please install it first:" -ForegroundColor Red
    Write-Host "Install-Module PnP.PowerShell -Scope CurrentUser" -ForegroundColor Yellow
    exit 1
}

# Connect to SharePoint
Write-Host "🔗 Connecting to SharePoint site: $SiteUrl" -ForegroundColor Blue
try {
    Connect-PnPOnline -Url $SiteUrl -Interactive
    Write-Host "✅ Connected successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to connect to SharePoint: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Enable custom scripts if requested
if ($EnableCustomScripts) {
    Write-Host "🔧 Enabling custom scripts..." -ForegroundColor Blue
    try {
        Set-PnPSite -DenyAddAndCustomizePages $false
        Write-Host "✅ Custom scripts enabled" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Could not enable custom scripts. You may need SharePoint Admin permissions." -ForegroundColor Yellow
    }
}

# Create folder in document library
Write-Host "📁 Creating folder '$FolderName' in '$LibraryName' library..." -ForegroundColor Blue
try {
    $folder = Add-PnPFolder -Name $FolderName -Folder $LibraryName -ErrorAction SilentlyContinue
    if ($folder) {
        Write-Host "✅ Folder created successfully" -ForegroundColor Green
    } else {
        Write-Host "ℹ️ Folder already exists or created" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Failed to create folder: $($_.Exception.Message)" -ForegroundColor Red
}

# Upload files
Write-Host "📤 Uploading project files..." -ForegroundColor Blue
$filesToUpload = @(
    "index.html",
    "sharepoint-deployment.html",
    "styles.css",
    "main.js",
    "data.js",
    "storage.js",
    "theme.js",
    "ui.js",
    "forms.js",
    "pdf.js",
    "favicon.ico"
)

$uploadedFiles = @()
foreach ($file in $filesToUpload) {
    if (Test-Path $file) {
        try {
            $uploadResult = Add-PnPFile -Path $file -Folder "$LibraryName/$FolderName"
            Write-Host "  ✅ Uploaded: $file" -ForegroundColor Green
            $uploadedFiles += $file
        } catch {
            Write-Host "  ❌ Failed to upload $file`: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "  ⚠️ File not found: $file" -ForegroundColor Yellow
    }
}

# Create SharePoint Lists if requested
if ($CreateLists) {
    Write-Host "📋 Creating SharePoint Lists..." -ForegroundColor Blue
    
    # Create AcknowledgmentTypes list
    try {
        $ackTypesList = New-PnPList -Title "AcknowledgmentTypes" -Template GenericList -ErrorAction SilentlyContinue
        if ($ackTypesList) {
            Write-Host "✅ Created AcknowledgmentTypes list" -ForegroundColor Green
            
            # Add custom columns
            Add-PnPField -List "AcknowledgmentTypes" -DisplayName "Description" -InternalName "Description" -Type Note
            Add-PnPField -List "AcknowledgmentTypes" -DisplayName "Icon" -InternalName "Icon" -Type Text
            Add-PnPField -List "AcknowledgmentTypes" -DisplayName "IsCustom" -InternalName "IsCustom" -Type Boolean
            
            Write-Host "  ✅ Added custom columns to AcknowledgmentTypes" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ⚠️ AcknowledgmentTypes list might already exist" -ForegroundColor Yellow
    }
    
    # Create AcknowledgmentSubmissions list
    try {
        $ackSubmissionsList = New-PnPList -Title "AcknowledgmentSubmissions" -Template GenericList -ErrorAction SilentlyContinue
        if ($ackSubmissionsList) {
            Write-Host "✅ Created AcknowledgmentSubmissions list" -ForegroundColor Green
            
            # Add custom columns
            Add-PnPField -List "AcknowledgmentSubmissions" -DisplayName "EmployeeName" -InternalName "EmployeeName" -Type Text
            Add-PnPField -List "AcknowledgmentSubmissions" -DisplayName "RequestNumber" -InternalName "RequestNumber" -Type Text
            Add-PnPField -List "AcknowledgmentSubmissions" -DisplayName "AckType" -InternalName "AckType" -Type Text
            Add-PnPField -List "AcknowledgmentSubmissions" -DisplayName "SubmissionDate" -InternalName "SubmissionDate" -Type DateTime
            Add-PnPField -List "AcknowledgmentSubmissions" -DisplayName "Status" -InternalName "Status" -Type Choice -Choices @("Pending", "Approved", "Rejected")
            
            Write-Host "  ✅ Added custom columns to AcknowledgmentSubmissions" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ⚠️ AcknowledgmentSubmissions list might already exist" -ForegroundColor Yellow
    }
}

# Generate deployment summary
Write-Host "`n📊 Deployment Summary:" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Site URL: $SiteUrl" -ForegroundColor White
Write-Host "Library: $LibraryName" -ForegroundColor White
Write-Host "Folder: $FolderName" -ForegroundColor White
Write-Host "Files uploaded: $($uploadedFiles.Count)" -ForegroundColor White

if ($uploadedFiles.Count -gt 0) {
    Write-Host "`n🔗 Access your application at:" -ForegroundColor Green
    $siteUrlClean = $SiteUrl.TrimEnd('/')
    Write-Host "$siteUrlClean/$LibraryName/$FolderName/index.html" -ForegroundColor Yellow
    Write-Host "$siteUrlClean/$LibraryName/$FolderName/sharepoint-deployment.html" -ForegroundColor Yellow
}

Write-Host "`n📝 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Create a new Modern Page in SharePoint" -ForegroundColor White
Write-Host "2. Add an Embed web part" -ForegroundColor White
Write-Host "3. Use the URL above to embed your application" -ForegroundColor White
Write-Host "4. Test all functionality in SharePoint environment" -ForegroundColor White

if ($CreateLists) {
    Write-Host "5. Configure the application to use SharePoint Lists instead of localStorage" -ForegroundColor White
}

Write-Host "`n🎉 Deployment completed!" -ForegroundColor Green

# Disconnect from SharePoint
Disconnect-PnPOnline
Write-Host "🔌 Disconnected from SharePoint" -ForegroundColor Blue