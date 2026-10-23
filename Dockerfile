# 1. Build du front : produit les fichiers statiques dans /front/dist
FROM node:22-alpine AS front
WORKDIR /front
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2. Build du back : le front buildé est copié dans les ressources statiques, Spring Boot le sert à la racine
FROM maven:3.9-eclipse-temurin-21 AS back
WORKDIR /back
COPY backend/pom.xml ./
RUN mvn -q dependency:go-offline
COPY backend/src ./src
COPY --from=front /front/dist ./src/main/resources/static
RUN mvn -q -DskipTests package

# 3. Image finale : uniquement le JRE et le jar
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=back /back/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
