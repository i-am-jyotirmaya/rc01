param(
    [string]$Action = "start"
)

switch ($Action.ToLower()) {
    "start" {
        Write-Host "Starting postgres container..."
        docker compose -f 'docker-compose.yml' up -d --build 'postgres'
    }
    "stop" {
        Write-Host "Stopping postgres container..."
        docker compose -f 'docker-compose.yml' stop 'postgres'
    }
    default {
        Write-Host "Unknown action '$Action'. Defaulting to start."
        docker compose -f 'docker-compose.yml' up -d --build 'postgres'
    }
} 