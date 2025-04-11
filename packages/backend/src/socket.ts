import { Server } from "socket.io";
import { type ServerType } from "@hono/node-server";
import { OBSController } from "./utils/obs-controller";
import { OBSEventTypes } from "obs-websocket-js";

export namespace SocketType {
  export interface ServerToClientEvents {
    obsStatus: (connected: boolean) => void;
    sceneChanged: (scene: OBSEventTypes["CurrentProgramSceneChanged"]) => void;
  }

  export interface ClientToServerEvents {
    requestOBSReconnect: () => void;
    requestTransition: () => void;
    requestSceneChange: ({ sceneUuid, sceneName }: { sceneUuid: string, sceneName: string }) => void;
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

  obsController.on('sceneChanged', (scene) => {
    io.emit('sceneChanged', scene);
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

    socket.on('requestTransition', () => {
      obsController.triggerTransition();
    });

    socket.on('requestSceneChange', ({ sceneUuid, sceneName }) => {
      obsController.setScene({ sceneUuid, sceneName });
    });
  });

  return io;
};
