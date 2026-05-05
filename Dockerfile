FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY model/ ./model/
COPY backend/ ./backend/
COPY artifacts/ ./artifacts/
COPY data/ ./data/


RUN python model/train.py

WORKDIR /app/backend

EXPOSE 7860

CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]