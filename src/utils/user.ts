import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Crypto from 'expo-crypto'

const USER_KEY = 'local_user_id'

export async function getOrCreateUserId(): Promise<string> {
    let id = await AsyncStorage.getItem(USER_KEY)

    if (!id) {
        id = await Crypto.randomUUID()
        await AsyncStorage.setItem(USER_KEY, id);
        console.log('🆕 Created new user ID:', id);
    } else {
        console.log('👤 Existing user ID:', id);
    }

    return id
}

export async function resetUserId(): Promise<void> {
    await AsyncStorage.removeItem(USER_KEY)
}