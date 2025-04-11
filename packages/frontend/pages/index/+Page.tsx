import { useEffect, useState } from 'react'
import { hc, InferResponseType } from 'hono/client'
import { BackendAppType, SocketType } from '@remocon/backend'
import { Container, Group, Button, Stack, Paper, Title, Text, ActionIcon } from '@mantine/core'
import { io, Socket } from 'socket.io-client'
import { RefreshCcw } from 'lucide-react'

const client = hc<BackendAppType>(typeof window !== 'undefined' ? location.origin : '');

const $getScenes = client.api.obs.scenes.$get;
type Scenes = InferResponseType<typeof $getScenes>;

export default function App() {
  const [activeScene, setActiveScene] = useState<string | null>(null)

  const [isReconnecting, setIsReconnecting] = useState(false)
  const [obsStatus, setObsStatus] = useState<{ connected: boolean; message: string }>({ connected: false, message: '未接続' })
  const [socket, setSocket] = useState<Socket<SocketType.ServerToClientEvents, SocketType.ClientToServerEvents> | null>(null)
  const [scenes, setScenes] = useState<Scenes>([])

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
    <Container size="sm" py="md">
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
            <Title order={3}>シーン切り替え</Title>
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
      </Stack>
    </Container>
  )
}
