import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  I18nManager,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '../hooks/useDebounce';
import FilterModal from './FilterModal';
import LanguageSwitcher from './LanguageSwitcher';
import AccessibilityWrapper from './AccessibilityWrapper';
import { medicines } from '../data/medicines';

const MedicineSearch = () => {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    priceRange: { min: 0, max: 1000 },
    brand: '',
    generic: false,
    inStock: true,
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (debouncedSearch || Object.values(filters).some(value => value !== '' && value !== false)) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [debouncedSearch, filters]);

  const performSearch = () => {
    setLoading(true);
    try {
      const filteredMedicines = medicines.filter(medicine => {
        const matchesSearch = medicine.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                            medicine.brand.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                            medicine.description.toLowerCase().includes(debouncedSearch.toLowerCase());

        const matchesPrice = medicine.price >= filters.priceRange.min && 
                           medicine.price <= filters.priceRange.max;

        const matchesBrand = !filters.brand || 
                           medicine.brand.toLowerCase().includes(filters.brand.toLowerCase());

        const matchesGeneric = !filters.generic || medicine.generic;

        const matchesStock = !filters.inStock || medicine.inStock;

        return matchesSearch && matchesPrice && matchesBrand && matchesGeneric && matchesStock;
      });

      setResults(filteredMedicines);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMedicineSelection = (medicine) => {
    if (selectedMedicines.find(m => m.id === medicine.id)) {
      setSelectedMedicines(selectedMedicines.filter(m => m.id !== medicine.id));
    } else {
      if (selectedMedicines.length < 3) {
        setSelectedMedicines([...selectedMedicines, medicine]);
      }
    }
  };

  const renderMedicineItem = ({ item }) => (
    <AccessibilityWrapper
      accessibilityRole="button"
      accessibilityLabel={t('accessibility.medicineItem')}
      accessibilityHint={t('accessibility.selectMedicine')}
      accessibilityState={{ selected: selectedMedicines.find(m => m.id === item.id) }}
    >
      <TouchableOpacity
        style={styles.medicineItem}
        onPress={() => toggleMedicineSelection(item)}
      >
        <View style={styles.medicineInfo}>
          <Text style={styles.medicineName}>{item.name}</Text>
          <Text style={styles.medicineBrand}>{item.brand}</Text>
          <Text style={styles.medicinePrice}>₹{item.price}</Text>
          <Text style={styles.medicineDescription}>{item.description}</Text>
        </View>
        <MaterialIcons
          name={selectedMedicines.find(m => m.id === item.id) ? 'check-circle' : 'radio-button-unchecked'}
          size={24}
          color="#00b386"
        />
      </TouchableOpacity>
    </AccessibilityWrapper>
  );

  const renderComparisonModal = () => (
    <Modal
      visible={showComparison}
      animationType="slide"
      transparent={true}
    >
      <AccessibilityWrapper
        accessibilityRole="dialog"
        accessibilityLabel={t('comparison.title')}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('comparison.title')}</Text>
              <TouchableOpacity
                onPress={() => setShowComparison(false)}
                accessibilityRole="button"
                accessibilityLabel={t('accessibility.closeModal')}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.comparisonGrid}>
              <View style={styles.comparisonHeader}>
                <Text style={styles.headerText}>{t('comparison.features')}</Text>
                {selectedMedicines.map(medicine => (
                  <Text key={medicine.id} style={styles.medicineHeader}>
                    {medicine.name}
                  </Text>
                ))}
              </View>
              {['Price', 'Dosage', 'Side Effects', 'Manufacturer', 'Category', 'Prescription Required'].map(feature => (
                <View key={feature} style={styles.comparisonRow}>
                  <Text style={styles.featureLabel}>{t(`medicine.${feature.toLowerCase().replace(' ', '')}`)}</Text>
                  {selectedMedicines.map(medicine => (
                    <Text key={medicine.id} style={styles.featureValue}>
                      {feature === 'Price' ? `₹${medicine.price}` :
                       feature === 'Prescription Required' ? (medicine.prescription_required ? t('comparison.yes') : t('comparison.no')) :
                       medicine[feature.toLowerCase().replace(' ', '_')]}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </View>
        </View>
      </AccessibilityWrapper>
    </Modal>
  );

  return (
    <AccessibilityWrapper style={styles.container}>
      <View style={styles.header}>
        <LanguageSwitcher />
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, I18nManager.isRTL && styles.rtlInput]}
          placeholder={t('common.search')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel={t('accessibility.searchInput')}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
          accessibilityRole="button"
          accessibilityLabel={t('accessibility.filterButton')}
        >
          <MaterialIcons name="filter-list" size={24} color="#00b386" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00b386" />
      ) : (
        <FlatList
          data={results}
          renderItem={renderMedicineItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="search-off" size={48} color="#666" />
              <Text style={styles.emptyText}>{t('common.noResults')}</Text>
            </View>
          }
        />
      )}

      {selectedMedicines.length > 0 && (
        <TouchableOpacity
          style={styles.compareButton}
          onPress={() => setShowComparison(true)}
          accessibilityRole="button"
          accessibilityLabel={t('accessibility.compareButton')}
        >
          <Text style={styles.compareButtonText}>
            {t('common.compare')} ({selectedMedicines.length})
          </Text>
        </TouchableOpacity>
      )}

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApplyFilters={setFilters}
      />

      {renderComparisonModal()}
    </AccessibilityWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    paddingHorizontal: 20,
    fontSize: 16,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  rtlInput: {
    writingDirection: 'rtl',
  },
  filterButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  resultsList: {
    padding: 16,
  },
  medicineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  medicineBrand: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  medicinePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00b386',
    marginTop: 4,
  },
  medicineDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  compareButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: '#00b386',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  compareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
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
  comparisonGrid: {
    flex: 1,
  },
  comparisonHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 12,
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
    fontWeight: '600',
    color: '#333',
  },
  medicineHeader: {
    flex: 1,
    fontWeight: '600',
    color: '#00b386',
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  featureLabel: {
    flex: 1,
    color: '#666',
  },
  featureValue: {
    flex: 1,
    textAlign: 'center',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
});

export default MedicineSearch; 