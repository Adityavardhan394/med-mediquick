# 🏥 MediQuick AI Voice Assistant

An advanced AI-powered voice assistant integrated into the MediQuick medical platform, designed to provide accurate, safe, and comprehensive information about medicines and health queries.

## 🌟 Features

### 🎤 Voice Input & Output
- **Real-time speech recognition** using Web Speech API
- **Natural language processing** for medical terminology
- **Text-to-speech responses** with adjustable voice characteristics
- **Audio visualization** during voice input

### 🧠 Advanced Medical Intelligence
- **Comprehensive medicine database** with 6+ common medications
- **Symptom-based recommendations** with safety checks
- **Drug interaction warnings** and contraindications
- **Emergency detection** for dangerous queries
- **Fuzzy matching** for medicine name variations (Tylenol → Paracetamol)

### 🔒 Safety & Ethics
- **Medical disclaimers** on all responses
- **Emergency response protocols** for dangerous queries
- **Prescription medicine warnings** clearly marked
- **HIPAA-compliant** data handling (no sensitive data stored)
- **Professional medical advice** recommendations

### 💊 Supported Medicines
- **Paracetamol** (Acetaminophen, Tylenol, Crocin) - Pain Relief
- **Ibuprofen** (Advil, Motrin, Brufen) - Anti-inflammatory
- **Aspirin** (Bayer, Disprin) - Heart Health/Pain Relief
- **Cetirizine** (Zyrtec) - Allergy Relief
- **Omeprazole** (Prilosec) - Acid Reflux
- **Metformin** (Glucophage) - Diabetes Care

## 🚀 Quick Start

### Frontend (Voice Assistant UI)
1. Open `medicines.html` in a modern web browser
2. Click the **"AI Assistant"** button in the header
3. Allow microphone permissions when prompted
4. Click the microphone button and start speaking
5. View transcription and AI response in real-time

### Backend (Advanced Processing)
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start the backend server
python medical_ai_backend.py

# Server will start on http://localhost:5000
```

## 📋 Usage Examples

### Voice Queries
- *"What is paracetamol used for?"*
- *"Side effects of ibuprofen"*
- *"Can I take aspirin with food?"*
- *"What helps with allergies?"*
- *"Dosage for omeprazole"*

### Quick Questions (Click to Ask)
- Pre-defined common questions for instant responses
- No voice input required
- Immediate AI processing and response

### Emergency Detection
The system automatically detects dangerous keywords and provides emergency guidance:
- Overdose situations
- Severe allergic reactions
- Chest pain or heart attack symptoms
- Stroke indicators

## 🛠️ Technical Architecture

### Frontend Components
```javascript
class MedicalVoiceAssistant {
  // Speech recognition and synthesis
  // Medical knowledge base
  // Query processing and response generation
  // Safety checks and emergency detection
}
```

### Backend API Endpoints
```python
POST /api/medical-query    # Process medical queries
GET  /api/medicines        # Get available medicines
GET  /api/health          # Health check
```

### Data Flow
1. **Voice Input** → Speech-to-Text API
2. **Text Processing** → Medical term normalization
3. **Query Analysis** → Intent classification & entity extraction
4. **Safety Check** → Emergency keyword detection
5. **Response Generation** → Medical knowledge base lookup
6. **Voice Output** → Text-to-Speech synthesis

## 🔧 Setup Instructions

### Prerequisites
- Modern web browser with microphone support
- Python 3.8+ (for backend)
- Internet connection for CDN resources

### Frontend Setup
1. Clone or download the project files
2. Open `medicines.html` in your browser
3. Ensure microphone permissions are granted
4. The voice assistant is ready to use!

### Backend Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python medical_ai_backend.py
```

### Integration with Frontend
Update the JavaScript to use the backend API:
```javascript
// In medicines.html, update the processQuery method
async processQuery(transcript) {
  const response = await fetch('http://localhost:5000/api/medical-query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: transcript })
  });
  const data = await response.json();
  this.displayResponse(data.response);
}
```

## 🧪 Testing

