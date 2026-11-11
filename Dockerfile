# ==========================================
# Stage 1: Build Application (JDK Runtime)
# ==========================================
FROM maven:3.9.9-eclipse-temurin-17-alpine AS builder

WORKDIR /workspace

# Cache Maven dependencies by copying pom.xml first
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy application source code and compile packaged artifact
COPY src ./src
RUN mvn clean package -DskipTests -B

# ==========================================
# Stage 2: Production Runtime (JRE Runtime)
# ==========================================
FROM eclipse-temurin:17-jre-alpine AS runtime

# Install curl for container health checks
RUN apk add --no-cache curl

# Create non-root user and group for security compliance
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy executable jar from builder stage
COPY --from=builder /workspace/target/demo-1.0.0-SNAPSHOT.jar app.jar

# Set file permissions for the unprivileged user
RUN chown -R appuser:appgroup /app

# Run container as non-root
USER appuser

# Expose default application port
EXPOSE 8080

# Environment variables with sensible defaults
ENV PORT=8080 \
    JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

# Healthcheck probe using Spring Boot Actuator
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${PORT}/actuator/health/liveness || exit 1

ENTRYPOINT ["sh", "-c", "exec java ${JAVA_OPTS} -jar app.jar"]
