import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import CaptureScreen from '../screens/CaptureScreen';
import DiscoveriesScreen from '../screens/DiscoveriesScreen';
import PlantDetailScreen from '../screens/PlantDetailScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Discovery } from '../types/discovery';
import { IoniconsBase } from '../types';
import { Ionicons } from '@expo/vector-icons'

export type RootStackParamList = {
    Home: undefined;
    Capture: undefined;
    Discoveries: { newDiscovery?: Discovery } | undefined;
    Detail: { discovery: Discovery };
};

export type RootTabParamList = {
    Home: undefined;
    Identify: undefined;
    Discoveries: undefined; // points to the DiscoveriesStack
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

// Stack for Discoveries → allows navigating to Detail
function DiscoveriesStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Discoveries" component={DiscoveriesScreen} />
            <Stack.Screen name="Detail" component={PlantDetailScreen} />
        </Stack.Navigator>
    );
}

export default function MainNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    let iconName: IoniconsBase = 'home';
                    if (route.name === 'Home') iconName = 'home';
                    else if (route.name === 'Identify') iconName = 'camera';
                    else if (route.name === 'Discoveries') iconName = 'map';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#28a745',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Identify" component={CaptureScreen} />
            <Tab.Screen name="Discoveries" component={DiscoveriesStack} />
        </Tab.Navigator>
    );
}