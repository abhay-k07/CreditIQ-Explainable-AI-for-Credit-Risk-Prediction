FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY model/ ./model/
COPY backend/ ./backend/
COPY artifacts/ ./artifacts/
COPY data/ ./data/

WORKDIR /app/backend

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
