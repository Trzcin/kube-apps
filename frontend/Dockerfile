FROM nginx:alpine

COPY . . 

RUN apk add --update nodejs npm

RUN npm ci

RUN npm run build

RUN cp -r build/* /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]