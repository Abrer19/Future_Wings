# Multi-stage build for FutureWings Web API
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY ["FutureWings.sln", "./"]
COPY ["src/FutureWings.Domain/FutureWings.Domain.csproj", "src/FutureWings.Domain/"]
COPY ["src/FutureWings.Application/FutureWings.Application.csproj", "src/FutureWings.Application/"]
COPY ["src/FutureWings.Infrastructure/FutureWings.Infrastructure.csproj", "src/FutureWings.Infrastructure/"]
COPY ["src/FutureWings.Web/FutureWings.Web.csproj", "src/FutureWings.Web/"]
COPY ["tests/FutureWings.Tests/FutureWings.Tests.csproj", "tests/FutureWings.Tests/"]

RUN dotnet restore "src/FutureWings.Web/FutureWings.Web.csproj"

# Copy the rest of the source code and publish
COPY . .
WORKDIR "/src/src/FutureWings.Web"
RUN dotnet publish "FutureWings.Web.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 5002
EXPOSE 7189
ENV ASPNETCORE_URLS=http://+:5002
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "FutureWings.Web.dll"]
