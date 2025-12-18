FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
COPY mvnw ./
COPY .mvn .mvn
RUN chmod +x mvnw
COPY pom.xml .
RUN ./mvnw -q -DskipTests dependency:go-offline
COPY src ./src
RUN ./mvnw -q -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENV PORT=8080
EXPOSE 8080
CMD ["sh","-c","java -Dserver.port=${PORT} -jar app.jar"]
