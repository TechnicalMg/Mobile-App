import { Text, View } from 'react-native';
import AuthWrapper from './AuthWrapper';

// import AuthWrapper from '../components/AuthWrapper';

export default function ProtectedScreen() {
    return (
        <AuthWrapper>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>This content requires authentication</Text>
            </View>
        </AuthWrapper>
    );
}