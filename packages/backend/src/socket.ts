import { Server } from "socket.io";
import { type ServerType } from "@hono/node-server/.";

export default (server: ServerType) => {
  const io = new Server(server, {
    serveClient: false,
  });

  io.on("connection", (socket) => {
    console.log("a user connected");
  });

  return io;
};
