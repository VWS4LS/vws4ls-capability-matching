FROM nodered/node-red

WORKDIR /data

# Install the capability-check node
COPY capability-check /data/capability-check
COPY capability-check-node-red /data/capability-check-node-red
RUN npm install /data/capability-check-node-red

WORKDIR /usr/src/node-red
