FROM python:3.13-slim

WORKDIR /app

COPY node-monitor.py /app
COPY requirements.txt /app

RUN pip install --no-cache-dir -r requirements.txt

ENV K8S_NODE=node

CMD ["python", "node-monitor.py"]