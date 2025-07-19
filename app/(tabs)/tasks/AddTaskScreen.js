const AddTaskScreen = ({ route, navigation }) => {
  const { setTasks } = route.params;
  const [title, setTitle] = useState('');

  const addTask = () => {
    if (!title.trim()) return;
    const newTask = { id: Date.now(), title };
    setTasks((prev) => [newTask, ...prev]);
    navigation.goBack();
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Enter task"
        value={title}
        onChangeText={setTitle}
        style={{ borderWidth: 1, padding: 10 }}
      />
      <Button title="Save Task" onPress={addTask} />
    </View>
  );
};
