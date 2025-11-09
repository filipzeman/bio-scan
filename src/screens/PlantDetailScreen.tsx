import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator, Linking } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { RouteProp, useRoute } from '@react-navigation/native'
import { Discovery, WikiInfo } from '../types/discovery'
import { saveDiscovery } from "../utils/storage";
import { SafeAreaView } from "react-native-safe-area-context";

type RootStackParamList = {
    Detail: { discovery: Discovery }
}


export default function PlantDetailScreen() {
    const route = useRoute<RouteProp<RootStackParamList, 'Detail'>>()
    const { discovery } = route.params
    const [wikiSummary, setWikiSummary] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [wikiInfo, setWikiInfo] = useState<WikiInfo | null>(discovery.wikiInfo ?? null)

    useEffect(() => {
        const fetchWiki = async () => {
            if (wikiInfo) return; // already fetched

            try {
                setIsLoading(true);

                // ✅ Use speciesName as query
                const query = discovery.speciesName.replace(/\s/g, "_");
                const url = `https://cs.wikipedia.org/api/rest_v1/page/summary/${query}`;
                const resp = await fetch(url);
                const data = await resp.json();

                const getNativeName = () => {
                    return (data?.extract)?.split(' ').slice(0, 2).join(' ')
                }

                // 2️⃣ Construct structured WikiInfo
                const structuredInfo: WikiInfo = {
                    extract: data.extract || "No info found on Wikipedia.",
                    imageUrl: data.originalimage?.source || null,
                    title: data.title || discovery.speciesName,
                    scientificName: discovery.speciesName, // ✅ use speciesName as Latin name
                    nativeName: getNativeName() || null,
                    classification: [] // optional, leave for later
                };

                setWikiSummary(structuredInfo.extract);
                setWikiInfo(structuredInfo);

                const updatedDiscovery = { ...discovery, wikiInfo: structuredInfo };
                await saveDiscovery(updatedDiscovery);

            } catch (err) {
                setWikiSummary("Failed to load info.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchWiki();
    }, [discovery]);

    console.log('discovery', discovery)

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScrollView style={styles.scrollContainer}>
                    {/* Hero Image */}
                    <Image source={{ uri: discovery.wikiInfo?.imageUrl }} style={styles.image} />
                    {/* Title + Confidence */}
                    <View style={styles.headerSection}>
                        {wikiInfo && <Text style={styles.title}>{wikiInfo?.title || discovery.speciesName}</Text>}
                        <Text style={styles.subtitle}>{discovery.speciesName}</Text>
                        {/* <Text style={styles.confidence}>
                            Confidence: {discovery.confidence ? (discovery.confidence * 100).toFixed(1) : 0}%
                        </Text> */}
                        {/* {wikiInfo?.scientificName && (
                    <Text style={styles.scientificName}>({wikiInfo.scientificName})</Text>
                )} */}
                    </View>

                    {/* About Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📖 About</Text>
                        {isLoading ? (
                            <ActivityIndicator size="large" color="#28a745" />
                        ) : (
                            <Text style={styles.sectionText}>{wikiInfo?.extract || "No information available."}</Text>
                        )}
                    </View>

                    {/* Scientific Section */}
                    {wikiInfo?.scientificName && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>🧬 Scientific Info</Text>
                            <Text style={styles.sectionText}>Scientific Name: {discovery.speciesName}</Text>
                        </View>
                    )}

                    {/* Location Section (placeholder for now) */}
                    {discovery.locations && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>📍 Location</Text>
                            <Text style={styles.sectionText}>
                                {discovery.locations[0].latitude.toFixed(5)}, {discovery.locations[0].longitude.toFixed(5)}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>

        </View>

    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContainer: { flex: 1, backgroundColor: '#fff', padding: 16, paddingTop: 0 },
    image: { width: '100%', height: 250, marginTop: 30, borderRadius: 12, marginBottom: 16 },
    title: { fontSize: 24, fontWeight: '700', color: '#28a745', marginBottom: 8 },
    subtitle: { fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 8 },
    confidence: { fontSize: 18, color: '#000', marginBottom: 16 },
    info: { fontSize: 16, color: '#000', lineHeight: 22 },
    detailText: {
        fontSize: 16,
        color: '#000',
        marginVertical: 6,
    },
    map: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginTop: 10,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 16,
    },
    scientificName: {
        fontSize: 16,
        fontStyle: 'italic',
        color: '#555',
        marginTop: 4,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#28a745',
        marginBottom: 6,
    },
    sectionText: {
        fontSize: 16,
        color: '#000',
        lineHeight: 22,
    },
});