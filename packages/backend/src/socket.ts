import { Server } from "socket.io";
import { type ServerType } from "@hono/node-server";
import { OBSController } from "./utils/obs-controller";
import { OBSEventTypes } from "obs-websocket-js";
import { VoicemeeterController } from "./utils/voicemeeter-controller";

export namespace SocketType {
  export interface ServerToClientEvents {
    obsStatus: (connected: boolean) => void;
    vmStatus: (connected: boolean) => void;
    sceneChanged: (scene: OBSEventTypes["CurrentProgramSceneChanged"]) => void;
    gainChanged: (data: { stripIndex: number, gain: number }) => void;
  }

  export interface ClientToServerEvents {
    // OBS
    requestOBSReconnect: () => void;
    requestVMReconnect: () => void;
    requestTransition: () => void;
    requestSceneChange: ({ sceneUuid, sceneName }: { sceneUuid: string, sceneName: string }) => void;
    
    // Voicemeeter
    requestVoicemeeterGainChange: (data: { stripIndex: number, gain: number }) => void;
  }

  export interface InterServerEvents {
    //
  }

  export interface SocketData {
    //
  }
}

export default ({ server, obsController, voicemeeterController }: { 
  server: ServerType, 
  obsController: OBSController,
  voicemeeterController: VoicemeeterController
}) => {
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

  voicemeeterController.on('connectionChanged', (connected: boolean) => {
    io.emit('vmStatus', connected);
  });

  voicemeeterController.on('parameterChanged', () => {
    // 必要に応じてパラメータ変更時の処理を追加
  });

  io.on("connection", (socket) => {
    socket.emit('obsStatus', obsController.getConnectionStatus());
    socket.emit('vmStatus', voicemeeterController.getConnectionStatus());

    socket.on('requestOBSReconnect', () => {
      if (obsController.getConnectionStatus()) {
        socket.emit('obsStatus', true);
        return;
      }

      obsController.connect();
    });

    socket.on('requestVMReconnect', () => {
      if (voicemeeterController.getConnectionStatus()) {
        socket.emit('vmStatus', true);
        return;
      }

      voicemeeterController.connect();
    });

    socket.on('requestTransition', () => {
      obsController.triggerTransition();
    });

    socket.on('requestSceneChange', ({ sceneUuid, sceneName }) => {
      obsController.setScene({ sceneUuid, sceneName });
    });

    socket.on('requestVoicemeeterGainChange', async ({ stripIndex, gain }) => {
      await voicemeeterController.setStripGain(stripIndex, gain);
      io.emit('gainChanged', { stripIndex, gain });
    });
  });

  return io;
};
