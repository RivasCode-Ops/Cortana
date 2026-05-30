# Notebook otimizado para dev (Ultra UB422)

Configuracao aplicada em 29/05/2026 para coding com 4 GB RAM.

## O que foi feito

### Memoria e virtualizacao
- **`.wslconfig`** criado em `C:\Users\ULTRA\.wslconfig`
  - WSL2 limitado a **1.5 GB RAM**, 2 CPUs, swap 512 MB
- **Docker e WSL parados** (liberam ~500 MB+ de RAM)
- Docker **removido da inicializacao** — abra manualmente quando precisar

### Inicializacao (boot mais leve)
Removidos do boot automatico:
- Docker Desktop
- Discord
- Chrome / Edge (auto-launch)
- Canva
- Adobe Acrobat Sync

Backup das entradas antigas: `config/startup-backup.json`

### Sistema
- Plano de energia: **Alto desempenho**
- Efeitos visuais: **desempenho** (menos animacoes)

### Ferramentas de dev (OK)
| Tool    | Versao / status        |
|---------|------------------------|
| Git     | 2.54.0 (RIVA'S)        |
| Python  | 3.12.10 + pip          |
| Node.js | v24.16 (standalone)    |
| npm     | 11.13.0                |
| WSL     | Ubuntu 2 (parado)      |
| Docker  | instalado, manual      |
| Cursor  | IDE principal          |

### PATH corrigido
Node.js standalone (`C:\Program Files\nodejs\`) priorizado sobre o Node embutido do Cursor.

---

## Scripts uteis

```powershell
# Rotina diaria: libera RAM + verifica ambiente
powershell -ExecutionPolicy Bypass -File c:\_PROJETOS\Cortana\scripts\dev-daily.ps1

# Antes de codar — libera RAM maxima
powershell -ExecutionPolicy Bypass -File c:\_PROJETOS\Cortana\scripts\dev-mode-on.ps1

# Diagnostico completo
powershell -ExecutionPolicy Bypass -File c:\_PROJETOS\Cortana\scripts\dev-check.ps1

# Quando precisar de Docker
powershell -ExecutionPolicy Bypass -File c:\_PROJETOS\Cortana\scripts\dev-docker-start.ps1
```

## Sandbox de validacao

Pasta `sandbox/` para testar se o ambiente funciona:

```powershell
python c:\_PROJETOS\Cortana\sandbox\check_env.py
node c:\_PROJETOS\Cortana\sandbox\check_env.js
```

---

## Regras para codar neste PC (4 GB)

1. **Feche Chrome/Edge** se nao estiver usando — use no maximo 1 browser
2. **Nao rode Docker + WSL + Cursor** ao mesmo tempo sem necessidade
3. **Ollama / IA local** — evite; use APIs na nuvem
4. Rode `dev-mode-on.ps1` no inicio de cada sessao de codigo
5. Reinicie o PC 1x por dia se ficar lento (vazamento de RAM)

### Stack recomendada para este hardware
- **Leve:** Python, Git, Cursor, terminal, 1 aba browser
- **Medio:** + WSL Ubuntu para comandos Linux
- **Pesado:** Docker — so 1 container por vez, depois de fechar browser

---

## Upgrade de hardware (quando puder)

| Prioridade | Peca | Spec |
|------------|------|------|
| 1 (obrigatorio) | RAM | 2x 8 GB DDR3L 1600 MHz SODIMM = **16 GB** |
| 2 (opcional) | SSD | 480 GB SATA se disco encher |
| 3 (futuro) | Notebook novo | i5/Ryzen 5 + 16 GB se dev pesado |

Com 16 GB RAM este mesmo notebook vira maquina de dev confortavel para projetos web e Python.

---

## Restaurar inicializacao antiga

```powershell
# Ver backup
Get-Content c:\_PROJETOS\Cortana\config\startup-backup.json
# Restaurar manualmente via Gerenciador de Tarefas > Inicializar
```
