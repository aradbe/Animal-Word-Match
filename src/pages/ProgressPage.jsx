import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Container, Stack, Title, Text, Loader, Center, Card, Group} from '@mantine/core'
import { authStore } from '../stores/authStore'
import { gameResultService } from '../services'

const ProgressPage = observer(function Progressoage() {
  const [status, getStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [results, setResults] = useState([])

  useEffect(() => {
    let active = true

    async function load() {
      setStatus('loading')
      try {
        const data = await gameResultService.getUserProgress(authStore.user.id)
        if(active) {
          setResults(data)
          setStatus('ready')
        }
      } catch (err) {
        console.error('getUserProgress failed:', err)
        if(active) setStatus('error')
      }
    }

    load()
    return () => { active = false }
  }, [])

  

})



export default ProgressPage;