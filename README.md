# Sistema LRX - Backend
Frontend do novo sistema que será gerenciar os sistema do LRX.

# Iniciando o projeto

1. Instale as dependencias com `npm install`.
2. Configure os dados do .env usando como referência o .env.example
3. Configure o banco de dados
4. Faça a migração com
```bash
adonis migration:run
```

5. Popule o banco de dados com os dados iniciais usando
```bash
adonis seed --files="GlobalSeeder.js"
```

6. Execute o projeto com
```bash
adonis serve --dev
```

### Make
Migration, Model e Controller

```bash
adonis make:model Property -m -c
```

