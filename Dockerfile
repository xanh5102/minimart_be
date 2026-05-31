# MiniMart API
# node:20 (glibc) so the native bcrypt module installs from prebuilt binaries
# without needing build tools (alpine/musl would force a source build).
FROM node:20

WORKDIR /app

# Install deps first for better layer caching.
# npm ci uses package-lock.json and installs devDeps too (nodemon for live reload).
COPY package*.json ./
RUN npm ci

# Copy the rest so the image is runnable on its own.
# In docker-compose the source is overlaid by a bind-mount for live reload,
# while node_modules stays the Linux build from the step above.
COPY . .

EXPOSE 2800

CMD ["npm", "start"]
