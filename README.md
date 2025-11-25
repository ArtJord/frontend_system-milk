# 🐄 Leiteria Milk Bom — Frontend (Vue 3 + Vite)

[![Vue.js](https://img.shields.io/badge/Vue-3.4-brightgreen)]()
[![Vite](https://img.shields.io/badge/Vite-5-purple)]()
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-blue)]()
[![Status](https://img.shields.io/badge/Status-Ativo-brightgreen)]()

Frontend oficial do **System Milk**, desenvolvido com **Vue 3 (Composition API)**, **Vite**, **TailwindCSS** e integração completa com o backend REST em PHP.

Este repositório contém **apenas o frontend**.  
➡️ O backend está disponível em: **https://github.com/ArtJord/system-milk**

---

# 🚀 Visão Geral

O frontend oferece uma UI moderna, responsiva e orientada à produtividade para operações da leiteria:

- 🐄 **Cadastro e gestão de animais**
- 🥛 **Registro de produção de leite**
- 💰 **Controle financeiro**
  - Lucros  
  - Despesas
- 📊 **Painel de relatórios**
- 🔐 **Login e autenticação**
- ✍️ **Formulários completos, com validação**
- 🔎 **Filtros por período, categoria e pesquisa textual**

Construído com foco em performance e organização modular.

---

# ⚙️ Tecnologias Utilizadas

| Camada       | Tecnologia |
|--------------|------------|
| Framework    | Vue 3 (Composition API) |
| Builder      | Vite |
| Estilos      | TailwindCSS |
| Componentes  | HeroIcons / custom |
| Estado       | Pinia |
| HTTP Client  | Axios |
| Utilidades   | date utils, toast handlers |

---

# 🛠️ Instalação e Setup

## 1️⃣ Clonar o repositório

```bash
git clone https://github.com/SEU_USUARIO/system-milk-frontend.git
cd system-milk-frontend
```
## 2️⃣ Instalar dependências
```
npm install
```
ou
```
pnpm install
```
## 3️⃣ Configurar ambiente (.env.development)
Arquivo já incluído no projeto:
```
VITE_API_URL=http://localhost:8001
```

📌 Ajuste conforme a URL do backend.

## 4️⃣ Rodar em modo desenvolvimento
```
npm run dev
```
Aplicação rodando em:
```
http://localhost:5173
```

## 🌐 Telas Principais

🐄 **Animais — cadastro, edição e listagem**
🥛 **Produção de Leite — formulários completos**
💰 **Lucros — receitas e valores automáticos**
📉 **Despesas — classificação por prioridade**
📊 **Dashboard — visão geral (roadmap)**
🔐 **Autenticação — login e registro**

## 🔗 Integração com Backend
A comunicação é feita via Axios, através do arquivo:
```
src/lib/http.js
```
Exemplo:
```
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});
```

## 🤝 Contribuição
Contribuições são bem-vindas!
Antes de enviar um PR:

1. Crie uma branch:
```
git checkout -b feature/minha-feature
```
2. Faça suas alterações
3. Rode os testes (quando disponíveis)
4. Abra um Pull Request bem descrito

📣 Observação

Este projeto integra-se totalmente ao backend System Milk:
➡️ **https://github.com/ArtJord/system-milk**












