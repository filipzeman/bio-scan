import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { CameraView } from 'expo-camera'
import { SafeAreaView } from "react-native-safe-area-context";

interface CameraViewSectionProps {
    cameraRef: React.RefObject<CameraView | null>
    onCapture: () => void;
}

const CameraViewSection: React.FC<CameraViewSectionProps> = ({
    cameraRef,
    onCapture,
}) => {
    return (
        <View style={{ flex: 1 }}>
            <CameraView
                ref={cameraRef}
                style={{ flex: 1, marginBottom: -32 }}
            />
            <TouchableOpacity
                style={{
                    position: 'absolute',
                    bottom: 30,
                    alignSelf: 'center',
                    backgroundColor: '#28a745',
                    paddingHorizontal: 24,
                    paddingVertical: 16,
                    borderRadius: 50,
                }}
                onPress={onCapture}
            >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                    Take Photo
                </Text>
            </TouchableOpacity>
        </View>
    );
}

export default CameraViewSection