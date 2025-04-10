import { useEffect } from 'react'
import { hc } from 'hono/client'
import { BackendAppType } from '@remocon/backend'
import { Center, Container, Text } from '@mantine/core'

const client = hc<BackendAppType>(location.origin)

function App() {
  useEffect(() => {
    client.api.health.$get().then((res) => {
      console.log(res)
    })
  }, []);

  return (
    <Container py="md">
      <Center>
        <Text>HI 👋</Text>
      </Center>
    </Container>
  )
}

export default App
