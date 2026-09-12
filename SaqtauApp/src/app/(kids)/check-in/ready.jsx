import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native';

const ready = () => {
    return (
        <SafeAreaView>
            <Text>ready</Text>
        </SafeAreaView>
    );
};

export default ready;