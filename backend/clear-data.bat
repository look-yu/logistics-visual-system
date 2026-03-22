@echo off
chcp 65001 >nul
echo ========================================
echo   数据库数据清空工具
echo ========================================
echo.
echo 数据库信息：
echo   主机：localhost
echo   用户：root
echo   数据库：logistics_db
echo.
echo SQL文件：backend\clear-data.sql
echo.
echo 正在执行清空数据操作...
echo.

mysql -u root -p logistics_db < backend\clear-data.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ 数据清空成功！
    echo.
    echo 验证清空结果...
    echo.

    mysql -u root -p logistics_db -e "SELECT 'logistics_data 表记录数' AS table_name, COUNT(*) AS record_count FROM logistics_data UNION ALL SELECT 'warehouse 表记录数' AS table_name, COUNT(*) AS record_count FROM warehouse UNION ALL SELECT 'device_type 表记录数' AS table_name, COUNT(*) AS record_count FROM device_type UNION ALL SELECT 'inventory 表记录数' AS table_name, COUNT(*) AS record_count FROM inventory UNION ALL SELECT 'inventory_distribution 表记录数' AS table_name, COUNT(*) AS record_count FROM inventory_distribution UNION ALL SELECT 'inventory_monthly_trend 表记录数' AS table_name, COUNT(*) AS record_count FROM inventory_monthly_trend UNION ALL SELECT 'warehouse_usage_trend 表记录数' AS table_name, COUNT(*) AS record_count FROM warehouse_usage_trend UNION ALL SELECT 'device 表记录数' AS table_name, COUNT(*) AS record_count FROM device UNION ALL SELECT 'device_alarm 表记录数' AS table_name, COUNT(*) AS record_count FROM device_alarm"

    echo.
    echo ✅ 所有表数据已成功清空！
) else (
    echo.
    echo ❌ 执行失败！
    echo 退出码：%ERRORLEVEL%
)

echo.
echo 按任意键退出...
pause >nul
