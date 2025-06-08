FROM python:3.13-alpine

WORKDIR /app

COPY node-monitor.py /app
COPY requirements.txt /app

RUN pip install --no-cache-dir -r requirements.txt

ENV K8S_NODE=node
ENV DELAY_THRESHOLD_MS=100
ENV PACKET_LOSS_THRESHOLD=3

CMD ["python", "node-monitor.py"]