-- Check database connection and show basic information
USE MediQuick;
GO

-- Show database information
SELECT 
    DB_NAME() as 'Database Name',
    SUSER_NAME() as 'Current User',
    @@VERSION as 'SQL Server Version';
GO

-- Show all tables and their row counts
SELECT 
    t.TABLE_NAME,
    p.rows as 'Row Count'
FROM 
    INFORMATION_SCHEMA.TABLES t
    JOIN sys.partitions p ON OBJECT_ID(t.TABLE_SCHEMA + '.' + t.TABLE_NAME) = p.OBJECT_ID
WHERE 
    t.TABLE_TYPE = 'BASE TABLE'
    AND p.index_id IN (0,1)
ORDER BY 
    t.TABLE_NAME;
GO

-- Show table relationships (Foreign Keys)
SELECT 
    fk.name as 'Foreign Key Name',
    OBJECT_NAME(fk.parent_object_id) as 'Table',
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) as 'Column',
    OBJECT_NAME(fk.referenced_object_id) as 'Referenced Table',
    COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) as 'Referenced Column'
FROM 
    sys.foreign_keys fk
    JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
ORDER BY 
    'Table', 'Foreign Key Name';
GO 