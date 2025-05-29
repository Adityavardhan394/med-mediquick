import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Dimensions,
    Animated,
    Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';

const { width } = Dimensions.get('window');

const PrescriptionVerification = () => {
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const processingAnim = useRef(null);

    const animateIn = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (status !== 'granted') {
            setError('Permission to access camera roll is required!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
            setError(null);
            animateIn();
        }
    };

    const takePicture = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        
        if (status !== 'granted') {
            setError('Permission to access camera is required!');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
            setError(null);
            animateIn();
        }
    };

    const verifyPrescription = async () => {
        try {
            setLoading(true);
            setError(null);

            const formData = new FormData();
            formData.append('prescription', {
                uri: image,
                type: 'image/jpeg',
                name: 'prescription.jpg',
            });

            const response = await axios.post(
                'http://your-api-url/api/verify-prescription',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            setResults(response.data);
            if (processingAnim.current) {
                processingAnim.current.play();
            }
        } catch (err) {
            setError(err.message || 'Failed to verify prescription');
        } finally {
            setLoading(false);
        }
    };

    const renderResults = () => {
        if (!results) return null;

        const { data, validation } = results;
        const isValid = validation.isValid;

        return (
            <Animated.View
                style={[
                    styles.resultsContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                <LinearGradient
                    colors={isValid ? ['#4CAF50', '#2E7D32'] : ['#FF9800', '#F57C00']}
                    style={styles.statusBanner}
                >
                    <FontAwesome5
                        name={isValid ? 'check-circle' : 'exclamation-triangle'}
                        size={24}
                        color="white"
                    />
                    <Text style={styles.statusText}>
                        {isValid ? 'Prescription Verified' : 'Verification Needed'}
                    </Text>
                </LinearGradient>

                <ScrollView style={styles.resultsScroll}>
                    {/* Doctor Information */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Doctor Information</Text>
                        <View style={styles.infoCard}>
                            <Text style={styles.label}>Name</Text>
                            <Text style={styles.value}>{data.doctor.name.value || 'Not found'}</Text>
                            <View style={styles.confidenceBar}>
                                <View
                                    style={[
                                        styles.confidenceFill,
                                        { width: `${data.doctor.name.confidence}%` },
                                    ]}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Patient Information */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Patient Information</Text>
                        <View style={styles.infoCard}>
                            <Text style={styles.label}>Name</Text>
                            <Text style={styles.value}>{data.patient.name.value || 'Not found'}</Text>
                            <Text style={styles.label}>Age</Text>
                            <Text style={styles.value}>{data.patient.age.value || 'Not found'}</Text>
                            <Text style={styles.label}>Gender</Text>
                            <Text style={styles.value}>{data.patient.gender.value || 'Not found'}</Text>
                        </View>
                    </View>

                    {/* Medications */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Prescribed Medications</Text>
                        {data.prescription.medications.map((med, index) => (
                            <View key={index} style={styles.medicationCard}>
                                <Text style={styles.medicationName}>{med.name}</Text>
                                <View style={styles.medicationDetails}>
                                    <Text style={styles.medicationInfo}>
                                        Dosage: {med.dosage}
                                    </Text>
                                    <Text style={styles.medicationInfo}>
                                        Frequency: {med.frequency}
                                    </Text>
                                </View>
                                <View style={styles.confidenceBar}>
                                    <View
                                        style={[
                                            styles.confidenceFill,
                                            { width: `${med.confidence}%` },
                                        ]}
                                    />
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Validation Warnings */}
                    {validation.warnings.length > 0 && (
                        <View style={styles.warningsContainer}>
                            {validation.warnings.map((warning, index) => (
                                <Text key={index} style={styles.warningText}>
                                    ⚠️ {warning}
                                </Text>
                            ))}
                        </View>
                    )}
                </ScrollView>

                <TouchableOpacity
                    style={styles.addToCartButton}
                    onPress={() => {/* Handle add to cart */}}
                >
                    <LinearGradient
                        colors={['#4CAF50', '#2E7D32']}
                        style={styles.gradientButton}
                    >
                        <MaterialIcons name="shopping-cart" size={24} color="white" />
                        <Text style={styles.buttonText}>Add to Cart</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.header}
            >
                <Text style={styles.title}>AI Prescription Verification</Text>
                <Text style={styles.subtitle}>
                    Upload or take a photo of your prescription
                </Text>
            </LinearGradient>

            <View style={styles.content}>
                {!image ? (
                    <View style={styles.uploadContainer}>
                        <LottieView
                            ref={processingAnim}
                            source={require('./assets/upload-animation.json')}
                            style={styles.uploadAnimation}
                            autoPlay
                            loop
                        />
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.uploadButton}
                                onPress={pickImage}
                            >
                                <LinearGradient
                                    colors={['#667eea', '#764ba2']}
                                    style={styles.gradientButton}
                                >
                                    <MaterialIcons name="photo-library" size={24} color="white" />
                                    <Text style={styles.buttonText}>Choose Photo</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.uploadButton}
                                onPress={takePicture}
                            >
                                <LinearGradient
                                    colors={['#764ba2', '#667eea']}
                                    style={styles.gradientButton}
                                >
                                    <MaterialIcons name="camera-alt" size={24} color="white" />
                                    <Text style={styles.buttonText}>Take Photo</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.previewContainer}>
                        <Image source={{ uri: image }} style={styles.preview} />
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <LottieView
                                    source={require('./assets/scanning-animation.json')}
                                    style={styles.scanningAnimation}
                                    autoPlay
                                    loop
                                />
                                <Text style={styles.loadingText}>Processing prescription...</Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.verifyButton}
                                onPress={verifyPrescription}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={['#667eea', '#764ba2']}
                                    style={styles.gradientButton}
                                >
                                    <MaterialIcons name="verified" size={24} color="white" />
                                    <Text style={styles.buttonText}>Verify Prescription</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {renderResults()}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6fa',
    },
    header: {
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginTop: 5,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    uploadContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    uploadAnimation: {
        width: 200,
        height: 200,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 20,
    },
    uploadButton: {
        width: '45%',
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    previewContainer: {
        alignItems: 'center',
    },
    preview: {
        width: width - 40,
        height: (width - 40) * 0.75,
        borderRadius: 10,
        marginBottom: 20,
    },
    loadingContainer: {
        alignItems: 'center',
    },
    scanningAnimation: {
        width: 150,
        height: 150,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        marginTop: 10,
    },
    verifyButton: {
        width: '100%',
        marginTop: 20,
    },
    errorContainer: {
        backgroundColor: '#ffebee',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
    },
    errorText: {
        color: '#c62828',
        textAlign: 'center',
    },
    resultsContainer: {
        marginTop: 20,
        backgroundColor: 'white',
        borderRadius: 15,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
    },
    statusText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 10,
    },
    resultsScroll: {
        maxHeight: 400,
    },
    section: {
        padding: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a237e',
        marginBottom: 10,
    },
    infoCard: {
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 10,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    value: {
        fontSize: 16,
        color: '#333',
        marginBottom: 10,
    },
    medicationCard: {
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    medicationName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    medicationDetails: {
        marginTop: 5,
    },
    medicationInfo: {
        fontSize: 14,
        color: '#666',
        marginBottom: 3,
    },
    confidenceBar: {
        height: 4,
        backgroundColor: '#e0e0e0',
        borderRadius: 2,
        marginTop: 10,
        overflow: 'hidden',
    },
    confidenceFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
    },
    warningsContainer: {
        padding: 15,
    },
    warningText: {
        color: '#f57c00',
        marginBottom: 5,
    },
    addToCartButton: {
        margin: 15,
    },
});

export default PrescriptionVerification; 