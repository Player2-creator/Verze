import Constants from 'expo-constants'
import { Client, Databases, ID, Storage, Account, Query } from 'react-native-appwrite'

const extra = (Constants.manifest && (Constants.manifest as any).extra) || (Constants.expoConfig && (Constants.expoConfig as any).extra) || {}

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || extra.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1'
const project = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || extra.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '6a1ccfee003c01f895cf'
const projectName = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_NAME || extra.EXPO_PUBLIC_APPWRITE_PROJECT_NAME || 'Verze'
const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || extra.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '6a1dc5d60039b7b270d6'
const collectionId = process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ID || extra.EXPO_PUBLIC_APPWRITE_COLLECTION_ID || 'users'
const userCollectionId = process.env.EXPO_PUBLIC_APPWRITE_USER_COLLECTION_ID || extra.EXPO_PUBLIC_APPWRITE_USER_COLLECTION_ID || collectionId
const bucketId = process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID || extra.EXPO_PUBLIC_APPWRITE_BUCKET_ID || '6a1dc682002e38da2322'

const client = new Client()
  .setEndpoint(String(endpoint))
  .setProject(String(project))

const databases = new Databases(client)
const storage = new Storage(client)
const account = new Account(client)

export async function getAccount() {
  return account.get()
}

export async function createAnonymousSession() {
  return account.createAnonymousSession()
}

export async function updateAccountName(name: string) {
  return account.updateName(name)
}

export async function isNameTaken(name: string) {
  if (!databaseId || !userCollectionId) {
    throw new Error('Missing EXPO_PUBLIC_APPWRITE_DATABASE_ID or EXPO_PUBLIC_APPWRITE_USER_COLLECTION_ID env var')
  }

  const nameQuery = [Query.equal('name', name)]
  const result = await databases.listDocuments(String(databaseId), String(userCollectionId), nameQuery)
  return (result.documents?.length || 0) > 0
}

export async function createUserDocument(name: string) {
  if (!databaseId || !userCollectionId) {
    throw new Error('Missing EXPO_PUBLIC_APPWRITE_DATABASE_ID or EXPO_PUBLIC_APPWRITE_USER_COLLECTION_ID env var')
  }

  const data = { name }
  return databases.createDocument(String(databaseId), String(userCollectionId), ID.unique(), data)
}

export async function logout() {
  return account.deleteSession('current')
}

async function uploadImageUri(uri: string) {
  if (!bucketId) throw new Error('Missing EXPO_PUBLIC_APPWRITE_BUCKET_ID env var')

  // Convert local uri to blob to get size/type, but pass an RN file descriptor to SDK
  const response = await fetch(uri)
  const blob = await response.blob()
  const name = uri.split('/').pop() || `${ID.unique()}.jpg`
  const fileId = ID.unique()
  const fileObj = {
    uri,
    name,
    size: (blob as any).size || 0,
    type: (blob as any).type || 'image/jpeg'
  }

  const uploaded = await storage.createFile(String(bucketId), fileId, fileObj)
  return uploaded // includes $id
}

export async function createPost({ title, description, imageUri, authorName }: { title: string; description: string; imageUri?: string | null; authorName?: string }) {
  if (!databaseId || !collectionId) {
    throw new Error('Missing EXPO_PUBLIC_APPWRITE_DATABASE_ID or EXPO_PUBLIC_APPWRITE_COLLECTION_ID env var')
  }

  const data: Record<string, any> = { title, description, likes: 0 }
  if (authorName) {
    data.authorName = authorName
  }
  if (imageUri) {
    const uploaded = await uploadImageUri(imageUri)
    data.imageFileId = uploaded.$id
    data.imageUrl = `${String(endpoint)}/storage/buckets/${String(bucketId)}/files/${uploaded.$id}/view?project=${String(project)}`
  }

  const res = await databases.createDocument(String(databaseId), String(collectionId), ID.unique(), data)
  return res
}

export async function updateLikes(postId: string, currentLikes: number, delta: number) {
  if (!databaseId || !collectionId) {
    throw new Error('Missing EXPO_PUBLIC_APPWRITE_DATABASE_ID or EXPO_PUBLIC_APPWRITE_COLLECTION_ID env var')
  }

  const newLikes = Math.max(0, (currentLikes || 0) + delta)
  const updated = await databases.updateDocument(
    String(databaseId),
    String(collectionId),
    postId,
    { likes: newLikes }
  )
  return updated
}

export async function getPosts() {
  if (!databaseId || !collectionId) {
    throw new Error('Missing EXPO_PUBLIC_APPWRITE_DATABASE_ID or EXPO_PUBLIC_APPWRITE_COLLECTION_ID env var')
  }

  const res = await databases.listDocuments(String(databaseId), String(collectionId))
  return res.documents
}

export default client
