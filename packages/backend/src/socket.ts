import { Server } from "socket.io";
import { type ServerType } from "@hono/node-server/.";
import { OBSController } from "./utils/obs-controller";

export namespace SocketType {
  export interface ServerToClientEvents {
    obsStatus: (connected: boolean) => void;
  }

  export interface ClientToServerEvents {
    requestOBSReconnect: () => void;
  }

  export interface InterServerEvents {
    //
  }

  export interface SocketData {
    //
  }
}

export default ({ server, obsController }: { server: ServerType, obsController: OBSController }) => {
  const io = new Server<
    SocketType.ClientToServerEvents,
    SocketType.ServerToClientEvents,
    SocketType.InterServerEvents,
    SocketType.SocketData
  >(server, {
    serveClient: false,
  });

  obsController.on('connectionChanged', (connected: boolean) => {
    io.emit('obsStatus', connected);
  });

  io.on("connection", (socket) => {
    socket.emit('obsStatus', obsController.getConnectionStatus());

    socket.on('requestOBSReconnect', () => {
      if (obsController.getConnectionStatus()) {
        socket.emit('obsStatus', true);
        return;
      }

      obsController.connect();
    });
  });

  return io;
};
