import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

const FilterModal = ({ visible, onClose, filters, onApplyFilters }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters({
      priceRange: { min: 0, max: 1000 },
      brand: '',
      generic: false,
      inStock: true,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Medicines</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContent}>
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Price Range</Text>
              <View style={styles.priceRangeContainer}>
                <Text style={styles.priceLabel}>
                  ₹{localFilters.priceRange.min} - ₹{localFilters.priceRange.max}
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={1000}
                  step={10}
                  value={localFilters.priceRange.max}
                  onValueChange={(value) =>
                    setLocalFilters({
                      ...localFilters,
                      priceRange: { ...localFilters.priceRange, max: value },
                    })
                  }
                  minimumTrackTintColor="#00b386"
                  maximumTrackTintColor="#ddd"
                  thumbTintColor="#00b386"
                />
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Brand</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter brand name"
                value={localFilters.brand}
                onChangeText={(text) =>
                  setLocalFilters({ ...localFilters, brand: text })
                }
              />
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Generic Medicine</Text>
              <Switch
                value={localFilters.generic}
                onValueChange={(value) =>
                  setLocalFilters({ ...localFilters, generic: value })
                }
                trackColor={{ false: '#ddd', true: '#00b386' }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>In Stock</Text>
              <Switch
                value={localFilters.inStock}
                onValueChange={(value) =>
                  setLocalFilters({ ...localFilters, inStock: value })
                }
                trackColor={{ false: '#ddd', true: '#00b386' }}
                thumbColor="#fff"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={handleReset}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.applyButton]}
              onPress={handleApply}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  filterContent: {
    maxHeight: '70%',
  },
  filterSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  priceRangeContainer: {
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 12,
  },
  applyButton: {
    backgroundColor: '#00b386',
    marginLeft: 12,
  },
  resetButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FilterModal; 