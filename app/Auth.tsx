import { StyleSheet, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Button, TextInput, Text } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { createAnonymousSession, getAccount, updateAccountName } from '../lib/appwriteClient'

const AUTH_STORAGE_KEY = 'authUser'

const Auth = () => {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const restoreSession = async () => {
      const saved = await AsyncStorage.getItem(AUTH_STORAGE_KEY)
      if (!saved) {
        return
      }

      let auth
      try {
        auth = JSON.parse(saved)
      } catch {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY)
        return
      }

      if (!auth?.name) {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY)
        return
      }

      try {
        const accountData = await getAccount()
        if (accountData?.name !== auth.name) {
          await updateAccountName(auth.name)
        }
        router.replace('/')
        return
      } catch {
        // no active session, create an anonymous one
      }

      try {
        await createAnonymousSession()
        await updateAccountName(auth.name)
        router.replace('/')
      } catch {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY)
      }
    }

    restoreSession()
  }, [router])

  const onSignIn = async () => {
    const cleanedName = name.trim()
    if (!cleanedName) {
      setMessage('Enter your name to continue.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      await createAnonymousSession()
      await updateAccountName(cleanedName)
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ name: cleanedName }))
      router.replace('/')
    } catch (error: any) {
      setMessage(error?.message || 'Unable to log in anonymously.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Verze</Text>
      <TextInput
        label="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <Button mode="contained" onPress={onSignIn} loading={loading} style={styles.button}>
        Continue
      </Button>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  )
}

export default Auth

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  message: {
    marginTop: 16,
    textAlign: 'center',
  },
})
