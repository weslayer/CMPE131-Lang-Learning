FROM python:3.9-slim

WORKDIR /app

# Copy and install other requirements
COPY /requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY /main.py .

CMD ["python", "main.py"] 