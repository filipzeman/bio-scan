import { Buffer } from "buffer";
global.Buffer = Buffer; // 👈 critical 
// @ts-ignore
import { decode as atob, encode as btoa } from "base-64";
if (typeof global.atob === "undefined") global.atob = atob;
if (typeof global.btoa === "undefined") global.btoa = btoa;


import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { paperTheme as theme } from './src/styles/theme';

import MainNavigator from './src/navigation/MainNavigator';

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" />
        <MainNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}