import React from 'react';
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