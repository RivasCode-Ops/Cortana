# Antes de codar (libera RAM)
powershell -ExecutionPolicy Bypass -File c:\_PROJETOS\Cortana\scripts\dev-mode-on.ps1

# Verificar ambiente
powershell -ExecutionPolicy Bypass -File c:\_PROJETOS\Cortana\scripts\dev-check.ps1

# Validar Python
python c:\_PROJETOS\Cortana\sandbox\check_env.py

# Validar Node (usa instalacao standalone)
& "C:\Program Files\nodejs\node.exe" c:\_PROJETOS\Cortana\sandbox\check_env.js

# Docker (so quando precisar)
powershell -ExecutionPolicy Bypass -File c:\_PROJETOS\Cortana\scripts\dev-docker-start.ps1
