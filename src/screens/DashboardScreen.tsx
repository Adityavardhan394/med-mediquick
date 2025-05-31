import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Chatbot from '../components/Chatbot';

const categories = [
  { id: '1', name: 'All Medicines', icon: 'medical-services' },
  { id: '2', name: 'Pain Relief', icon: 'healing' },
  { id: '3', name: 'Antibiotics', icon: 'science' },
  { id: '4', name: 'Cardiac Care', icon: 'favorite' },
  { id: '5', name: 'Mental Health', icon: 'psychology' },
  { id: '6', name: 'Allergies', icon: 'air' },
];

const featuredMedicines = [
  {
    id: '1',
    name: 'Paracetamol',
    brand: 'Dolo',
    price: '₹20',
    image: require('../../assets/medicine1.png'),
    inStock: true,
  },
  {
    id: '2',
    name: 'Aspirin',
    brand: 'Bayer',
    price: '₹15',
    image: require('../../assets/medicine2.png'),
    inStock: true,
  },
  // Add more medicines
];

const DashboardScreen = () => {
  const { t } = useTranslation();
  const [showChat, setShowChat] = useState(false);

  const toggleChat = () => {
    setShowChat(!showChat);
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity style={styles.categoryItem}>
      <View style={styles.categoryIcon}>
        <Icon name={item.icon} size={24} color="#00b386" />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderMedicineItem = ({ item }) => (
    <TouchableOpacity style={styles.medicineCard}>
      <Image source={item.image} style={styles.medicineImage} />
      <View style={styles.medicineInfo}>
        <Text style={styles.medicineName}>{item.name}</Text>
        <Text style={styles.medicineBrand}>{item.brand}</Text>
        <View style={styles.medicineFooter}>
          <Text style={styles.medicinePrice}>{item.price}</Text>
          <TouchableOpacity style={styles.addButton}>
            <Icon name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      {item.inStock ? (
        <View style={styles.stockBadge}>
          <Text style={styles.stockText}>In Stock</Text>
        </View>
      ) : (
        <View style={[styles.stockBadge, styles.outOfStock]}>
          <Text style={[styles.stockText, styles.outOfStockText]}>Out of Stock</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <LinearGradient
          colors={['#00b386', '#008f6c']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Hello!</Text>
              <Text style={styles.locationText}>
                <Icon name="location-on" size={16} color="#fff" />
                Deliver to: Home
              </Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.chatButton}
                onPress={toggleChat}
                accessibilityRole="button"
                accessibilityLabel={t('dashboard.toggleChat')}
              >
                <Icon name={showChat ? 'close' : 'chat'} size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.notificationButton}>
                <Icon name="notifications" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <TouchableOpacity style={styles.searchBar}>
            <Icon name="search" size={24} color="#666" />
            <Text style={styles.searchText}>Search medicines, categories...</Text>
          </TouchableOpacity>
        </LinearGradient>

        {showChat ? (
          <View style={styles.chatContainer}>
            <Chatbot />
          </View>
        ) : (
          <>
            {/* Categories */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <FlatList
                data={categories}
                renderItem={renderCategoryItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesList}
              />
            </View>

            {/* Featured Medicines */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Featured Medicines</Text>
              <FlatList
                data={featuredMedicines}
                renderItem={renderMedicineItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.medicinesList}
              />
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.actionCard}>
                <Icon name="local-hospital" size={24} color="#00b386" />
                <Text style={styles.actionText}>Upload Prescription</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Icon name="science" size={24} color="#00b386" />
                <Text style={styles.actionText}>Lab Tests</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Icon name="medical-services" size={24} color="#00b386" />
                <Text style={styles.actionText}>Consultations</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafb',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  locationText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  searchText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 16,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  categoriesList: {
    paddingRight: 20,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 179, 134, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#2c3e50',
    textAlign: 'center',
  },
  medicinesList: {
    paddingRight: 20,
  },
  medicineCard: {
    width: 180,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginRight: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  medicineImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  medicineBrand: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  medicineFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  medicinePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00b386',
  },
  addButton: {
    backgroundColor: '#00b386',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 179, 134, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockText: {
    fontSize: 12,
    color: '#00b386',
    fontWeight: '500',
  },
  outOfStock: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  outOfStockText: {
    color: '#ff6b6b',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#2c3e50',
    textAlign: 'center',
    marginTop: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContainer: {
    flex: 1,
    height: 600,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default DashboardScreen; 