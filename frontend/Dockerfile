# DNS Shield — Frontend (painel estático servido por nginx)
FROM nginx:alpine
COPY . /usr/share/nginx/html
# Remove o Dockerfile da pasta servida (não é conteúdo web).
RUN rm -f /usr/share/nginx/html/Dockerfile
EXPOSE 80
