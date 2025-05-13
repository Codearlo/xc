FROM node:18-alpine

WORKDIR /usr/src/app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar código fuente
COPY . .

# Crear directorios necesarios
RUN mkdir -p uploads

# Exponer puertos
EXPOSE 3000

# Inicializar la base de datos SQLite
RUN node src/db-sync.js

# Comando para iniciar la app
CMD ["npm", "start"]