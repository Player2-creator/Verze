import { Alert, StyleSheet, View, Text, TextInput, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Button, Card } from 'react-native-paper'
import * as ImagePicker from 'expo-image-picker'
import { createAnonymousSession, createPost, getAccount, updateAccountName } from '../lib/appwriteClient'
import { useRouter } from 'expo-router'
import { useIsFocused } from '@react-navigation/native'


const AUTH_STORAGE_KEY = 'authUser'

const Create = () => {
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [title, setTitle] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [authorName, setAuthorName] = useState<string>('')
  const [authChecked, setAuthChecked] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState<boolean>(false)
  const router = useRouter()
  const isFocused = useIsFocused()

  const openImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library.')
      return
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    })

    const selectedUri =
      pickerResult.assets?.[0]?.uri ??
      (pickerResult as any).uri ??
      null

    const cancelled = pickerResult.canceled ?? (pickerResult as any).cancelled

    if (!cancelled && selectedUri) {
      setImageUri(selectedUri)
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      const saved = await AsyncStorage.getItem(AUTH_STORAGE_KEY)
      if (!saved) {
        setAuthChecked(true)
        router.replace('/Auth')
        return
      }

      let auth
      try {
        auth = JSON.parse(saved)
      } catch {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY)
        setAuthChecked(true)
        router.replace('/Auth')
        return
      }

      if (!auth?.name) {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY)
        setAuthChecked(true)
        router.replace('/Auth')
        return
      }

      setAuthorName(auth.name)

      try {
        await getAccount()
        setAuthorized(true)
      } catch {
        try {
          await createAnonymousSession()
          await updateAccountName(auth.name)
          setAuthorized(true)
        } catch {
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY)
          setAuthChecked(true)
          router.replace('/Auth')
          return
        }
      } finally {
        setAuthChecked(true)
      }
    }

    if (isFocused) {
      setAuthChecked(false)
      setAuthorized(false)
      checkAuth()
    }
  }, [isFocused, router])

  if (!authChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Checking auth...</Text>
      </View>
    )
  }

  if (!authorized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Redirecting...</Text>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 10 }} >
    <View style={{ flex: 1, padding: 20 }}>
      <Card style={{ margin: 20, padding: 20 }}>
        <Card.Title title="Create Post" subtitle={authorName ? `Author: ${authorName}` : undefined} />
        {imageUri ? <Card.Cover source={{ uri: imageUri }} /> : null}
        <Card.Actions>
            <Button loading={loading} disabled={!authorName || loading} onPress={async () => {
              try {
                setLoading(true)
                await createPost({ title, description, imageUri, authorName })
                Alert.alert('Success', 'Post created')
                setTitle('')
                setDescription('')
                setImageUri(null)
                try {
                  router.push('/')
                } catch {}
              } catch (err: any) {
                Alert.alert('Error', err.message || String(err))
              } finally {
                setLoading(false)
              }
            }}>Create Post</Button>
        </Card.Actions>
      </Card>
      <Button style={{ margin: 20, borderStyle: 'solid', borderWidth: 1, borderColor: '#000' }} onPress={openImagePicker}>
        Add File
      </Button>
      <Text style={{ fontSize: 41, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', fontFamily: 'MS Sans Serif' }}>Title:</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Enter post title"
        style={{
          borderWidth: 1,
          padding: 10,
          marginBottom: 20
        }}
      />
      <Text style={{ fontSize: 41, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', fontFamily: 'MS Sans Serif' }}>Description:</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Enter post description"
        style={{
          borderWidth: 1,
          padding: 10,
          marginBottom: 20
        }}
        multiline
      />
    </View>
    </ScrollView>
  )
}

export default Create

const styles = StyleSheet.create({

})