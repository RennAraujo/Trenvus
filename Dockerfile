# Build stage
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy JAR
COPY --from=build /app/target/*.jar app.jar

# JVM options for container environment
# -Xmx768m: aumentado de 512m para evitar OOM durante startup
# -XX:+UseContainerSupport: detecta limites de memória do container
# -XX:MaxRAMPercentage: usa até 75% da memória disponível
ENV JAVA_OPTS="-Xmx768m -Xms256m -XX:+UseContainerSupport -XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom -Dspring.main.banner-mode=off"

EXPOSE 8080

# Health check - aumentado start-period para 120s (Spring Boot pode demorar)
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
  CMD curl -fsS http://localhost:8080/actuator/health | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["sh", "-c", "echo 'Starting Trenvus Backend...' && java $JAVA_OPTS -jar app.jar"]
