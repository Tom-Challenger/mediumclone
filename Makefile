.PHONY: pgPull pgRun show
# Ручная установка  базы Postgres и работа через cli

# Скачивание образа из DockerHub
pgPull:
	docker pull postgres

# Запуск контейнера
pgRun:
	docker run --name=mediumclone-db -e POSTGRES_PASSWORD='qwerty' -p 5432:5432 -d --rm postgres

# Посмотреть список запущенных контейнеров
show:
	docker ps

# Подключиться к контенеру в интерактивном режиме
# Пример использования: > make exec c=1234567890
#
# Посмотреть таблицу базы данных
# > psql -U postgres
# postgres> \d
#
# exit exit
exec:
	docker exec -it $(c) /bin/bash

dcUp:
	docker-compose up

dcDw:
	docker-compose down

