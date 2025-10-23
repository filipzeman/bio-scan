// src/screens/CaptureScreen.tsx
import React, { useRef, useState, useEffect } from "react";
import {
    View,
    StyleSheet,
    Alert,
    Image,
    Text,
    TouchableOpacity,
    ActivityIndicator
} from "react-native";
import { useNavigation, NavigationProp, useRoute } from '@react-navigation/native'
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location'
import * as ImageManipulator from "expo-image-manipulator";
import * as Crypto from "expo-crypto";
import { saveDiscovery } from "../utils/storage";
import { identifyPlant, mockIdentifyPlant } from "../api/plantApi";
import { Discovery } from "../types/discovery";
import CameraViewSection from '../components/capture/CameraViewSection';
import { useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export type RootStackParamList = {
    Home: undefined;
    Capture: undefined;
    Discoveries: { newDiscovery: Discovery } | undefined;
};

export default function CaptureScreen() {
    const cameraRef = useRef<CameraView | null>(null);
    const [permission, requestPermission] = useCameraPermissions();
    const [isLoading, setIsLoading] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [resultDiscovery, setResultDiscovery] = useState<Discovery | null>(null);
    const [isIdentifying, setIsIdentifying] = useState(false);

    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const theme = useTheme();

    const useMock = false;

    useEffect(() => {
        if (!permission?.granted) requestPermission();
    }, [permission]);

    const uriToBase64 = async (uri: string): Promise<string> => {
        const resp = await fetch(uri);
        const blob = await resp.blob();
        return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error("Failed to convert blob to base64"));
            reader.onload = () => {
                const dataUrl = reader.result as string;
                resolve(dataUrl.split(",")[1]);
            };
            reader.readAsDataURL(blob);
        });
    };

    const retakePhoto = () => {
        setCapturedPhoto(null);
        setResultDiscovery(null);
    };

    const handleTakePicture = async () => {
        if (!cameraRef.current) {
            Alert.alert("Camera not ready", "Please try again.");
            return;
        }

        try {
            setIsLoading(true);
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
            if (!photo?.uri) throw new Error("No photo captured");
            setCapturedPhoto(photo.uri);
        } catch (err: any) {
            console.error("takePicture error:", err);
            Alert.alert("Error", err?.message ?? "Failed to capture photo.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleIdentify = async () => {
        if (!capturedPhoto) return;

        let { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
            Alert.alert("Location Required", "Please enable location access to save this discovery.");
            setIsIdentifying(false);
            return;
        }

        const currentPosition = await Location.getCurrentPositionAsync({});

        try {
            setIsIdentifying(true);
            const resized = await ImageManipulator.manipulateAsync(
                capturedPhoto,
                [{ resize: { width: 800 } }],
                { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
            );

            const base64 = await uriToBase64(resized.uri);

            const apiResponse = useMock
                ? await mockIdentifyPlant(resized.uri)
                : await identifyPlant(base64);

            const top = apiResponse?.result?.classification?.suggestions?.[0] ?? apiResponse?.suggestions?.[0];
            const speciesName = top?.name ?? top?.plant_name ?? null;
            const confidence = top?.probability ?? 0;

            if (!speciesName) {
                Alert.alert("Plant not identified", "No match found.");
                return;
            }

            const id = await Crypto.randomUUID();
            const discovery: Discovery = {
                id,
                speciesName,
                confidence,
                photoUri: resized.uri,
                createdAt: new Date().toISOString(),
                location: {
                    latitude: currentPosition.coords.latitude,
                    longitude: currentPosition.coords.longitude
                }
            };

            await saveDiscovery(discovery);
            setResultDiscovery(discovery);

            navigation.navigate('Discoveries', { newDiscovery: discovery });

            Alert.alert(
                "🌿 Plant Identified",
                `${speciesName}\nConfidence: ${(confidence * 100).toFixed(1)}%`
            );
        } catch (err: any) {
            console.error("identify error:", err);
            Alert.alert("Error", err?.message ?? "Failed to identify plant.");
        } finally {
            setIsIdentifying(false);
        }
    };

    if (!permission) return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Text style={{ color: theme.colors.onSurface }}>Checking permissions...</Text>
        </View>
    );

    if (!permission.granted) return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Text style={{ color: theme.colors.onSurface, marginBottom: 12 }}>
                Camera permission required.
            </Text>
            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                onPress={requestPermission}
            >
                <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>Grant permission</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                {!capturedPhoto && (
                    <View style={{ flex: 1, width: '100%', borderRadius: 50, padding: 0 }}>
                        <CameraViewSection
                            cameraRef={cameraRef}
                            onCapture={handleTakePicture}
                        />
                    </View>
                )}

                {capturedPhoto && (
                    <View style={styles.previewContainer}>
                        <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                                onPress={retakePhoto}
                            >
                                <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>Retake</Text>
                            </TouchableOpacity>
                            {!isIdentifying && (
                                <TouchableOpacity
                                    style={[styles.button, { backgroundColor: theme.colors.primary }]}
                                    onPress={handleIdentify}
                                >
                                    <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>Identify</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {isIdentifying && <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>Identifying plant...</Text>}
                    </View>
                )}

                {resultDiscovery && !isIdentifying && (
                    <View style={styles.resultContainer}>
                        <Text style={[styles.resultTitle, { color: theme.colors.onSurface }]}>Identified:</Text>
                        <Text style={[styles.resultText, { color: theme.colors.onSurface }]}>{resultDiscovery.speciesName}</Text>
                        <Text style={[styles.resultText, { color: theme.colors.onSurface }]}>
                            {resultDiscovery.confidence ? `${(resultDiscovery.confidence * 100).toFixed(1)} %` : '0 %'}
                        </Text>
                    </View>
                )}

                {isIdentifying && <ActivityIndicator size="large" color={theme.colors.primary} />}

                {!isIdentifying && capturedPhoto && !resultDiscovery && !isLoading && (
                    <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>No plant was confidently identified.</Text>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 32, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
    previewContainer: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
    previewImage: { width: '100%', height: '65%', borderRadius: 12, resizeMode: 'cover', marginBottom: 20 },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-evenly', width: '100%', marginBottom: 12 },
    button: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, minWidth: 120, alignItems: 'center' },
    buttonText: { fontWeight: '600', fontSize: 16 },
    infoText: { fontSize: 16, marginTop: 10 },
    resultContainer: { alignItems: 'center', padding: 16 },
    resultTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
    resultText: { fontSize: 18, marginBottom: 16 },
});
