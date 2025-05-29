import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
  Modal,
  Platform
} from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

const PrescriptionVerification = ({ navigation }) => {
  // State management
  const [hasPermission, setHasPermission] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [extractedData, setExtractedData] = useState(null);
  const [validationResults, setValidationResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [overallConfidence, setOverallConfidence] = useState(0);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Processing steps
  const processingSteps = [
    { icon: 'eye', title: 'Image Recognition', description: 'Analyzing prescription image' },
    { icon: 'text-fields', title: 'Text Extraction', description: 'Extracting text using OCR' },
    { icon: 'verified', title: 'Validation', description: 'Validating prescription data' },
    { icon: 'security', title: 'Security Check', description: 'Verifying authenticity' }
  ];

  useEffect(() => {
    getCameraPermissions();
    animateEntrance();
  }, []);

  useEffect(() => {
    if (isProcessing) {
      animateProcessing();
    }
  }, [isProcessing]);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  };

  const animateProcessing = () => {
    // Pulse animation for AI brain
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    ).start();

    // Progress animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 8000,
      useNativeDriver: false,
    }).start();
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
        processImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  const takePhoto = async () => {
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return;
    }
    setShowCamera(true);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        setSelectedImage(result);
        processImage(result);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const processImage = async (imageData) => {
    setIsProcessing(true);
    setProcessingStep(0);

    try {
      // Simulate processing steps
      for (let i = 0; i < processingSteps.length; i++) {
        setProcessingStep(i);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Call backend API
      const formData = new FormData();
      formData.append('prescription', {
        uri: imageData.uri,
        type: imageData.type || 'image/jpeg',
        name: imageData.name || 'prescription.jpg',
      });

      const response = await fetch('http://your-backend-url/api/verify-prescription', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();

      if (result.success) {
        setExtractedData(result.data.extractedData);
        setValidationResults(result.data.validationResults);
        setOverallConfidence(result.data.overallConfidence);
        setShowResults(true);
      } else {
        throw new Error(result.error || 'Failed to process prescription');
      }
    } catch (error) {
      Alert.alert('Processing Error', error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderUploadOptions = () => (
    <View style={styles.uploadContainer}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradientHeader}
      >
        <Text style={styles.headerTitle}>AI Prescription Verification</Text>
        <Text style={styles.headerSubtitle}>
          Upload your prescription for instant verification
        </Text>
      </LinearGradient>

      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.optionCard} onPress={takePhoto}>
          <LinearGradient
            colors={['#4facfe', '#00f2fe']}
            style={styles.optionGradient}
          >
            <Ionicons name="camera" size={40} color="white" />
            <Text style={styles.optionTitle}>Take Photo</Text>
            <Text style={styles.optionDescription}>
              Capture prescription with camera
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionCard} onPress={pickImageFromGallery}>
          <LinearGradient
            colors={['#f093fb', '#f5576c']}
            style={styles.optionGradient}
          >
            <Ionicons name="images" size={40} color="white" />
            <Text style={styles.optionTitle}>Gallery</Text>
            <Text style={styles.optionDescription}>
              Choose from photo library
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionCard} onPress={pickDocument}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.optionGradient}
          >
            <Ionicons name="document" size={40} color="white" />
            <Text style={styles.optionTitle}>Document</Text>
            <Text style={styles.optionDescription}>
              Upload PDF or image file
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProcessing = () => (
    <View style={styles.processingContainer}>
      <BlurView intensity={80} style={styles.blurContainer}>
        <Animated.View
          style={[
            styles.aiBrain,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2', '#f093fb']}
            style={styles.brainGradient}
          >
            <MaterialIcons name="psychology" size={60} color="white" />
          </LinearGradient>
        </Animated.View>

        <Text style={styles.processingTitle}>AI is Analyzing Your Prescription</Text>
        <Text style={styles.processingSubtitle}>
          Please wait while our advanced AI processes your document
        </Text>

        <View style={styles.stepsContainer}>
          {processingSteps.map((step, index) => (
            <View
              key={index}
              style={[
                styles.stepItem,
                { opacity: index <= processingStep ? 1 : 0.3 }
              ]}
            >
              <View style={[
                styles.stepIcon,
                { backgroundColor: index <= processingStep ? '#00b386' : '#e0e0e0' }
              ]}>
                <MaterialIcons
                  name={step.icon}
                  size={24}
                  color={index <= processingStep ? 'white' : '#999'}
                />
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round((processingStep + 1) / processingSteps.length * 100)}% Complete
          </Text>
        </View>
      </BlurView>
    </View>
  );

  const renderResults = () => (
    <ScrollView style={styles.resultsContainer}>
      <View style={styles.resultsHeader}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={80} color="#00b386" />
        </View>
        <Text style={styles.resultsTitle}>Prescription Verified Successfully!</Text>
        <Text style={styles.resultsSubtitle}>
          Overall Confidence: {overallConfidence}%
        </Text>
      </View>

      {/* Extracted Data */}
      <View style={styles.dataSection}>
        <Text style={styles.sectionTitle}>Extracted Information</Text>
        {extractedData && Object.entries(extractedData).map(([key, value]) => {
          if (key === 'medications') return null;
          return (
            <View key={key} style={styles.dataField}>
              <Text style={styles.fieldLabel}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Text>
              <Text style={styles.fieldValue}>{value?.value || 'Not detected'}</Text>
              <View style={styles.confidenceBar}>
                <View
                  style={[
                    styles.confidenceFill,
                    { width: `${value?.confidence || 0}%` }
                  ]}
                />
              </View>
              <Text style={styles.confidenceText}>
                Confidence: {value?.confidence || 0}%
              </Text>
            </View>
          );
        })}
      </View>

      {/* Medications */}
      {extractedData?.medications && extractedData.medications.length > 0 && (
        <View style={styles.dataSection}>
          <Text style={styles.sectionTitle}>Prescribed Medications</Text>
          {extractedData.medications.map((med, index) => (
            <View key={index} style={styles.medicationCard}>
              <View style={styles.medicationHeader}>
                <Text style={styles.medicationName}>{med.name}</Text>
                <View style={[
                  styles.validationBadge,
                  { backgroundColor: med.isValid ? '#00b386' : '#ff6b6b' }
                ]}>
                  <Text style={styles.badgeText}>
                    {med.isValid ? 'Valid' : 'Unknown'}
                  </Text>
                </View>
              </View>
              <Text style={styles.medicationDosage}>{med.dosage}</Text>
              <View style={styles.confidenceBar}>
                <View
                  style={[
                    styles.confidenceFill,
                    { width: `${med.confidence}%` }
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Validation Results */}
      <View style={styles.dataSection}>
        <Text style={styles.sectionTitle}>Validation Results</Text>
        {validationResults.map((result, index) => (
          <View
            key={index}
            style={[
              styles.validationCard,
              { borderLeftColor: getValidationColor(result.type) }
            ]}
          >
            <Ionicons
              name={getValidationIcon(result.type)}
              size={24}
              color={getValidationColor(result.type)}
            />
            <Text style={styles.validationMessage}>{result.message}</Text>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => navigation.navigate('Cart')}
        >
          <LinearGradient
            colors={['#00b386', '#009973']}
            style={styles.buttonGradient}
          >
            <Ionicons name="cart" size={24} color="white" />
            <Text style={styles.buttonText}>Add to Cart</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => {
            setShowResults(false);
            setSelectedImage(null);
            setExtractedData(null);
          }}
        >
          <Text style={styles.secondaryButtonText}>Upload Another</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const getValidationColor = (type) => {
    switch (type) {
      case 'success': return '#00b386';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getValidationIcon = (type) => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'error': return 'close-circle';
      default: return 'information-circle';
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {!selectedImage && !isProcessing && !showResults && renderUploadOptions()}
        {isProcessing && renderProcessing()}
        {showResults && renderResults()}
      </Animated.View>

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide">
        <Camera
          style={styles.camera}
          type={Camera.Constants.Type.back}
          onBarCodeScanned={() => {}}
        >
          <View style={styles.cameraOverlay}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCamera(false)}
            >
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
            
            <View style={styles.captureContainer}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={async () => {
                  // Implement camera capture logic
                  setShowCamera(false);
                }}
              >
                <View style={styles.captureInner} />
              </TouchableOpacity>
            </View>
          </View>
        </Camera>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafb',
  },
  content: {
    flex: 1,
  },
  uploadContainer: {
    flex: 1,
  },
  gradientHeader: {
    padding: 40,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  optionsContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  optionCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  optionGradient: {
    padding: 30,
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  blurContainer: {
    width: '100%',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  aiBrain: {
    marginBottom: 30,
  },
  brainGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  processingSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  stepsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  stepDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00b386',
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  resultsHeader: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#f8fafb',
  },
  successIcon: {
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultsSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  dataSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 20,
  },
  dataField: {
    backgroundColor: '#f8fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  confidenceBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#00b386',
  },
  confidenceText: {
    fontSize: 12,
    color: '#6b7280',
  },
  medicationCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  validationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  medicationDosage: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  validationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  validationMessage: {
    fontSize: 14,
    color: '#1f2937',
    marginLeft: 12,
    flex: 1,
  },
  actionButtons: {
    padding: 20,
    paddingBottom: 40,
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryButton: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#00b386',
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00b386',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureContainer: {
    alignItems: 'center',
    paddingBottom: 50,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00b386',
  },
});

export default PrescriptionVerification; 