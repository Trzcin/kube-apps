FROM golang:1.23-alpine

WORKDIR /app

COPY . .

RUN go build -o packetloss-scheduler main.go

ENTRYPOINT ["/app/packetloss-scheduler"]