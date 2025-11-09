// src/screens/CaptureScreen.tsx
import React, { useRef, useState, useEffect } from "react";
import {
    View,
    StyleSheet,
    Alert,
    Image,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as ImageManipulator from "expo-image-manipulator";
import * as Crypto from "expo-crypto";
import { saveDiscovery } from "../utils/storage";
import { identifyMultiplePhotos, mockIdentifyPlant } from "../api/plantApi";
import { Discovery } from "../types/discovery";
import CameraViewSection from '../components/capture/CameraViewSection';
import { useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons"
import { SafeAreaView } from "react-native-safe-area-context";
import { CONFIDENCE_THRESHOLD } from "../constants/constants";

export type RootStackParamList = {
    Home: undefined;
    Capture: undefined;
    Discoveries: { newDiscovery: Discovery } | undefined;
};

export default function CaptureScreen() {
    const cameraRef = useRef<CameraView | null>(null);
    const [permission, requestPermission] = useCameraPermissions();
    const [isLoading, setIsLoading] = useState(false);

    // multi-photo state
    const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
    const [currentPhoto, setCurrentPhoto] = useState<string | null>(null); // last captured preview
    const [resultDiscovery, setResultDiscovery] = useState<Discovery | null>(null);
    const [isIdentifying, setIsIdentifying] = useState<boolean>(false);

    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const theme = useTheme();

    const useMock = false;

    useEffect(() => {
        if (!permission?.granted) requestPermission();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [permission]);

    // helper: convert local uri to base64
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

    // --- Camera actions ---
    const handleTakePicture = async () => {
        if (!cameraRef.current) {
            Alert.alert("Camera not ready", "Please try again.");
            return;
        }

        try {
            setIsLoading(true);
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
            if (!photo?.uri) throw new Error("No photo captured");

            // resize/compress for network efficiency (keep result.uri)
            const resized = await ImageManipulator.manipulateAsync(
                photo.uri,
                [{ resize: { width: 1200 } }], // keep decent resolution; adjust if needed
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );

            // append to capturedPhotos and set preview
            setCapturedPhotos(prev => [...prev, resized.uri]);
            setCurrentPhoto(resized.uri);
        } catch (err: any) {
            console.error("takePicture error:", err);
            Alert.alert("Error to capture", err?.message ?? "Failed to capture photo.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRetake = () => {
        // Remove last captured photo and go back to camera
        setCapturedPhotos(prev => {
            const next = prev.slice(0, -1);
            setCurrentPhoto(next[next.length - 1] ?? null);
            return next;
        });
        setResultDiscovery(null);
    };

    const handleAddAnother = () => {
        // Just go back to camera (UI should show camera when there is no active preview)
        setResultDiscovery(null);
        // keep capturedPhotos intact; UI will allow camera to open again
        // (we control showing camera vs preview by currentPhoto/capturedPhotos)
        setCurrentPhoto(null);
    };

    const removeCapturedAt = (index: number) => {
        setCapturedPhotos(prev => {
            const copy = [...prev];
            copy.splice(index, 1);
            setCurrentPhoto(copy[copy.length - 1] ?? null);
            return copy;
        });
    };


    const handleIdentify = async () => {
        if (capturedPhotos.length === 0) return;
        if (isIdentifying) return

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Location Required", "Please enable location access to save this discovery.");
            return;
        }

        const currentPosition = await Location.getCurrentPositionAsync({});

        try {
            setIsIdentifying(true);

            const base64List = []
            for (const photoUri of capturedPhotos) {
                const resized = await ImageManipulator.manipulateAsync(
                    photoUri,
                    [{ resize: { width: 800 } }],
                    { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
                );
                const base64 = await uriToBase64(resized.uri);
                base64List.push(base64);
            }

            const apiResponse = useMock
                ? await mockIdentifyPlant(base64List[0])
                : await identifyMultiplePhotos(base64List);
            const top = apiResponse?.suggestions?.[0] ?? apiResponse?.result?.classification?.suggestions?.[0];

            const speciesName = top?.name ?? top?.plant_name ?? null;
            const confidence = top?.probability ?? 0;

            if (!speciesName) {
                Alert.alert("Plant not identified", "No match found, please try to add more photos.");
                return;
            }

            // here we should tell user to add more or have possibility to throw photos out

            const id = await Crypto.randomUUID();
            const discovery: Discovery = {
                id,
                speciesName,
                confidence,
                photos: [capturedPhotos[0]],
                createdAt: new Date().toISOString(),
                locations: [{
                    latitude: currentPosition.coords.latitude,
                    longitude: currentPosition.coords.longitude,
                    date: new Date().toISOString(),
                }],
                updatedAt: '',
            };
            // need to check if we already have record with same speciesName, so we don't save another but just update existing one (add another location & time)
            await saveDiscovery(discovery);
            navigation.navigate("Discoveries", { newDiscovery: discovery });
            setCapturedPhotos([])
            setIsIdentifying(false)

            Alert.alert("🌿 Plant Identified", `${speciesName}\nConfidence: ${(confidence * 100).toFixed(1)}%`);
        } catch (err: any) {
            console.error("identify error:", err);
            Alert.alert("Error", err?.message ?? "Failed to identify plant.");
        } finally {
            setIsIdentifying(false);
        }
    };

    // UI states for camera vs preview:
    const showingPreview = currentPhoto !== null && capturedPhotos.length > 0;

    // Permission UI
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

    // Render
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {!showingPreview && (
                <View style={{ flex: 1, width: '100%', }}>
                    <CameraViewSection
                        cameraRef={cameraRef}
                        onCapture={handleTakePicture}
                    />
                </View>
            )}

            {showingPreview && (
                <View style={styles.previewContainer}>
                    {/* show the latest captured photo as main preview */}
                    <Image source={{ uri: currentPhoto ?? capturedPhotos[0] }} style={styles.previewImage} />

                    {/* thumbnails row */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ marginVertical: 8 }}>
                        {capturedPhotos.map((uri, idx) => (
                            <TouchableOpacity key={uri + idx} onPress={() => setCurrentPhoto(uri)} onLongPress={() => removeCapturedAt(idx)}>
                                <Image source={{ uri }} style={[styles.thumb, currentPhoto === uri ? styles.thumbActive : null]} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {capturedPhotos && (
                        <View style={styles.actionContainer}>
                            {/* Retake */}
                            <TouchableOpacity
                                style={[styles.actionCard, { backgroundColor: theme.colors.primaryContainer }]}
                                onPress={handleRetake}
                                disabled={isIdentifying}
                            >
                                <Ionicons
                                    name="refresh"
                                    size={28}
                                    color={theme.colors.primary}
                                />
                                <Text style={[styles.actionLabel, { color: theme.colors.onSurface }]}>
                                    Retake
                                </Text>
                            </TouchableOpacity>

                            {/* Identify */}
                            <TouchableOpacity
                                style={[
                                    styles.actionCard,
                                    { backgroundColor: theme.colors.primaryContainer },
                                ]}
                                onPress={handleIdentify}
                                disabled={isIdentifying}
                            >
                                {isIdentifying ?
                                    (<ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 12 }} />)
                                    : (<>< Ionicons
                                        name="leaf-outline"
                                        size={28}
                                        color={theme.colors.onPrimaryContainer}
                                    />
                                        <Text
                                            style={[
                                                styles.actionLabel,
                                                { color: theme.colors.onPrimaryContainer },
                                            ]}
                                        >
                                            {isIdentifying ? "Identifying..." : "Identify"}
                                        </Text></>)}

                            </TouchableOpacity>
                            {/* Add */}
                            <TouchableOpacity
                                style={[styles.actionCard, { backgroundColor: theme.colors.primaryContainer }]}
                                onPress={handleAddAnother}
                                disabled={isIdentifying}
                            >
                                <Ionicons
                                    name="add-circle-outline"
                                    size={28}
                                    color={theme.colors.primary}
                                />
                                {<Text style={[styles.actionLabel, { color: theme.colors.onSurface }]}>
                                    Add
                                </Text>}
                            </TouchableOpacity>
                        </View>
                    )}



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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    previewContainer: { flex: 1, paddingTop: 16, paddingHorizontal: 16, width: '100%', justifyContent: 'center', alignItems: 'center' },
    previewImage: { width: '100%', height: '60%', borderRadius: 12, resizeMode: 'cover', marginBottom: 12 },
    thumb: { width: 72, height: 72, borderRadius: 8, marginRight: 8, borderWidth: 2, borderColor: 'transparent' },
    thumbActive: { borderColor: '#28a745' },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-evenly', width: '100%', marginBottom: 12 },
    button: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, minWidth: 100, alignItems: 'center' },
    buttonText: { fontWeight: '600', fontSize: 16 },
    resultContainer: { alignItems: 'center', padding: 16 },
    resultTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
    resultText: { fontSize: 18, marginBottom: 16 },
    actionContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        marginTop: 8,
    },
    actionCard: {
        width: 100,
        height: 90,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        elevation: 2,
    },
    actionLabel: {
        marginTop: 6,
        fontSize: 14,
        fontWeight: "500",
    },
});
