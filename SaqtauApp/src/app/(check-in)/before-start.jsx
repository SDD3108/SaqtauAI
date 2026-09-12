import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native';

const beforeStart = () => {
    return (
        <SafeAreaView>
            <Text>beforeStart</Text>
        </SafeAreaView>
    );
};

export default beforeStart;