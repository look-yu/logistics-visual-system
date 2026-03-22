# 清空数据库所有表数据的PowerShell脚本

# 设置数据库连接信息
$dbHost = "localhost"
$dbUser = "root"
$dbPassword = ""
$dbName = "logistics_db"
$sqlFilePath = "backend\clear-data.sql"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  数据库数据清空工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "数据库信息：" -ForegroundColor Yellow
Write-Host "  主机：$dbHost" -ForegroundColor White
Write-Host "  用户：$dbUser" -ForegroundColor White
Write-Host "  数据库：$dbName" -ForegroundColor White
Write-Host ""

Write-Host "SQL文件：$sqlFilePath" -ForegroundColor Yellow
Write-Host ""

Write-Host "正在执行清空数据操作..." -ForegroundColor Cyan
Write-Host ""

# 检查SQL文件是否存在
if (-not (Test-Path $sqlFilePath)) {
    Write-Host "❌ 错误：SQL文件不存在！" -ForegroundColor Red
    Write-Host "   路径：$sqlFilePath" -ForegroundColor Red
    Write-Host ""
    Write-Host "按任意键退出..." -ForegroundColor Cyan
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# 执行SQL脚本
Write-Host "执行MySQL命令..." -ForegroundColor Cyan
$command = "mysql -u $dbUser -p $dbName < `"$sqlFilePath`""

try {
    Invoke-Expression $command
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ 数据清空成功！" -ForegroundColor Green
        Write-Host ""

        # 验证清空结果
        Write-Host "验证清空结果..." -ForegroundColor Cyan
        Write-Host ""

        $verifyCommand = "mysql -u $dbUser -p $dbName -e `" & vbCrLf & _
            SELECT 'logistics_data 表记录数' AS table_name, COUNT(*) AS record_count FROM logistics_data" & vbCrLf & _
            UNION ALL" & vbCrLf & _
            SELECT 'warehouse 表记录数' AS table_name, COUNT(*) AS record_count FROM warehouse" & vbCrLf & _
            UNION ALL" & vbCrLf & _
            SELECT 'device_type 表记录数' AS table_name, COUNT(*) AS record_count FROM device_type" & vbCrLf & _
            UNION ALL" & vbCrLf & _
            SELECT 'inventory 表记录数' AS table_name, COUNT(*) AS record_count FROM inventory" & vbCrLf & _
            UNION ALL" & vbCrLf & _
            SELECT 'inventory_distribution 表记录数' AS table_name, COUNT(*) AS record_count FROM inventory_distribution" & vbCrLf & _
            UNION ALL" & vbCrLf & _
            SELECT 'inventory_monthly_trend 表记录数' AS table_name, COUNT(*) AS record_count FROM inventory_monthly_trend" & vbCrLf & _
            UNION ALL" & vbCrLf & _
            SELECT 'warehouse_usage_trend 表记录数' AS table_name, COUNT(*) AS record_count FROM warehouse_usage_trend" & vbCrLf & _
            UNION ALL" & vbCrLf & _
            SELECT 'device 表记录数' AS table_name, COUNT(*) AS record_count FROM device" & vbCrLf & _
            UNION ALL" & vbCrLf & _
            SELECT 'device_alarm 表记录数' AS table_name, COUNT(*) AS record_count FROM device_alarm" & vbCrLf & _
            `""

        $verifyResult = Invoke-Expression $verifyCommand

        Write-Host "表记录数：" -ForegroundColor Yellow
        Write-Host $verifyResult -ForegroundColor White
        Write-Host ""

        # 检查是否所有表都已清空
        $hasData = $false
        foreach ($line in $verifyResult) {
            if ($line -match '\d+') {
                $count = [int]($matches[0].Value)
                if ($count -gt 0) {
                    $hasData = $true
                }
            }
        }

        if ($hasData) {
            Write-Host "⚠️  警告：部分表仍有数据，请检查！" -ForegroundColor Yellow
        } else {
            Write-Host "✅ 所有表数据已成功清空！" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ 执行失败！" -ForegroundColor Red
        Write-Host "退出码：$LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 发生错误：$_" -ForegroundColor Red
}

Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
