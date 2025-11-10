# Library Release Monitor

Extensão Chrome que monitora bibliotecas em repositórios populares (npm, PyPI, crates.io) e alerta quando há releases relevantes.

## Como testar no Chrome

1. Abra `chrome://extensions/`.
2. Ative **Modo do desenvolvedor** (canto superior direito).
3. Clique em **Carregar sem compactação** e selecione a pasta `chrome-release-monitor`.
4. A extensão aparecerá na barra de ferramentas. Clique no ícone para ver a lista monitorada.
5. Use o link **Configurar** para ajustar bibliotecas e frequência.

## Estrutura

- `manifest.json`: configuração principal da extensão.
- `src/background.js`: service worker que agenda verificações e dispara notificações.
- `src/popup.*`: UI rápida que lista bibliotecas e última versão conhecida.
- `src/options.*`: página de configurações para editar bibliotecas e intervalo.

## Próximos passos

- Adicionar ícones reais em `icons/icon16.png`, `icon48.png`, `icon128.png`.
- Tratar autenticação/token quando repositórios exigirem limites mais altos.
- Persistir histórico de versões e destacar mudanças com CVEs.
- Implementar testes automatizados para funções utilitárias (ex.: parsing SemVer).
