<<<<<<< HEAD
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';

// Database API Configuration
const API_BASE_URL = 'http://172.16.1.49:8080/api'; // Replace with your actual API endpoint

// Enhanced API with better error handling and fallback
const api = {
    // Task Management
    getTasks: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('API Error (getTasks):', error);
            
            // Return mock data if API is unavailable
            return [
                {
                    id: 1,
                    title: 'Sample Task 1',
                    description: 'This is a sample task (API unavailable)',
                    priority: 'medium',
                    status: 'todo',
                    category: 'general',
                    dueDate: '2024-12-31',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 2,
                    title: 'Sample Task 2',
                    description: 'Another sample task (API unavailable)',
                    priority: 'high',
                    status: 'in_progress',
                    category: 'development',
                    dueDate: '2024-12-25',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
        }
    },
    
    createTask: async (taskData) => {
        try {
            // Format the task data to match backend expectations
            const formattedTaskData = {
                title: taskData.title || '',
                description: taskData.description || '',
                priority: taskData.priority || 'medium',
                status: taskData.status || 'todo',
                category: taskData.category || 'general',
                dueDate: taskData.dueDate || ''
            };
            
            console.log('Sending task data:', formattedTaskData);
            
            const response = await fetch(`${API_BASE_URL}/tasks`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formattedTaskData),
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Create task error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Task created successfully:', result);
            return result;
        } catch (error) {
            console.error('API Error (createTask):', error);
            
            // Fallback: return the task data with a generated ID
            return {
                ...taskData,
                id: Date.now(), // Use numeric ID for consistency
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        }
    },
    
    updateTask: async (taskId, updates) => {
        try {
            // Format the updates to match backend expectations
            const formattedUpdates = {
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            console.log('Updating task:', taskId, formattedUpdates);
            
            const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formattedUpdates),
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Update task error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Task updated successfully:', result);
            return result;
        } catch (error) {
            console.error('API Error (updateTask):', error);
            
            // Fallback: return the updates with the task ID
            return { 
                ...updates, 
                id: taskId, 
                updatedAt: new Date().toISOString() 
            };
        }
    },
    
    deleteTask: async (taskId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Delete task error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Task deleted successfully:', result);
            return result;
        } catch (error) {
            console.error('API Error (deleteTask):', error);
            
            // Fallback: return success
            return { success: true, id: taskId };
        }
    },
    
    // Check API connectivity
    checkConnection: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/health`, {
                method: 'GET',
            });
            const result = response.ok;
            console.log('API connection check:', result);
            return result;
        } catch (error) {
            console.error('API connection check failed:', error);
            return false;
        }
    }
};

export default function TaskManager() {
    const router = useRouter();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showTaskDetail, setShowTaskDetail] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [editingTask, setEditingTask] = useState(null);
    const [apiConnected, setApiConnected] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        category: 'general',
        dueDate: ''
    });
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');

    useEffect(() => {
        initializeApp();
    }, []);

    const initializeApp = async () => {
        try {
            setLoading(true);
            
            // Check API connection first
            const connected = await api.checkConnection();
            setApiConnected(connected);
            
            if (!connected) {
                console.warn('API not available, using offline mode');
            }
            
            // Load tasks
            await loadTasks();
        } catch (error) {
            console.error('Failed to initialize app:', error);
            Alert.alert('Warning', 'App initialized in offline mode');
        } finally {
            setLoading(false);
        }
    };

    const loadTasks = async () => {
        try {
            const taskList = await api.getTasks();
            setTasks(taskList || []);
        } catch (error) {
            console.error('Failed to load tasks:', error);
            Alert.alert('Error', 'Failed to load tasks. Using offline mode.');
        }
    };

    const handleLogout = async () => {
        try {
            await SecureStore.deleteItemAsync('authToken');
            router.replace('/LoginScreen');
        } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
        }
    };

    const addTask = async () => {
        if (!newTask.title.trim()) {
            Alert.alert('Error', 'Please enter a task title');
            return;
        }

        try {
            // Don't include id in the task data - let backend generate it
            const taskData = {
                title: newTask.title.trim(),
                description: newTask.description.trim(),
                priority: newTask.priority || 'medium',
                status: newTask.status || 'todo',
                category: newTask.category || 'general',
                dueDate: newTask.dueDate || ''
            };

            console.log('Creating task with data:', taskData);

            const createdTask = await api.createTask(taskData);
            setTasks(prevTasks => [...prevTasks, createdTask]);
            
            // Reset form
            setNewTask({
                title: '',
                description: '',
                priority: 'medium',
                status: 'todo',
                category: 'general',
                dueDate: ''
            });
            setShowAddModal(false);
            
            Alert.alert(
                'Success', 
                apiConnected ? 'Task created successfully' : 'Task created (offline mode)'
            );
        } catch (error) {
            console.error('Failed to create task:', error);
            Alert.alert('Error', 'Failed to create task');
        }
    };

    const updateTask = async () => {
        if (!editingTask.title.trim()) {
            Alert.alert('Error', 'Please enter a task title');
            return;
        }

        try {
            const updates = {
                title: editingTask.title.trim(),
                description: editingTask.description.trim(),
                priority: editingTask.priority || 'medium',
                status: editingTask.status || 'todo',
                category: editingTask.category || 'general',
                dueDate: editingTask.dueDate || ''
            };

            console.log('Updating task with data:', updates);

            const updatedTask = await api.updateTask(editingTask.id, updates);
            
            setTasks(prevTasks => 
                prevTasks.map(task => 
                    task.id === editingTask.id ? { ...task, ...updatedTask } : task
                )
            );
            
            // Update selected task if it's the one being updated
            if (selectedTask && selectedTask.id === editingTask.id) {
                setSelectedTask(prev => ({ ...prev, ...updatedTask }));
            }
            
            setShowEditModal(false);
            setEditingTask(null);
            
            Alert.alert(
                'Success', 
                apiConnected ? 'Task updated successfully' : 'Task updated (offline mode)'
            );
        } catch (error) {
            console.error('Failed to update task:', error);
            Alert.alert('Error', 'Failed to update task');
        }
    };

    const updateTaskStatus = async (taskId, newStatus) => {
        try {
            const updates = { 
                status: newStatus
            };
            
            const updatedTask = await api.updateTask(taskId, updates);
            
            setTasks(prevTasks => 
                prevTasks.map(task => 
                    task.id === taskId ? { ...task, ...updatedTask } : task
                )
            );
            
            // Update selected task if it's the one being updated
            if (selectedTask && selectedTask.id === taskId) {
                setSelectedTask(prev => ({ ...prev, ...updatedTask }));
            }
        } catch (error) {
            console.error('Failed to update task status:', error);
            Alert.alert('Error', 'Failed to update task status');
        }
    };

    const deleteTask = async (taskId) => {
        Alert.alert(
            'Delete Task',
            'Are you sure you want to delete this task?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.deleteTask(taskId);
                            setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
                            setShowTaskDetail(false);
                        } catch (error) {
                            console.error('Failed to delete task:', error);
                            Alert.alert('Error', 'Failed to delete task');
                        }
                    }
                }
            ]
        );
    };

    const openTaskDetail = (task) => {
        setSelectedTask(task);
        setShowTaskDetail(true);
    };

    const openEditModal = (task) => {
        setEditingTask({ ...task });
        setShowEditModal(true);
    };

    const getFilteredTasks = () => {
        let filteredTasks = [...tasks];

        if (statusFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
        }

        if (priorityFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter);
        }

        if (searchText) {
            filteredTasks = filteredTasks.filter(task =>
                task.title?.toLowerCase().includes(searchText.toLowerCase()) ||
                task.description?.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        return filteredTasks;
    };

    const getPriorityColor = (priority) => {
        if (!priority) return '#007AFF';
        switch (priority.toLowerCase()) {
            case 'critical': return '#FF1744';
            case 'high': return '#FF3B30';
            case 'medium': return '#FF9500';
            case 'low': return '#34C759';
            default: return '#007AFF';
        }
    };

    const getStatusColor = (status) => {
        if (!status) return '#8E8E93';
        switch (status.toLowerCase()) {
            case 'todo': return '#007AFF';
            case 'in_progress': return '#FF9500';
            case 'review': return '#9C27B0';
            case 'done': return '#34C759';
            case 'blocked': return '#FF1744';
            default: return '#8E8E93';
        }
    };

    const getCategoryIcon = (category) => {
        if (!category) return '📋';
        switch (category.toLowerCase()) {
            case 'development': return '💻';
            case 'design': return '🎨';
            case 'marketing': return '📊';
            case 'sales': return '💰';
            case 'support': return '🎧';
            case 'hr': return '👥';
            case 'finance': return '💳';
            case 'operations': return '⚙️';
            default: return '📋';
        }
    };

    const getTaskStats = () => {
        const total = tasks.length;
        const todo = tasks.filter(task => task.status === 'todo').length;
        const inProgress = tasks.filter(task => task.status === 'in_progress').length;
        const review = tasks.filter(task => task.status === 'review').length;
        const done = tasks.filter(task => task.status === 'done').length;
        const blocked = tasks.filter(task => task.status === 'blocked').length;
        const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

        return { total, todo, inProgress, review, done, blocked, completionRate };
    };

    const TaskCard = ({ task }) => {
        if (!task) return null;
        
        return (
            <Pressable 
                style={styles.taskCard} 
                onPress={() => openTaskDetail(task)}
                android_ripple={{ color: 'rgba(0, 212, 255, 0.1)' }}
            >
                <View style={styles.taskHeader}>
                    <View style={styles.taskTitleSection}>
                        <Text style={styles.categoryIcon}>{getCategoryIcon(task.category)}</Text>
                        <View style={styles.taskInfo}>
                            <Text style={styles.taskTitle}>{task.title || 'Untitled Task'}</Text>
                            {task.description ? (
                                <Text style={styles.taskDescription} numberOfLines={2}>
                                    {task.description}
                                </Text>
                            ) : null}
                        </View>
                    </View>
                    <View style={styles.taskMeta}>
                        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                            <Text style={styles.priorityText}>{(task.priority || 'medium').toUpperCase()}</Text>
                        </View>
                    </View>
                </View>
                
                <View style={styles.taskFooter}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
                        <Text style={styles.statusText}>{(task.status || 'todo').replace('_', ' ').toUpperCase()}</Text>
                    </View>
                    {task.dueDate && (
                        <Text style={styles.dueDateText}>
                            📅 {new Date(task.dueDate).toLocaleDateString()}
                        </Text>
                    )}
                </View>
            </Pressable>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#00d4ff" />
                <Text style={styles.loadingText}>Loading tasks...</Text>
            </SafeAreaView>
        );
    }

    const stats = getTaskStats();
    const filteredTasks = getFilteredTasks();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.headerTitle}>Welcome</Text>
                            <Text style={styles.headerSubtitle}>monika</Text>
                        </View>
                        <View style={styles.headerRight}>
                            <View style={styles.connectionStatus}>
                                <View style={[
                                    styles.statusDot, 
                                    { backgroundColor: apiConnected ? '#34C759' : '#FF9500' }
                                ]} />
                                <Text style={styles.statusText}>
                                    {apiConnected ? 'Online' : 'Offline'}
                                </Text>
                            </View>
                            {/* <Pressable 
                                style={styles.logoutButton} 
                                onPress={handleLogout}
                            >
                                <Text style={styles.logoutButtonText}>Logout</Text>
                            </Pressable> */}
                        </View>
                    </View>
                    <Pressable 
                        style={styles.addButton} 
                        onPress={() => setShowAddModal(true)}
                        android_ripple={{ color: 'rgba(255, 255, 255, 0.1)' }}
                    >
                        <Text style={styles.addButtonText}>+ New Task</Text>
                    </Pressable>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.total}</Text>
                        <Text style={styles.statTitle}>Total</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#007AFF' }]}>{stats.todo}</Text>
                        <Text style={styles.statTitle}>To Do</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#FF9500' }]}>{stats.inProgress}</Text>
                        <Text style={styles.statTitle}>In Progress</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#34C759' }]}>{stats.done}</Text>
                        <Text style={styles.statTitle}>Done</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#FF1744' }]}>{stats.blocked}</Text>
                        <Text style={styles.statTitle}>Blocked</Text>
                    </View>
                </View>

                {/* Completion Rate */}
                <View style={styles.completionCard}>
                    <Text style={styles.completionTitle}>Completion Rate</Text>
                    <View style={styles.progressBar}>
                        <View 
                            style={[
                                styles.progressFill, 
                                { width: `${stats.completionRate}%` }
                            ]} 
                        />
                    </View>
                    <Text style={styles.completionText}>{stats.completionRate}% Complete</Text>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search tasks..."
                        placeholderTextColor="#8E8E93"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                </View>
                

                {/* Filters */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
                    <View style={styles.filterContainer}>
                        <Text style={styles.filterLabel}>Status:</Text>
                        {['all', 'todo', 'in_progress', 'review', 'done', 'blocked'].map(status => (
                            <Pressable
                                key={status}
                                style={[
                                    styles.filterButton,
                                    statusFilter === status && styles.activeFilter
                                ]}
                                onPress={() => setStatusFilter(status)}
                            >
                                <Text style={[
                                    styles.filterText,
                                    statusFilter === status && styles.activeFilterText
                                ]}>
                                    {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                                </Text>
                                
                            </Pressable>
                            
                        ))}
                    </View>
                    
                </ScrollView>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
                    <View style={styles.filterContainer}>
                        <Text style={styles.filterLabel}>Priority:</Text>
                        {['all', 'low', 'medium', 'high', 'critical'].map(priority => (
                            <Pressable
                                key={priority}
                                style={[
                                    styles.filterButton,
                                    priorityFilter === priority && styles.activeFilter
                                ]}
                                onPress={() => setPriorityFilter(priority)}
                            >
                                <Text style={[
                                    styles.filterText,
                                    priorityFilter === priority && styles.activeFilterText
                                ]}>
                                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                </Text>
                                
                            </Pressable>
                        ))}
                    </View>
                    
                </ScrollView>

                {/* Tasks List */}
                <View style={styles.tasksContainer}>
                    <Text style={styles.sectionTitle}>
                        Tasks ({filteredTasks.length})
                    </Text>
                    
                    {filteredTasks.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateIcon}>📝</Text>
                            <Text style={styles.emptyStateTitle}>No tasks found</Text>
                            <Text style={styles.emptyStateText}>
                                {searchText || statusFilter !== 'all' || priorityFilter !== 'all' 
                                    ? 'Try adjusting your filters' 
                                    : 'Create your first task to get started'}
                            </Text>
                        </View>
                    ) : (
                        filteredTasks.map(task => (
                            <TaskCard key={task.id} task={task} />
                        ))
                    )}
                </View>
                
            </ScrollView>

            {/* Add Task Modal */}
            <Modal
                visible={showAddModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAddModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Create New Task</Text>
                        
                        <TextInput
                            style={styles.input}
                            placeholder="Task title *"
                            placeholderTextColor="#8E8E93"
                            value={newTask.title}
                            onChangeText={(text) => setNewTask(prev => ({...prev, title: text}))}
                        />
                        
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Task description"
                            placeholderTextColor="#8E8E93"
                            value={newTask.description}
                            onChangeText={(text) => setNewTask(prev => ({...prev, description: text}))}
                            multiline
                            numberOfLines={3}
                        />
                        
                        <View style={styles.pickerContainer}>
                            <Text style={styles.pickerLabel}>Priority:</Text>
                            <View style={styles.priorityOptions}>
                                {['low', 'medium', 'high', 'critical'].map(priority => (
                                    <Pressable
                                        key={priority}
                                        style={[
                                            styles.priorityOption,
                                            newTask.priority === priority && styles.selectedPriority,
                                            { backgroundColor: getPriorityColor(priority) + '20' }
                                        ]}
                                        onPress={() => setNewTask(prev => ({...prev, priority}))}
                                    >
                                        <Text style={[
                                            styles.priorityOptionText,
                                            newTask.priority === priority && { color: getPriorityColor(priority) }
                                        ]}>
                                            {priority.toUpperCase()}
                                        </Text>
                                        
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                        
                        <View style={styles.pickerContainer}>
                            <Text style={styles.pickerLabel}>Category:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.categoryOptions}>
                                    {['general', 'development', 'design', 'marketing', 'sales', 'support', 'hr', 'finance', 'operations'].map(category => (
                                        <Pressable
                                            key={category}
                                            style={[
                                                styles.categoryOption,
                                                newTask.category === category && styles.selectedCategory
                                            ]}
                                            onPress={() => setNewTask(prev => ({...prev, category}))}
                                        >
                                            <Text style={styles.categoryOptionText}>
                                                {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
                                            </Text>
                                            
                                        </Pressable>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Due date (YYYY-MM-DD)"
                            placeholderTextColor="#8E8E93"
                            value={newTask.dueDate}
                            onChangeText={(text) => setNewTask(prev => ({...prev, dueDate: text}))}
                        />
                        
                        <View style={styles.modalActions}>
                            <Pressable
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowAddModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={addTask}
                            >
                                <Text style={styles.saveButtonText}>Create Task</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Task Modal */}
            <Modal
                visible={showEditModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Task</Text>
                        
                        <TextInput
                            style={styles.input}
                            placeholder="Task title *"
                            placeholderTextColor="#8E8E93"
                            value={editingTask?.title || ''}
                            onChangeText={(text) => setEditingTask(prev => ({...prev, title: text}))}
                        />
                        
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Task description"
                            placeholderTextColor="#8E8E93"
                            value={editingTask?.description || ''}
                            onChangeText={(text) => setEditingTask(prev => ({...prev, description: text}))}
                            multiline
                            numberOfLines={3}
                        />
                        
                        <View style={styles.pickerContainer}>
                            <Text style={styles.pickerLabel}>Priority:</Text>
                            <View style={styles.priorityOptions}>
                                {['low', 'medium', 'high', 'critical'].map(priority => (
                                    <Pressable
                                        key={priority}
                                        style={[
                                            styles.priorityOption,
                                            newTask.priority === priority && styles.selectedPriority,
                                            { backgroundColor: getPriorityColor(priority) + '20' }
                                        ]}
                                        onPress={() => setNewTask(prev => ({...prev, priority}))}
                                    >
                                        <Text style={[
                                            styles.priorityOptionText,
                                            newTask.priority === priority && { color: getPriorityColor(priority) }
                                        ]}>
                                            {priority.toUpperCase()}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                        
                        <View style={styles.pickerContainer}>
                            <Text style={styles.pickerLabel}>Category:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.categoryOptions}>
                                    {['general', 'development', 'design', 'marketing', 'sales', 'support', 'hr', 'finance', 'operations'].map(category => (
                                        <Pressable
                                            key={category}
                                            style={[
                                                styles.categoryOption,
                                                newTask.category === category && styles.selectedCategory
                                            ]}
                                            onPress={() => setNewTask(prev => ({...prev, category}))}
                                        >
                                            <Text style={styles.categoryOptionText}>
                                                {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Due date (YYYY-MM-DD)"
                            placeholderTextColor="#8E8E93"
                            value={newTask.dueDate}
                            onChangeText={(text) => setNewTask(prev => ({...prev, dueDate: text}))}
                        />
                        
                        <View style={styles.modalActions}>
                            <Pressable
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowAddModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={addTask}
                            >
                                <Text style={styles.saveButtonText}>Create Task</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Task Detail Modal */}
            <Modal
                visible={showTaskDetail}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowTaskDetail(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.taskDetailContent}>
                        {selectedTask && (
                            <>
                                <View style={styles.taskDetailHeader}>
                                    <Text style={styles.taskDetailTitle}>{selectedTask.title || 'Untitled Task'}</Text>
                                    <Pressable
                                        style={styles.closeButton}
                                        onPress={() => setShowTaskDetail(false)}
                                    >
                                        <Text style={styles.closeButtonText}>✕</Text>
                                    </Pressable>
                                </View>
                                
                                <View style={styles.taskDetailInfo}>
                                    <View style={styles.taskDetailBadges}>
                                        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(selectedTask.priority) }]}>
                                            <Text style={styles.priorityText}>{(selectedTask.priority || 'medium').toUpperCase()}</Text>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedTask.status) }]}>
                                            <Text style={styles.statusText}>{(selectedTask.status || 'todo').replace('_', ' ').toUpperCase()}</Text>
                                        </View>
                                    </View>
                                    
                                    <Text style={styles.taskDetailDescription}>
                                        {selectedTask.description || 'No description provided'}
                                    </Text>
                                    
                                    <View style={styles.taskDetailMeta}>
                                        <Text style={styles.taskDetailMetaItem}>
                                            {getCategoryIcon(selectedTask.category)} {(selectedTask.category || 'general').charAt(0).toUpperCase() + (selectedTask.category || 'general').slice(1)}
                                        </Text>
                                        {selectedTask.dueDate && (
                                            <Text style={styles.taskDetailMetaItem}>
                                                📅 Due: {new Date(selectedTask.dueDate).toLocaleDateString()}
                                            </Text>
                                        )}
                                        {selectedTask.createdAt && (
                                            <Text style={styles.taskDetailMetaItem}>
                                                🕒 Created: {new Date(selectedTask.createdAt).toLocaleDateString()}
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.taskDetailActions}>
                                    <Pressable
                                        style={[styles.actionButton, styles.statusButton]}
                                        onPress={() => {
                                            const currentStatus = selectedTask.status || 'todo';
                                            const nextStatus = currentStatus === 'todo' ? 'in_progress' : 
                                                             currentStatus === 'in_progress' ? 'review' :
                                                             currentStatus === 'review' ? 'done' : 'todo';
                                            updateTaskStatus(selectedTask.id, nextStatus);
                                        }}
                                    >
                                        <Text style={styles.actionButtonText}>
                                            {(selectedTask.status || 'todo') === 'todo' ? '▶️ Start Task' : 
                                             (selectedTask.status || 'todo') === 'in_progress' ? '📋 Move to Review' :
                                             (selectedTask.status || 'todo') === 'review' ? '✅ Mark Done' : '🔄 Restart Task'}
                                        </Text>
                                    </Pressable>
                                    
                                    <Pressable
                                        style={[styles.actionButton, styles.deleteButton]}
                                        onPress={() => deleteTask(selectedTask.id)}
                                    >
                                        <Text style={styles.actionButtonText}>🗑 Delete Task</Text>
                                    </Pressable>
                                    <View style={styles.logoutContainer}>
                                        <Pressable style={styles.logoutButton} onPress={handleLogout}>
                                        <Text style={styles.logoutButtonText}>Logout</Text>
                                        
                                        </Pressable>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFF', // Lighter background for modern look
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
    },
    loadingText: {
        marginTop: 20,
        fontSize: 18,
        color: '#667eea',
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    header: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 0,
        shadowColor: 'rgba(102, 126, 234, 0.1)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 10,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
        marginBottom: 8,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#2D3748',
        letterSpacing: -0.8,
        marginBottom: 6,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#718096',
        fontWeight: '500',
        letterSpacing: 0.2,
    },
    connectionStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2D3748',
        letterSpacing: 0.3,
    },
    addButton: {
        backgroundColor: '#667eea',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 16,
        elevation: 6,
        shadowColor: 'rgba(102, 126, 234, 0.4)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 12,
        borderWidth: 0,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.8,
        textAlign: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginTop: 8,
        gap: 10,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        shadowColor: 'rgba(102, 126, 234, 0.08)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 6,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#2D3748',
        marginBottom: 4,
    },
    statTitle: {
        fontSize: 12,
        color: '#718096',
        textAlign: 'center',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    completionCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginVertical: 12,
        padding: 20,
        borderRadius: 16,
        shadowColor: 'rgba(102, 126, 234, 0.08)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 6,
    },
    completionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 16,
        letterSpacing: 0.2,
    },
    progressBar: {
        height: 6,
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#667eea',
        borderRadius: 3,
    },
    completionText: {
        fontSize: 14,
        color: '#667eea',
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    searchContainer: {
        paddingHorizontal: 16,
        marginBottom: 12,
        position: 'relative',
    },
    searchIcon: {
        position: 'absolute',
        left: 32,
        top: 16,
        zIndex: 1,
        fontSize: 16,
        color: '#718096',
    },
    searchInput: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 48,
        paddingVertical: 14,
        fontSize: 15,
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.1)',
        shadowColor: 'rgba(102, 126, 234, 0.05)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 2,
        color: '#2D3748',
    },
    filterScrollView: {
        paddingBottom: 12,
    },
    filterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3748',
        marginRight: 12,
        minWidth: 60,
        letterSpacing: 0.2,
    },
    filterButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.1)',
        shadowColor: 'rgba(102, 126, 234, 0.05)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 2,
    },
    activeFilter: {
        backgroundColor: '#667eea',
        borderColor: '#667eea',
    },
    filterText: {
        fontSize: 12,
        color: '#718096',
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    activeFilterText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    tasksContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#2D3748',
        marginBottom: 16,
        letterSpacing: -0.2,
        paddingLeft: 4,
    },
    taskCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.08)',
        shadowColor: 'rgba(102, 126, 234, 0.08)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 8,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    taskTitleSection: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    categoryIcon: {
        fontSize: 24,
        marginRight: 16,
        marginTop: 2,
    },
    taskInfo: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 8,
        letterSpacing: -0.1,
        lineHeight: 22,
    },
    taskDescription: {
        fontSize: 14,
        color: '#718096',
        lineHeight: 20,
        letterSpacing: 0.1,
    },
    taskMeta: {
        alignItems: 'flex-end',
    },
    priorityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 8,
    },
    priorityText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    taskFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(102, 126, 234, 0.08)',
    },
    dueDateText: {
        fontSize: 12,
        color: '#F59E0B',
        fontWeight: '600',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        letterSpacing: 0.3,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyStateIcon: {
        fontSize: 56,
        marginBottom: 20,
        opacity: 0.6,
        color: '#CBD5E0',
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#718096',
        marginBottom: 12,
        letterSpacing: -0.2,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#A0AEC0',
        textAlign: 'center',
        lineHeight: 22,
        letterSpacing: 0.1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        width: '90%',
        maxHeight: '85%',
        shadowColor: 'rgba(102, 126, 234, 0.2)',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 24,
        elevation: 16,
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.1)',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#2D3748',
        marginBottom: 20,
        textAlign: 'center',
        letterSpacing: -0.4,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.1)',
        color: '#2D3748',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        marginBottom: 20,
    },
    pickerLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3748',
        marginBottom: 12,
        letterSpacing: 0.2,
    },
    priorityOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    priorityOption: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.2)',
    },
    selectedPriority: {
        borderWidth: 2,
        borderColor: '#667eea',
    },
    priorityOptionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2D3748',
        letterSpacing: 0.3,
    },
    categoryOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryOption: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.1)',
    },
    selectedCategory: {
        backgroundColor: '#667eea',
        borderColor: '#667eea',
    },
    categoryOptionText: {
        fontSize: 13,
        color: '#2D3748',
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    selectedCategoryText: {
        color: '#FFFFFF',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.2)',
    },
    saveButton: {
        backgroundColor: '#667eea',
    },
    cancelButtonText: {
        color: '#667eea',
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    taskDetailContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 0,
        width: '90%',
        maxHeight: '85%',
        overflow: 'hidden',
        shadowColor: 'rgba(102, 126, 234, 0.2)',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 24,
        elevation: 16,
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.1)',
    },
    taskDetailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(102, 126, 234, 0.08)',
        backgroundColor: '#F8FAFF',
    },
    taskDetailTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#2D3748',
        flex: 1,
        letterSpacing: -0.2,
    },
    closeButton: {
        padding: 10,
        borderRadius: 16,
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
    },
    closeButtonText: {
        fontSize: 16,
        color: '#667eea',
        fontWeight: '600',
    },
    taskDetailInfo: {
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(102, 126, 234, 0.08)',
    },
    taskDetailBadges: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 8,
    },
    taskDetailDescription: {
        fontSize: 16,
        color: '#4A5568',
        lineHeight: 24,
        marginBottom: 16,
        letterSpacing: 0.1,
    },
    taskDetailMeta: {
        gap: 10,
    },
    taskDetailMetaItem: {
        fontSize: 14,
        color: '#718096',
        marginBottom: 6,
        fontWeight: '500',
        letterSpacing: 0.2,
    },
    taskDetailActions: {
        flexDirection: 'row',
        padding: 24,
        gap: 12,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    statusButton: {
        backgroundColor: '#667eea',
    },
    deleteButton: {
        backgroundColor: '#EF4444',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    // Floating action button
    floatingButton: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: 'rgba(102, 126, 234, 0.4)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 16,
        elevation: 8,
    }                                           
     logoutContainer: {
        padding: 20,
        alignItems: 'center',
    },
    logoutButton: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
=======
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NetworkInfo } from 'react-native-network-info';

export default function DashboardScreen() {
    const router = useRouter();
    const [userData, setUserData] = useState({
        name: "",
        mobile: "",
        lastLogin: ""
    });
    const [deviceInfo, setDeviceInfo] = useState({
        brand: '', model: '', os: '', manufacturer: '', deviceType: '', isDevice: '', memory: '', architecture: ''
    });
    const [macAddress, setMacAddress] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUserData();
        loadDeviceInfo();

        NetworkInfo.getMACAddress().then(mac => {
            setMacAddress(mac);
        });
    }, []);

    const loadDeviceInfo = async () => {
        setDeviceInfo({
            brand: Device.brand || 'Unknown',
            model: Device.modelName || 'Unknown Model',
            os: `${Device.osName} ${Device.osVersion}` || 'Unknown OS',
            manufacturer: Device.manufacturer || 'Unknown',
            deviceType: getDeviceType(Device.deviceType),
            isDevice: Device.isDevice ? 'Yes' : 'No',
            memory: Device.totalMemory ? `${(Device.totalMemory / (1024 * 1024 * 1024)).toFixed(1)} GB` : 'Unknown',
            architecture: Array.isArray(Device.supportedCpuArchitectures) ? Device.supportedCpuArchitectures.join(', ') : 'Unknown'
        });
    };

    const getDeviceType = (type) => {
        switch (type) {
            case 1: return 'Phone';
            case 2: return 'Tablet';
            case 3: return 'Desktop';
            case 4: return 'TV';
            default: return 'Unknown';
        }
    };

    const loadUserData = async () => {
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const storedMobile = await SecureStore.getItemAsync('userMobile');
            const lastLoginTime = await SecureStore.getItemAsync('lastLoginTime');

            if (!token) {
                router.replace('/LoginScreen');
                return;
            }

            if (storedMobile) {
                const loginTime = lastLoginTime
                    ? new Date(lastLoginTime).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                    : 'Recently';

                setUserData({
                    name: `User ${storedMobile.slice(-4)}`,
                    mobile: formatMobileNumber(storedMobile),
                    lastLogin: loginTime
                });
            } else {
                try {
                    const tokenParts = token.split('.');
                    if (tokenParts.length === 3) {
                        const payload = JSON.parse(atob(tokenParts[1]));
                        const mobile = payload.mobileNumber || payload.mobile || payload.phone;

                        if (mobile) {
                            setUserData({
                                name: `User ${mobile.slice(-4)}`,
                                mobile: formatMobileNumber(mobile),
                                lastLogin: 'Recently'
                            });
                            await SecureStore.setItemAsync('userMobile', mobile);
                        }
                    }
                } catch (jwtError) {
                    console.log('Could not decode JWT:', jwtError);
                    router.replace('/LoginScreen');
                    return;
                }
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
            router.replace('/LoginScreen');
        } finally {
            setLoading(false);
        }
    };

    const formatMobileNumber = (mobile) => {
        const cleanMobile = mobile.replace(/\D/g, '');
        if (cleanMobile.length === 10) {
            return `+91 ${cleanMobile.slice(0, 5)} ${cleanMobile.slice(5)}`;
        }
        return mobile;
    };

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('authToken');
        await SecureStore.deleteItemAsync('userMobile');
        await SecureStore.deleteItemAsync('lastLoginTime');
        router.replace('/LoginScreen');
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading your dashboard...</Text>
            </SafeAreaView>
        );
    }

    const QuickActionCard = ({ title, subtitle, onPress, color = "#007AFF" }) => (
        <Pressable style={[styles.quickActionCard, { borderLeftColor: color }]} onPress={onPress}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </Pressable>
    );

    const StatCard = ({ title, value, color = "#34C759" }) => (
        <View style={[styles.statCard, { backgroundColor: color + '15' }]}>            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
        </View>
    );

    const getInitials = (name, mobile) => {
        if (name && name !== `User ${mobile.slice(-4)}`) {
            return name.charAt(0).toUpperCase();
        }
        return mobile.slice(-2);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.welcomeSection}>
                        <Text style={styles.welcomeText}>Welcome back,</Text>
                        <Text style={styles.userName}>{userData.name}</Text>
                        <Text style={styles.lastLogin}>Last login: {userData.lastLogin}</Text>
                    </View>
                    <View style={styles.profileCircle}>
                        <Text style={styles.profileInitial}>
                            {getInitials(userData.name, userData.mobile)}
                        </Text>
                    </View>
                </View>

                <View style={styles.userInfoCard}>
                    <Text style={styles.userInfoTitle}>Account Information</Text>
                    <View style={styles.userInfoRow}>
                        <Text style={styles.userInfoLabel}>Mobile Number</Text>
                        <Text style={styles.userInfoValue}>{userData.mobile || 'Not available'}</Text>
                    </View>
                    <View style={styles.userInfoRow}>
                        <Text style={styles.userInfoLabel}>Account Status</Text>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>Active</Text>
                        </View>
                    </View>
                    <View style={styles.userInfoRow}>
                        <Text style={styles.userInfoLabel}>Device</Text>
                        <Text style={styles.userInfoValue}>{deviceInfo.brand} {deviceInfo.model}</Text>
                    </View>
                    <View style={styles.userInfoRow}>
                        <Text style={styles.userInfoLabel}>OS</Text>
                        <Text style={styles.userInfoValue}>{deviceInfo.os}</Text>
                    </View>
                    <View style={styles.userInfoRow}>
                        <Text style={styles.userInfoLabel}>Manufacturer</Text>
                        <Text style={styles.userInfoValue}>{deviceInfo.manufacturer}</Text>
                    </View>
                    <View style={styles.userInfoRow}>
                        <Text style={styles.userInfoLabel}>Device Type</Text>
                        <Text style={styles.userInfoValue}>{deviceInfo.deviceType}</Text>
                    </View>
                    <View style={styles.userInfoRow}>
                        <Text style={styles.userInfoLabel}>Physical Device</Text>
                        <Text style={styles.userInfoValue}>{deviceInfo.isDevice}</Text>
                    </View>
                    <View style={styles.userInfoRow}>
                        <Text style={styles.userInfoLabel}>Memory</Text>
                        <Text style={styles.userInfoValue}>{deviceInfo.memory}</Text>
                    </View>
                    <View style={styles.userInfoRow}>
                        <Text style={styles.userInfoLabel}>CPU</Text>
                        <Text style={styles.userInfoValue}>{deviceInfo.architecture}</Text>
                    </View>
                    <View style={styles.userInfoRow}>
                        <Text style={styles.userInfoLabel}>MAC Address</Text>
                        <Text style={styles.userInfoValue}>{macAddress || 'Not available'}</Text>
                    </View>
                </View>

                <View style={styles.statsContainer}>
                    <Text style={styles.sectionTitle}>Overview</Text>
                    <View style={styles.statsRow}>
                        <StatCard title="Notifications" value="12" color="#007AFF" />
                        <StatCard title="Updates" value="3" color="#FF9500" />
                    </View>
                </View>

                <View style={styles.quickActionsContainer}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <QuickActionCard title="View Profile" subtitle="Manage your account details" color="#007AFF" onPress={() => {}} />
                    <QuickActionCard title="Notifications" subtitle="Check your recent notifications" color="#34C759" onPress={() => {}} />
                    <QuickActionCard title="Settings" subtitle="Configure app preferences" color="#FF9500" onPress={() => {}} />
                    <QuickActionCard title="Help & Support" subtitle="Get help with the app" color="#5856D6" onPress={() => {}} />
                </View>

                <View style={styles.logoutContainer}>
                    <Pressable style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutButtonText}>Logout</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 25,
        backgroundColor: '#fff',
        marginBottom: 15,
    },
    welcomeSection: {
        flex: 1,
    },
    welcomeText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 2,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    lastLogin: {
        fontSize: 14,
        color: '#999',
    },
    profileCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInitial: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    userInfoCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    userInfoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    userInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    userInfoLabel: {
        fontSize: 16,
        color: '#666',
    },
    userInfoValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    statusBadge: {
        backgroundColor: '#34C759',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    statsContainer: {
        paddingHorizontal: 20,
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statCard: {
        flex: 1,
        padding: 20,
        borderRadius: 12,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    statTitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    quickActionsContainer: {
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    quickActionCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    logoutContainer: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    logoutButton: {
        backgroundColor: '#FF3B30',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
>>>>>>> 4000beeff4c693dae137a8e219e9a022a1e5920a
});