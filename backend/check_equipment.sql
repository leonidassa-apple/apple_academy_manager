-- Script SQL para verificar os dados do equipment_control
-- Execute este script diretamente no MySQL/MariaDB

-- 1. Total de equipamentos
SELECT 'Total de equipamentos' as Descricao, COUNT(*) as Total FROM equipment_control;

-- 2. Equipamentos com para_emprestimo = 1
SELECT 'Com para_emprestimo = 1' as Descricao, COUNT(*) as Total 
FROM equipment_control 
WHERE para_emprestimo = 1;

-- 3. Equipamentos com status = 'Disponível'
SELECT 'Com status = Disponível' as Descricao, COUNT(*) as Total 
FROM equipment_control 
WHERE status = 'Disponível';

-- 4. Equipamentos que DEVEM aparecer (status='Disponível' E para_emprestimo=1)
SELECT 'Disponível E para_emprestimo=1 (DEVEM APARECER)' as Descricao, COUNT(*) as Total 
FROM equipment_control 
WHERE status = 'Disponível' AND para_emprestimo = 1;

-- 5. Distribuição por status
SELECT 
    status, 
    COUNT(*) as total,
    SUM(CASE WHEN para_emprestimo = 1 THEN 1 ELSE 0 END) as para_emprestimo_sim
FROM equipment_control 
GROUP BY status 
ORDER BY total DESC;

-- 6. Primeiros 10 exemplos
SELECT 
    id,
    tipo_device, 
    numero_serie, 
    status, 
    para_emprestimo,
    CASE WHEN para_emprestimo = 1 THEN 'Sim' ELSE 'Não' END as para_emprestimo_texto
FROM equipment_control 
LIMIT 10;
