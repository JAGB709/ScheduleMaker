# Usa una imagen oficial de Node.js como base.
# Se recomienda usar la versión LTS (Long Term Support) más reciente.
FROM node:20-alpine AS base

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de definición de dependencias
COPY package*.json ./

# Instala las dependencias del proyecto
RUN npm install

# Copia el resto de los archivos de la aplicación
COPY . .

# Construye la aplicación para producción
RUN npm run build

# Expone el puerto en el que se ejecuta la aplicación Next.js
EXPOSE 3000

# El comando para iniciar la aplicación en producción
CMD ["npm", "start"]
