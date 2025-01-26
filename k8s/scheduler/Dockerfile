FROM golang:1.23-alpine as builder

WORKDIR /app

COPY . .

RUN go build -o packetloss-scheduler main.go

# Minimal image for runtime
FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/packetloss-scheduler /app/packetloss-scheduler

ENTRYPOINT ["/app/packetloss-scheduler"]