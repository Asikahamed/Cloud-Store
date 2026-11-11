# ==========================================
# Frontend Presentation Tier Dockerfile
# Lightweight Nginx Alpine Runtime
# ==========================================
FROM nginx:1.25-alpine

# Set default backend upstream (can be overridden via environment variable)
ENV BACKEND_URL=http://my-java-app:8080

# Remove default configuration and HTML
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Copy Nginx template and fallback configuration
COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY nginx.conf /etc/nginx/nginx.conf

# Copy static presentation tier files
COPY . /usr/share/nginx/html/

# Remove non-HTML/build files from web root
RUN rm -f /usr/share/nginx/html/Dockerfile /usr/share/nginx/html/nginx.conf /usr/share/nginx/html/nginx.conf.template

# Expose standard HTTP port
EXPOSE 80

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/health || exit 1

# Substitute environment variables into Nginx config and start
CMD ["/bin/sh", "-c", "envsubst '${BACKEND_URL}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && exec nginx -g 'daemon off;'"]
