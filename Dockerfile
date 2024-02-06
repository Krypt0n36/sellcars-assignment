FROM node:latest as build



# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json files
COPY backend/package*.json ./backend/
COPY webapp/package*.json ./webapp/

# Install backend and frontend dependencies
RUN cd backend && npm install
RUN cd webapp && npm install

# Copy the backend and frontend code
COPY ./backend ./backend
COPY ./webapp ./webapp

# Build the Vue.js frontend
RUN cd webapp && npm run build
RUN cd webapp && cp -R dist/ ../backend/public
# Populate database
COPY ./data-populator ./backend/data-populator
# Expose backend port
EXPOSE 3000
# Start the Node.js server
CMD ["sh", "backend/entrypoint.sh"]