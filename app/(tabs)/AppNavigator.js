import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import DashboardScreen from './DashboardScreen';
import LoginScreen from './LoginScreen';
import TaskListScreen from './tasks/TaskListScreen';
import AddTaskScreen from './tasks/AddTaskScreen';
import ProtectedRoute from './ProtectedRoute';

const Stack = createStackNavigator();

// ✅ Protected screen wrapper
const withProtected = (Component) => {
  return (props) => (
    <ProtectedRoute {...props}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">

        {/* 🔓 Public Login Screen */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />

        {/* 🔐 Protected Screens */}
        <Stack.Screen
          name="Dashboard"
          component={withProtected(DashboardScreen)}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TaskList"
          component={withProtected(TaskListScreen)}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddTask"
          component={withProtected(AddTaskScreen)}
          options={{ headerShown: false }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
