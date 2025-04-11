import OBSWebSocket, { OBSEventTypes } from 'obs-websocket-js'
import { EventEmitter } from 'events'

// イベントの型定義
interface OBSControllerEvents {
  connectionChanged: (connected: boolean) => void;
  sceneChanged: (scene: OBSEventTypes["CurrentProgramSceneChanged"]) => void;
}

// EventEmitterに型パラメータを追加
export class OBSController extends EventEmitter {
  // TypeScriptの型システムにイベントを登録
  declare emit: <K extends keyof OBSControllerEvents>(
    event: K,
    ...args: Parameters<OBSControllerEvents[K]>
  ) => boolean;

  declare on: <K extends keyof OBSControllerEvents>(
    event: K,
    listener: OBSControllerEvents[K]
  ) => this;

  declare once: <K extends keyof OBSControllerEvents>(
    event: K,
    listener: OBSControllerEvents[K]
  ) => this;

  private url: string
  private obs: OBSWebSocket
  private isConnected: boolean = false

  constructor({ url }: { url: string }) {
    super()
    this.obs = new OBSWebSocket()
    this.url = url;

    // 接続切断時のイベント
    this.obs.on('ConnectionClosed', () => {
      this.isConnected = false
      this.emit('connectionChanged', false)
    });

    // シーン切り替え時のイベント
    this.obs.on('CurrentProgramSceneChanged', (data) => {
      this.emit('sceneChanged', data)
    })
  }

  async connect(override: boolean = false) {
    if (this.isConnected && !override) {
      return true
    }

    if (this.isConnected) {
      await this.obs.disconnect()
    }

    try {
      await this.obs.connect(this.url);

      this.isConnected = true
      this.emit('connectionChanged', true)
      console.log('OBSに接続しました')
      return true
    } catch (error) {
      console.error('OBSへの接続に失敗しました:', error)
      this.isConnected = false
      this.emit('connectionChanged', false)
      return false
    }
  }

  getConnectionStatus() {
    return this.isConnected
  }

  async getScenes() {
    if (!this.isConnected) {
      console.error('OBSに接続されていません')
      return []
    }

    try {
      const { scenes } = await this.obs.call('GetSceneList')
      return scenes as {
        sceneIndex: number
        sceneName: string
        sceneUuid: string
      }[];
    } catch (error) {
      console.error('シーンの取得に失敗しました:', error)
      return []
    }
  }

  async setScene({ sceneUuid, sceneName }: { sceneUuid: string, sceneName: string }) {
    if (!this.isConnected) {
      console.error('OBSに接続されていません')
      return
    }

    try {
      await this.obs.call('SetCurrentProgramScene', { sceneUuid })
      console.log(`シーンを ${sceneName} に切り替えました`)
    } catch (error) {
      console.error('シーンの切り替えに失敗しました:', error)
    }
  }

  async getSceneItemId(sceneName: string, itemName: string): Promise<number | null> {
    if (!this.isConnected) {
      console.error('OBSに接続されていません')
      return null
    }

    try {
      const { sceneItems } = await this.obs.call('GetSceneItemList', { sceneName })
      const item = sceneItems.find(item => item.sourceName === itemName)
      return item ? Number(item.sceneItemId) : null
    } catch (error) {
      console.error('シーンアイテムの取得に失敗しました:', error)
      return null
    }
  }

  async getItemEnabled(sceneName: string, itemName: string) {
    if (!this.isConnected) {
      console.error('OBSに接続されていません')
      return false
    }

    try {
      const sceneItemId = await this.getSceneItemId(sceneName, itemName)
      if (sceneItemId === null) {
        console.error(`アイテム ${itemName} が見つかりませんでした`)
        return false
      }

      const { sceneItemEnabled } = await this.obs.call('GetSceneItemEnabled', {
        sceneName,
        sceneItemId
      })
      console.log(`シーンアイテム ${itemName} の状態: ${sceneItemEnabled}`)
      return sceneItemEnabled
    } catch (error) {
      console.error('シーンアイテムの状態取得に失敗しました:', error)
      return false
    }
  }

  async setItemEnabled(sceneName: string, itemName: string, enabled: boolean) {
    if (!this.isConnected) {
      console.error('OBSに接続されていません')
      return false
    }

    try {
      const sceneItemId = await this.getSceneItemId(sceneName, itemName)
      if (sceneItemId === null) {
        console.error(`アイテム ${itemName} が見つかりませんでした`)
        return false
      }

      await this.obs.call('SetSceneItemEnabled', {
        sceneName,
        sceneItemId,
        sceneItemEnabled: enabled
      })
      console.log(`シーンアイテム ${itemName} を ${enabled ? '表示' : '非表示'} に設定しました`)
      return true
    } catch (error) {
      console.error('シーンアイテムの状態設定に失敗しました:', error)
      return false
    }
  }

  async triggerTransition() {
    if (!this.isConnected) {
      console.error('OBSに接続されていません')
      return
    }
    
    try {
      await this.obs.call('TriggerStudioModeTransition');
    } catch (error) {
      console.error('トランジションの開始に失敗しました:', error)
    }
  }
} 