### Run Automated Tests
```bash
# Run all tests
python test_medical_ai.py

# Run specific test categories
pytest test_medical_ai.py::TestSafetyFeatures -v
pytest test_medical_ai.py::TestMedicalQueryProcessor -v
```

### Manual Testing Checklist
- [ ] Voice recognition works with medical terms
- [ ] Emergency queries trigger appropriate responses
- [ ] Medical disclaimers appear on all responses
- [ ] Prescription medicines show warnings
- [ ] Unknown medicines handled gracefully
- [ ] Text-to-speech works with natural voice

## 🔒 Safety & Compliance

### Medical Disclaimers
All responses include the standard medical disclaimer:
> ⚠️ This information is for educational purposes only and is not a substitute for professional medical advice. Always consult with a healthcare provider for medical concerns.

### Emergency Protocols
- **Immediate detection** of emergency keywords
- **Clear instructions** to call emergency services
- **No medical advice** given for emergency situations
- **Professional care** recommendations

### Data Privacy
- **No sensitive data stored** on servers
- **Local processing** for voice recognition
- **Secure API calls** with no personal information
- **HIPAA-compliant** architecture

## 🎯 Example Interactions

### Medicine Information Query
**User:** *"What is ibuprofen used for?"*

**AI Response:** 
> Ibuprofen (NSAID) is commonly used for:
> • Pain relief
> • Inflammation reduction  
> • Fever reduction
> • Arthritis
> 
> **Typical Dosage:** 200-400mg every 4-6 hours, maximum 1.2g daily
> **Key Warning:** Take with food to reduce stomach irritation
> 
> ⚠️ MEDICAL DISCLAIMER: This information is for educational purposes only...

### Emergency Detection
**User:** *"I think I took too many pills"*

**AI Response:**
> 🚨 MEDICAL EMERGENCY DETECTED 🚨
> 
> If you are experiencing a medical emergency, please:
> 1. Call emergency services immediately (911 in US, 999 in UK, 112 in EU)
> 2. Contact your local poison control center
> 3. Seek immediate medical attention at the nearest hospital

## 🔮 Future Enhancements

### Planned Features
- [ ] **Multi-language support** (Spanish, French, etc.)
- [ ] **Voice emotion detection** for better responses
- [ ] **Integration with pharmacy APIs** for real-time availability
- [ ] **Prescription upload** and verification
- [ ] **Drug interaction checker** with user medications
- [ ] **Symptom severity assessment** with triage recommendations

### API Integrations
- [ ] **PubMed API** for latest medical research
- [ ] **DrugBank API** for comprehensive drug information
- [ ] **RxNorm API** for standardized medicine names
- [ ] **FDA API** for drug safety alerts

## 📞 Support & Contributing

### Getting Help
- Check the troubleshooting section below
- Review the test cases for expected behavior
- Open an issue for bugs or feature requests

### Contributing
1. Fork the repository
2. Create a feature branch
3. Add comprehensive tests
4. Ensure all safety checks pass
5. Submit a pull request

## 🐛 Troubleshooting

### Common Issues

**Microphone not working:**
- Check browser permissions for microphone access
- Ensure you're using HTTPS or localhost
- Try refreshing the page and allowing permissions again

**Voice recognition not accurate:**
- Speak clearly and at moderate pace
- Ensure minimal background noise
- Use medical terms when possible (the system is trained for medical vocabulary)

**Backend connection issues:**
- Verify the Python server is running on port 5000
- Check CORS settings if accessing from different domain
- Ensure all dependencies are installed correctly

**No voice output:**
- Check browser audio settings
- Verify text-to-speech is supported in your browser
- Try different voice settings in browser preferences

### Browser Compatibility
- ✅ **Chrome 60+** (Recommended)
- ✅ **Firefox 55+**
- ✅ **Safari 14+**
- ✅ **Edge 79+**
- ❌ **Internet Explorer** (Not supported)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Important Medical Notice

This AI assistant is designed for educational and informational purposes only. It is not intended to:
- Replace professional medical advice
- Diagnose medical conditions
- Prescribe medications
- Provide emergency medical care

**Always consult with qualified healthcare professionals for medical concerns.**

---

**Built with ❤️ for better healthcare accessibility** 