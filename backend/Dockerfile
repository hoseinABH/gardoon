FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

COPY src ./src
RUN ./mvnw clean package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

RUN addgroup -S gardoon && adduser -S gardoon -G gardoon
RUN mkdir -p /app/uploads/receipts && chown -R gardoon:gardoon /app

COPY --from=builder /app/target/*.jar app.jar
USER gardoon

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
