FROM python:3.10.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x entrypoint.sh

EXPOSE 8000

RUN useradd -m appuser

USER appuser


ENTRYPOINT ["./entrypoint.sh"]

