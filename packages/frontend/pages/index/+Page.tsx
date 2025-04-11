import { useEffect, useState, memo, useCallback, useMemo } from 'react'
import { hc, InferResponseType } from 'hono/client'
import { BackendAppType, SocketType } from '@remocon/backend'
import { Container, Group, Button, Stack, Paper, Title, Text, ActionIcon, Slider, Switch } from '@mantine/core'
import { io, Socket } from 'socket.io-client'
import { RefreshCcw, Lock, LockOpen } from 'lucide-react'

const client = hc<BackendAppType>(typeof window !== 'undefined' ? location.origin : '');

const $getScenes = client.api.obs.scenes.$get;
type Scenes = InferResponseType<typeof $getScenes>;

// スライダーコンポーネントを分離してメモ化
const GainSlider = memo(({ 
  index, 
  gain, 
  locked, 
  onGainChange, 
  onLockToggle 
}: { 
  index: number
  gain: number
  locked: boolean
  onGainChange: (value: number, index: number) => void
  onLockToggle: (index: number) => void
}) => {
  // イベントハンドラをメモ化
  const handleChange = useCallback((value: number) => {
    if (!locked) onGainChange(value, index)
  }, [locked, index, onGainChange])

  const handleLockClick = useCallback(() => {
    onLockToggle(index)
  }, [index, onLockToggle])

  return (
    <div>
      <Group justify="space-between" align="center" mb={8}>
        <Text size="sm">Strip {index + 1}</Text>
        <Group gap="xs">
          <Text size="xs" c="dimmed">ロック</Text>
          <ActionIcon
            variant="subtle"
            color={locked ? "red" : "gray"}
            onClick={handleLockClick}
            title={locked ? "ロック解除" : "ロック"}
          >
            {locked ? <Lock size={16} /> : <LockOpen size={16} />}
          </ActionIcon>
        </Group>
      </Group>
      <Slider
        value={gain}
        onChange={handleChange}
        min={-60}
        max={12}
        step={0.1}
        label={(value) => `${value.toFixed(1)} dB`}
        marks={[
          { value: -60, label: '-60dB' },
          { value: -30, label: '-30dB' },
          { value: 0, label: '0dB' },
          { value: 12, label: '+12dB' },
        ]}
        size="lg"
        mb="lg"
        px="md"
        disabled={locked}
        styles={(theme) => ({
          track: {
            backgroundColor: locked 
              ? theme.colors.red[1] 
              : undefined
          },
          thumb: {
            borderColor: locked 
              ? theme.colors.red[6] 
              : undefined
          }
        })}
      />
    </div>
  )
})

GainSlider.displayName = 'GainSlider'

export default function App() {
  const [activeScene, setActiveScene] = useState<string | null>(null)

  const [isReconnecting, setIsReconnecting] = useState(false)
  const [obsStatus, setObsStatus] = useState<{ connected: boolean; message: string }>({ connected: false, message: '未接続' })
  const [socket, setSocket] = useState<Socket<SocketType.ServerToClientEvents, SocketType.ClientToServerEvents> | null>(null)
  const [scenes, setScenes] = useState<Scenes>([])
  const [strips, setStrips] = useState<Array<{
    gain: number,
    locked: boolean
  }>>(Array(3).fill({ gain: 0, locked: true }));

  const handleSceneChange = (sceneUuid: string) => {
    setActiveScene(sceneUuid)
    socket?.emit('requestSceneChange', { sceneUuid, sceneName: scenes.find(scene => scene.sceneUuid === sceneUuid)?.sceneName || '' })
  }

  const handleReconnect = () => {
    setIsReconnecting(true)
    socket?.emit('requestOBSReconnect')
  }

  const handleTransition = () => {
    socket?.emit('requestTransition')
  }

  // イベントハンドラをメモ化
  const handleGainChange = useCallback(async (value: number, stripIndex: number) => {
    socket?.emit('requestVoicemeeterGainChange', { stripIndex, gain: value });
    
    setStrips(prev => prev.map((strip, i) => 
      i === stripIndex ? { ...strip, gain: value } : strip
    ));
  }, [socket]);

  const handleLockToggle = useCallback((stripIndex: number) => {
    setStrips(prev => prev.map((strip, i) => 
      i === stripIndex ? { ...strip, locked: !strip.locked } : strip
    ));
  }, []);

  // スライダー部分のレンダリング
  const gainSliders = useMemo(() => (
    strips.map((strip, index) => (
      <GainSlider
        key={index}
        index={index}
        gain={strip.gain}
        locked={strip.locked}
        onGainChange={handleGainChange}
        onLockToggle={handleLockToggle}
      />
    ))
  ), [strips, handleGainChange, handleLockToggle]);

  useEffect(() => {
    const fetchScenes = async () => {
      const scenes = await (await client.api.obs.scenes.$get()).json();
      setScenes(scenes);
    }
    
    fetchScenes()
    // WebSocketで接続状態が変わった時にも再取得
    socket?.on('obsStatus', (connected) => {
      if (connected) fetchScenes()
    })
  }, [socket])

  useEffect(() => {
    const newSocket: Socket<SocketType.ServerToClientEvents, SocketType.ClientToServerEvents> = io({ transports: ["websocket"] })
    setSocket(newSocket)

    newSocket.on('obsStatus', (connected) => {
      setObsStatus({ connected, message: connected ? '接続' : '未接続' })
      setIsReconnecting(false)
    })

    newSocket.on('sceneChanged', (scene) => {
      setActiveScene(scene.sceneUuid)
    })

    return () => {
      newSocket.disconnect()
    }
  }, [])

  return (
    <Container size="md" p="sm">
      <Stack gap="md">
        <Paper shadow="sm" px="md" py="xs" withBorder>
          <Group justify="space-between" align="center">
            <Text size="sm" c={obsStatus.connected ? 'green' : 'red'}>
              OBS: {obsStatus.message}
            </Text>
            {!obsStatus.connected && (
              <ActionIcon 
                variant="subtle" 
                color="gray" 
                onClick={handleReconnect}
                title="再接続"
                loading={isReconnecting}
              >
                <RefreshCcw size={16} />
              </ActionIcon>
            )}
          </Group>
        </Paper>
        
        <Paper shadow="sm" p="md" withBorder>
          <Stack gap="sm">
            <Title order={3}>OBS シーン切り替え</Title>
            <Button mb="md" variant="outline" onClick={handleTransition}>トランジション</Button>
            <Group gap="sm">
              {scenes.map(scene => {
                const isStandbyScene = scene.sceneName.includes('待機')
                return (
                  <Button
                    key={scene.sceneUuid}
                    variant={activeScene === scene.sceneUuid ? 'filled' : 'light'}
                    onClick={() => handleSceneChange(scene.sceneUuid)}
                    size="md"
                    color={isStandbyScene ? 'red' : 'blue'}
                    style={isStandbyScene ? { border: '2px solid #ccc' } : {}}
                  >
                    {scene.sceneName}
                  </Button>
                )
              })}
            </Group>
          </Stack>
        </Paper>

        <Paper shadow="sm" p="md" withBorder>
          <Stack gap="sm">
            <Title order={3}>Voicemeeter ゲイン調節</Title>
            {gainSliders}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
}
