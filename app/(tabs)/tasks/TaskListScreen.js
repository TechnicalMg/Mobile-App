import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';

const AddTaskScreen = ({ navigation, route }) => {
  const { setTasks } = route.params || {}; // ← safe fallback in case undefined
  const [taskTitle, setTaskTitle] = useState('');

  const handleAddTask = () => {
    if (!taskTitle.trim()) {
      Alert.alert('Validation', 'Task title cannot be empty.');
      return;
    }

    if (typeof setTasks !== 'function') {
      Alert.alert('Error', 'Task list update function is missing.');
      return;
    }

    const newTask = {
      id: Date.now(),
      title: taskTitle,
    };

    // ✅ Add task to list
    setTasks(prev => [...prev, newTask]);

    // ✅ Navigate back to TaskListScreen
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Enter task title"
        value={taskTitle}
        onChangeText={setTaskTitle}
        style={styles.input}
      />
      <Button title="Add Task" onPress={handleAddTask} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 20,
    padding: 10,
    borderRadius: 6,
    fontSize: 16,
  },
});

export default AddTaskScreen;
