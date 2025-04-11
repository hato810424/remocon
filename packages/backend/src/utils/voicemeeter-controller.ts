import { Voicemeeter, StripProperties } from "voicemeeter-connector";
import { EventEmitter } from 'events'

// イベントの型定義
interface VoicemeeterControllerEvents {
  connectionChanged: (connected: boolean) => void;
  parameterChanged: () => void;
}

// EventEmitterに型パラメータを追加
export class VoicemeeterController extends EventEmitter {
  // TypeScriptの型システムにイベントを登録
  declare emit: <K extends keyof VoicemeeterControllerEvents>(
    event: K,
    ...args: Parameters<VoicemeeterControllerEvents[K]>
  ) => boolean;

  declare on: <K extends keyof VoicemeeterControllerEvents>(
    event: K,
    listener: VoicemeeterControllerEvents[K]
  ) => this;

  declare once: <K extends keyof VoicemeeterControllerEvents>(
    event: K,
    listener: VoicemeeterControllerEvents[K]
  ) => this;

  private vm: Voicemeeter | null = null
  private isConnected: boolean = false

  constructor() {
    super()
  }

  async connect(override: boolean = false) {
    if (this.isConnected && !override) {
      return true
    }

    if (this.isConnected) {
      this.vm?.disconnect()
    }

    try {
      this.vm = await Voicemeeter.init()
      this.vm.connect()

      // パラメータ変更時のイベント
      this.vm.attachChangeEvent(() => {
        this.emit('parameterChanged')
      })

      this.isConnected = true
      this.emit('connectionChanged', true)
      console.log('Voicemeeterに接続しました')
      return true
    } catch (error) {
      console.error('Voicemeeterへの接続に失敗しました:', error)
      this.isConnected = false
      this.emit('connectionChanged', false)
      return false
    }
  }

  getConnectionStatus() {
    return this.isConnected
  }

  async setStripGain(stripIndex: number, gain: number) {
    if (!this.isConnected || !this.vm) {
      console.error('Voicemeeterに接続されていません')
      return false
    }

    try {
      await this.vm.setStripParameter(stripIndex, StripProperties.Gain, gain)
      return true
    } catch (error) {
      console.error('ゲインの設定に失敗しました:', error)
      return false
    }
  }

  getStripGain(stripIndex: number) {
    if (!this.isConnected || !this.vm) {
      console.error('Voicemeeterに接続されていません')
      return null
    }

    try {
      return this.vm.getStripParameter(stripIndex, StripProperties.Gain)
    } catch (error) {
      console.error('ゲインの取得に失敗しました:', error)
      return null
    }
  }
} 
