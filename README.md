# Calculadora

Calculadora web feita com Vite e JavaScript. Todas as operações são executadas no frontend, sem backend.

## Pré-requisitos

- [Node.js 18+](https://nodejs.org/)
- [VS Code](https://code.visualstudio.com/)

## Estrutura do projeto

```
calculadora/
└── frontend/
    ├── index.html
    ├── package.json
    └── src/
```

## Configuração do ambiente

```bash
cd frontend
npm install
```

## Executando localmente no VS Code

Abra o terminal integrado no VS Code com **Ctrl+Shift+`** e rode:

```bash
cd frontend
npm run dev
```

Depois acesse [http://localhost:5173](http://localhost:5173).

## Build de produção

```bash
cd frontend
npm run build
```

## Observações

- A lógica da calculadora fica no frontend.
- Os cálculos usam `decimal.js` para manter precisão decimal.
- O projeto não depende de backend dedicado nem de toolchain mobile nativa.
