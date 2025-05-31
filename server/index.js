const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static translation files
app.get('/translations/:language', async (req, res) => {
  try {
    const { language } = req.params;
    const filePath = path.join(__dirname, 'translations', `${language}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(404).json({ error: 'Translation file not found' });
  }
});

// Get medicine data with translations
app.get('/medicines/:language', async (req, res) => {
  try {
    const { language } = req.params;
    const medicines = require('./data/medicines');
    const translations = require(`./translations/${language}.json`);

    // Translate medicine data
    const translatedMedicines = medicines.map(medicine => ({
      ...medicine,
      category: translations.medicine.categories[medicine.category] || medicine.category,
      description: translations.medicine.descriptions[medicine.id] || medicine.description,
      side_effects: translations.medicine.sideEffects[medicine.id] || medicine.side_effects
    }));

    res.json(translatedMedicines);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching medicine data' });
  }
});

// Get available languages
app.get('/languages', (req, res) => {
  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' }
  ];
  res.json(languages);
});

// Update translation file
app.post('/translations/:language', async (req, res) => {
  try {
    const { language } = req.params;
    const { translations } = req.body;
    const filePath = path.join(__dirname, 'translations', `${language}.json`);
    await fs.writeFile(filePath, JSON.stringify(translations, null, 2));
    res.json({ message: 'Translations updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error updating translations' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 