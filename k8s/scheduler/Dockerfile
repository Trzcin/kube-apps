FROM golang:1.23-alpine

COPY . .

RUN go build -o packetloss-scheduler main.go

ENTRYPOINT ["/packetloss-scheduler"]