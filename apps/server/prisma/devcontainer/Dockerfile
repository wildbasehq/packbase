FROM postgres:16

# Environment variables for database configuration
# These can be overridden when running the container
ENV POSTGRES_DB=postgres
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres

# Create a directory for initialization scripts
RUN mkdir -p /docker-entrypoint-initdb.d

# Add a healthcheck to verify the database is ready
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB} || exit 1

# Expose PostgreSQL port
EXPOSE 5432

# The official postgres image handles the rest via its entrypoint