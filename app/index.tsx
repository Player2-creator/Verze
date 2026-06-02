import { StyleSheet, Text, View, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Button, Card, Paragraph } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { createAnonymousSession, getAccount, getPosts, logout, updateLikes } from '../lib/appwriteClient'
import { useIsFocused } from '@react-navigation/native'

const LIKE_STORAGE_KEY = 'likedPosts'
const AUTH_STORAGE_KEY = 'authUser'

const index = () => {
  const [posts, setPosts] = useState<any[]>([])
  const [likedIds, setLikedIds] = useState<string[]>([])
  const router = useRouter()

  const isFocused = useIsFocused()

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      const saved = await AsyncStorage.getItem(AUTH_STORAGE_KEY)
      if (!saved) {
        router.replace('/Auth')
        return false
      }

      const auth = JSON.parse(saved)
      if (!auth?.name) {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY)
        router.replace('/Auth')
        return false
      }

      try {
        await getAccount()
        return true
      } catch {
        try {
          await createAnonymousSession()
          return true
        } catch {
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY)
          router.replace('/Auth')
          return false
        }
      }
    }

    const loadLikes = async () => {
      try {
        const raw = await AsyncStorage.getItem(LIKE_STORAGE_KEY)
        const parsed = raw ? JSON.parse(raw) : []
        if (mounted && Array.isArray(parsed)) setLikedIds(parsed)
      } catch {
        // ignore storage errors
      }
    }

    const loadPosts = async () => {
      try {
        const docs = await getPosts()
        if (mounted) setPosts(docs)
      } catch (err) {
        // ignore for now
      }
    }

    const initialize = async () => {
      const authenticated = await checkAuth()
      if (authenticated) {
        loadLikes()
        loadPosts()
      }
    }

    initialize()

    return () => { mounted = false }
  }, [isFocused, router])

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 20 }}>
        {posts.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text>No posts yet</Text>
          </View>
        ) : (
          posts.map(p => (
            <Card key={p.$id} style={{ marginBottom: 10 }}>
              <Card.Title title={p.title} subtitle={p.authorName ? `by ${p.authorName}` : undefined} />
              {p.imageUrl ? <Card.Cover source={{ uri: p.imageUrl }} /> : null}
              <Card.Content>
                <Paragraph>{p.description}</Paragraph>
                <Paragraph style={{ marginTop: 8, fontWeight: 'bold' }}>Likes: {p.likes ?? 0}</Paragraph>
              </Card.Content>
              <Card.Actions>
                <Button
                  compact
                  icon="heart"
                  mode={likedIds.includes(p.$id) ? 'contained' : 'outlined'}
                  onPress={async () => {
                    try {
                      const isLiked = likedIds.includes(p.$id)
                      const delta = isLiked ? -1 : 1
                      const updated = await updateLikes(p.$id, p.likes ?? 0, delta)
                      setPosts(prev => prev.map(item => item.$id === p.$id ? updated : item))

                      const nextLikedIds = isLiked
                        ? likedIds.filter(id => id !== p.$id)
                        : [...likedIds, p.$id]

                      setLikedIds(nextLikedIds)
                      await AsyncStorage.setItem(LIKE_STORAGE_KEY, JSON.stringify(nextLikedIds))
                    } catch (err) {
                      // ignore for now
                    }
                  }}
                >
                  {likedIds.includes(p.$id) ? 'Unlike' : 'Like'}
                </Button>
              </Card.Actions>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  )
}

export default index

const styles = StyleSheet.create({})