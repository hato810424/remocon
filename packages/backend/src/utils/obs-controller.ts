import OBSWebSocket from 'obs-websocket-js'
import { EventEmitter } from 'events'

// イベントの型定義
interface OBSControllerEvents {
  connectionChanged: (connected: boolean) => void;
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
      this.obs.once('ConnectionClosed', () => {
        this.isConnected = false
        this.emit('connectionChanged', false)  // 接続切断を通知
      });

      this.isConnected = true
      this.emit('connectionChanged', true)  // 接続成功を通知
      console.log('OBSに接続しました')
      return true  // 接続成功を返す
    } catch (error) {
      console.error('OBSへの接続に失敗しました:', error)
      this.isConnected = false
      this.emit('connectionChanged', false)  // 接続失敗を通知
      return false  // 接続失敗を返す
    }
  }

  getConnectionStatus() {
    return this.isConnected
  }

  async setScene(sceneName: string) {
    if (!this.isConnected) {
      console.error('OBSに接続されていません')
      return
    }

    try {
      await this.obs.call('SetCurrentProgramScene', { sceneName })
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
