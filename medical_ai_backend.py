#!/usr/bin/env python3
"""
Medical AI Voice Assistant Backend
Advanced medical query processing with safety checks and comprehensive responses
"""

import json
import re
import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import requests
from difflib import SequenceMatcher

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

@dataclass
class MedicalQuery:
    """Structure for medical query analysis"""
    original_text: str
    cleaned_text: str
    intent: str
    medicine: Optional[str]
    symptoms: List[str]
    query_type: str
    confidence: float
    safety_flags: List[str]

@dataclass
class MedicalResponse:
    """Structure for medical response"""
    text: str
    response_type: str
    confidence: float
    sources: List[str]
    warnings: List[str]
    disclaimer: str

class MedicalKnowledgeBase:
    """Comprehensive medical knowledge base with safety checks"""
    
    def __init__(self):
        self.medicines = {
            'paracetamol': {
                'names': ['paracetamol', 'acetaminophen', 'tylenol', 'panadol', 'crocin'],
                'category': 'Analgesic/Antipyretic',
                'uses': [
                    'Pain relief (mild to moderate)',
                    'Fever reduction',
                    'Headache relief',
                    'Muscle aches',
                    'Arthritis pain',
                    'Cold and flu symptoms'
                ],
                'dosage': {
                    'adult': '500-1000mg every 4-6 hours, maximum 4g daily',
                    'child': '10-15mg/kg every 4-6 hours, maximum 60mg/kg daily',
                    'elderly': 'Reduce dose if liver/kidney problems'
                },
                'side_effects': [
                    'Rare: liver damage with overdose',
                    'Skin rash (uncommon)',
                    'Nausea (rare)',
                    'Blood disorders (very rare)'
                ],
                'warnings': [
                    'Do not exceed recommended dose',
                    'Avoid alcohol consumption',
                    'Check other medications for paracetamol content',
                    'Consult doctor if symptoms persist >3 days',
                    'Liver disease patients: use with caution'
                ],
                'contraindications': [
                    'Severe liver disease',
                    'Known hypersensitivity to paracetamol'
                ],
                'interactions': [
                    'Warfarin: may enhance anticoagulant effect',
                    'Alcohol: increased risk of liver damage'
                ]
            },
            'ibuprofen': {
                'names': ['ibuprofen', 'advil', 'motrin', 'brufen', 'nurofen'],
                'category': 'NSAID (Non-Steroidal Anti-Inflammatory Drug)',
                'uses': [
                    'Pain relief',
                    'Inflammation reduction',
                    'Fever reduction',
                    'Arthritis',
                    'Muscle strains',
                    'Dental pain'
                ],
                'dosage': {
                    'adult': '200-400mg every 4-6 hours, maximum 1.2g daily',
                    'child': '5-10mg/kg every 6-8 hours',
                    'elderly': 'Use lowest effective dose'
                },
                'side_effects': [
                    'Stomach upset',
                    'Heartburn',
                    'Dizziness',
                    'Increased bleeding risk',
                    'Kidney problems (long-term use)',
                    'High blood pressure'
                ],
                'warnings': [
                    'Take with food to reduce stomach irritation',
                    'Not suitable for stomach ulcer patients',
                    'Avoid if allergic to aspirin',
                    'Monitor blood pressure with long-term use',
                    'Increased cardiovascular risk with prolonged use'
                ],
                'contraindications': [
                    'Active peptic ulcer',
                    'Severe heart failure',
                    'Severe kidney disease',
                    'Third trimester of pregnancy',
                    'Aspirin allergy'
                ],
                'interactions': [
                    'Warfarin: increased bleeding risk',
                    'ACE inhibitors: reduced effectiveness',
                    'Lithium: increased lithium levels'
                ]
            },
            'aspirin': {
                'names': ['aspirin', 'acetylsalicylic acid', 'bayer', 'disprin'],
                'category': 'NSAID/Antiplatelet',
                'uses': [
                    'Pain relief',
                    'Fever reduction',
                    'Heart attack prevention',
                    'Stroke prevention',
                    'Blood clot prevention',
                    'Anti-inflammatory'
                ],
                'dosage': {
                    'adult_pain': '300-900mg every 4-6 hours',
                    'adult_cardio': '75-100mg once daily',
                    'child': 'Not recommended under 16 years'
                },
                'side_effects': [
                    'Stomach irritation',
                    'Increased bleeding risk',
                    'Tinnitus (ringing in ears)',
                    'Nausea',
                    'Allergic reactions'
                ],
                'warnings': [
                    'Not for children under 16 (Reye\'s syndrome risk)',
                    'Take with food',
                    'Monitor for bleeding',
                    'Stop before surgery',
                    'Avoid in pregnancy (third trimester)'
                ],
                'contraindications': [
                    'Children under 16 years',
                    'Active bleeding',
                    'Severe kidney disease',
                    'Aspirin allergy',
                    'Third trimester pregnancy'
                ],
                'interactions': [
                    'Warfarin: major bleeding risk',
                    'Methotrexate: increased toxicity',
                    'Diabetes medications: enhanced effect'
                ]
            },
            'cetirizine': {
                'names': ['cetirizine', 'zyrtec', 'reactine'],
                'category': 'Antihistamine (H1 receptor antagonist)',
                'uses': [
                    'Allergic rhinitis (hay fever)',
                    'Urticaria (hives)',
                    'Allergic conjunctivitis',
                    'Itching',
                    'Eczema symptoms'
                ],
                'dosage': {
                    'adult': '10mg once daily',
                    'child_6_12': '5mg once daily',
                    'child_2_6': '2.5mg once daily',
                    'elderly': 'May need dose reduction'
                },
                'side_effects': [
                    'Drowsiness',
                    'Dry mouth',
                    'Fatigue',
                    'Headache',
                    'Dizziness'
                ],
                'warnings': [
                    'May cause drowsiness',
                    'Avoid alcohol',
                    'Reduce dose in kidney problems',
                    'Use caution when driving'
                ],
                'contraindications': [
                    'Severe kidney disease',
                    'Known hypersensitivity'
                ],
                'interactions': [
                    'Alcohol: enhanced sedation',
                    'CNS depressants: additive effects'
                ]
            },
            'omeprazole': {
                'names': ['omeprazole', 'prilosec', 'losec'],
                'category': 'Proton Pump Inhibitor (PPI)',
                'uses': [
                    'Gastroesophageal reflux disease (GERD)',
                    'Peptic ulcers',
                    'Heartburn',
                    'Zollinger-Ellison syndrome',
                    'H. pylori eradication (with antibiotics)'
                ],
                'dosage': {
                    'adult': '20-40mg once daily before breakfast',
                    'maintenance': '10-20mg daily',
                    'h_pylori': '20mg twice daily with antibiotics'
                },
                'side_effects': [
                    'Headache',
                    'Stomach pain',
                    'Nausea',
                    'Diarrhea',
                    'Vitamin B12 deficiency (long-term use)'
                ],
                'warnings': [
                    'Take on empty stomach',
                    'Complete prescribed course',
                    'May affect vitamin B12 absorption',
                    'Increased infection risk with long-term use',
                    'May mask stomach cancer symptoms'
                ],
                'contraindications': [
                    'Known hypersensitivity to PPIs'
                ],
                'interactions': [
                    'Clopidogrel: reduced effectiveness',
                    'Warfarin: may increase INR',
                    'Digoxin: increased levels'
                ]
            },
            'metformin': {
                'names': ['metformin', 'glucophage', 'fortamet'],
                'category': 'Antidiabetic (Biguanide)',
                'uses': [
                    'Type 2 diabetes mellitus',
                    'Polycystic ovary syndrome (PCOS)',
                    'Prediabetes prevention'
                ],
                'dosage': {
                    'adult_starting': '500mg twice daily with meals',
                    'adult_maintenance': '1000-2000mg daily in divided doses',
                    'maximum': '2550mg daily'
                },
                'side_effects': [
                    'Nausea',
                    'Diarrhea',
                    'Stomach upset',
                    'Metallic taste',
                    'Lactic acidosis (rare but serious)'
                ],
                'warnings': [
                    'Prescription only medication',
                    'Regular blood sugar monitoring required',
                    'Avoid alcohol',
                    'Stop before contrast procedures',
                    'Monitor kidney function'
                ],
                'contraindications': [
                    'Severe kidney disease',
                    'Acute heart failure',
                    'Severe liver disease',
                    'Diabetic ketoacidosis',
                    'Metabolic acidosis'
                ],
                'interactions': [
                    'Alcohol: increased lactic acidosis risk',
                    'Contrast agents: kidney damage risk',
                    'Insulin: enhanced glucose-lowering effect'
                ]
            }
        }
        
        self.symptoms_to_medicines = {
            'pain': ['paracetamol', 'ibuprofen', 'aspirin'],
            'headache': ['paracetamol', 'ibuprofen', 'aspirin'],
            'fever': ['paracetamol', 'ibuprofen', 'aspirin'],
            'inflammation': ['ibuprofen', 'aspirin'],
            'allergy': ['cetirizine'],
            'hay fever': ['cetirizine'],
            'heartburn': ['omeprazole'],
            'acid reflux': ['omeprazole'],
            'diabetes': ['metformin'],
            'blood sugar': ['metformin']
        }
        
        self.danger_keywords = [
            'overdose', 'suicide', 'kill', 'death', 'emergency',
            'chest pain', 'heart attack', 'stroke', 'bleeding',
            'severe allergic reaction', 'anaphylaxis', 'unconscious',
            'too many pills', 'too much medicine', 'poisoning',
            'can\'t breathe', 'difficulty breathing', 'choking',
            'severe pain', 'blood in vomit', 'blood in stool',
            'seizure', 'convulsions', 'loss of consciousness'
        ]

class MedicalQueryProcessor:
    """Advanced medical query processing with NLP and safety checks"""
    
    def __init__(self, knowledge_base: MedicalKnowledgeBase):
        self.kb = knowledge_base
        
    def clean_query(self, query: str) -> str:
        """Clean and normalize the input query"""
        # Remove filler words
        filler_words = ['um', 'uh', 'like', 'you know', 'well', 'so', 'actually']
        words = query.lower().split()
        cleaned_words = [word for word in words if word not in filler_words]
        
        # Medical term corrections using fuzzy matching
        corrected_words = []
        for word in cleaned_words:
            best_match = self._find_best_medicine_match(word)
            corrected_words.append(best_match if best_match else word)
        
        return ' '.join(corrected_words)
    
    def _find_best_medicine_match(self, word: str) -> Optional[str]:
        """Find the best matching medicine name using fuzzy matching"""
        best_match = None
        best_ratio = 0.6  # Minimum similarity threshold
        
        for medicine, data in self.kb.medicines.items():
            for name in data['names']:
                ratio = SequenceMatcher(None, word.lower(), name.lower()).ratio()
                if ratio > best_ratio:
                    best_ratio = ratio
                    best_match = medicine
        
        return best_match
    
    def analyze_query(self, query: str) -> MedicalQuery:
        """Analyze the medical query and extract relevant information"""
        cleaned_query = self.clean_query(query)
        
        # Check for safety flags
        safety_flags = self._check_safety_flags(cleaned_query)
        
        # Extract medicine names
        medicine = self._extract_medicine(cleaned_query)
        
        # Extract symptoms
        symptoms = self._extract_symptoms(cleaned_query)
        
        # Determine query type
        query_type = self._determine_query_type(cleaned_query)
        
        # Determine intent
        intent = self._determine_intent(cleaned_query, medicine, symptoms)
        
        # Calculate confidence
        confidence = self._calculate_confidence(medicine, symptoms, query_type)
        
        return MedicalQuery(
            original_text=query,
            cleaned_text=cleaned_query,
            intent=intent,
            medicine=medicine,
            symptoms=symptoms,
            query_type=query_type,
            confidence=confidence,
            safety_flags=safety_flags
        )
    
    def _check_safety_flags(self, query: str) -> List[str]:
        """Check for dangerous keywords that require immediate medical attention"""
        flags = []
        for keyword in self.kb.danger_keywords:
            if keyword in query.lower():
                flags.append(keyword)
        return flags
    
    def _extract_medicine(self, query: str) -> Optional[str]:
        """Extract medicine name from query"""
        for medicine, data in self.kb.medicines.items():
            for name in data['names']:
                if name in query.lower():
                    return medicine
        return None
    
    def _extract_symptoms(self, query: str) -> List[str]:
        """Extract symptoms from query"""
        symptoms = []
        for symptom in self.kb.symptoms_to_medicines.keys():
            if symptom in query.lower():
                symptoms.append(symptom)
        return symptoms
    
    def _determine_query_type(self, query: str) -> str:
        """Determine the type of query"""
        if any(word in query for word in ['side effect', 'adverse', 'reaction']):
            return 'side_effects'
        elif any(word in query for word in ['dosage', 'dose', 'how much', 'how many']):
            return 'dosage'
        elif any(word in query for word in ['use', 'for', 'treat', 'help']):
            return 'uses'
        elif any(word in query for word in ['warning', 'caution', 'safe', 'danger']):
            return 'warnings'
        elif any(word in query for word in ['interaction', 'together', 'with']):
            return 'interactions'
        else:
            return 'general'
    
    def _determine_intent(self, query: str, medicine: Optional[str], symptoms: List[str]) -> str:
        """Determine the user's intent"""
        if medicine:
            return 'medicine_info'
        elif symptoms:
            return 'symptom_treatment'
        else:
            return 'general_medical'
    
    def _calculate_confidence(self, medicine: Optional[str], symptoms: List[str], query_type: str) -> float:
        """Calculate confidence score for the query analysis"""
        confidence = 0.5  # Base confidence
        
        if medicine:
            confidence += 0.3
        if symptoms:
            confidence += 0.2
        if query_type != 'general':
            confidence += 0.1
        
        return min(confidence, 1.0)

class MedicalResponseGenerator:
    """Generate comprehensive medical responses with safety checks"""
    
    def __init__(self, knowledge_base: MedicalKnowledgeBase):
        self.kb = knowledge_base
        
    def generate_response(self, query: MedicalQuery) -> MedicalResponse:
        """Generate a comprehensive medical response"""
        
        # Handle emergency situations first
        if query.safety_flags:
            return self._generate_emergency_response(query)
        
        # Generate response based on intent
        if query.intent == 'medicine_info':
            return self._generate_medicine_response(query)
        elif query.intent == 'symptom_treatment':
            return self._generate_symptom_response(query)
        else:
            return self._generate_general_response(query)
    
    def _generate_emergency_response(self, query: MedicalQuery) -> MedicalResponse:
        """Generate emergency response for dangerous queries"""
        emergency_text = """
        🚨 MEDICAL EMERGENCY DETECTED 🚨
        
        If you are experiencing a medical emergency, please:
        1. Call emergency services immediately (911 in US, 999 in UK, 112 in EU)
        2. Contact your local poison control center if this involves overdose
        3. Seek immediate medical attention at the nearest hospital
        
        This AI assistant cannot provide emergency medical care. Please contact healthcare professionals immediately.
        """
        
        return MedicalResponse(
            text=emergency_text,
            response_type='emergency',
            confidence=1.0,
            sources=['Emergency Protocol'],
            warnings=['SEEK IMMEDIATE MEDICAL ATTENTION'],
            disclaimer='This is an emergency situation requiring immediate professional medical care.'
        )
    
    def _generate_medicine_response(self, query: MedicalQuery) -> MedicalResponse:
        """Generate response about specific medicine"""
        medicine_data = self.kb.medicines.get(query.medicine)
        if not medicine_data:
            return self._generate_unknown_medicine_response(query)
        
        medicine_name = query.medicine.capitalize()
        response_parts = []
        
        # Basic information
        response_parts.append(f"**{medicine_name}** ({medicine_data['category']})")
        
        # Query-specific information
        if query.query_type == 'uses':
            response_parts.append(f"\n**Uses:** {medicine_name} is commonly used for:")
            for use in medicine_data['uses']:
                response_parts.append(f"• {use}")
                
        elif query.query_type == 'dosage':
            response_parts.append(f"\n**Dosage Information:**")
            for age_group, dosage in medicine_data['dosage'].items():
                response_parts.append(f"• {age_group.replace('_', ' ').title()}: {dosage}")
            response_parts.append("\n⚠️ Always follow your doctor's instructions or package directions.")
            
        elif query.query_type == 'side_effects':
            response_parts.append(f"\n**Possible Side Effects:**")
            for effect in medicine_data['side_effects']:
                response_parts.append(f"• {effect}")
            response_parts.append("\n⚠️ Contact your healthcare provider if you experience severe side effects.")
            
        elif query.query_type == 'warnings':
            response_parts.append(f"\n**Important Warnings:**")
            for warning in medicine_data['warnings']:
                response_parts.append(f"• {warning}")
                
        elif query.query_type == 'interactions':
            response_parts.append(f"\n**Drug Interactions:**")
            for interaction in medicine_data.get('interactions', []):
                response_parts.append(f"• {interaction}")
                
        else:
            # General information
            response_parts.append(f"\n**Uses:** {', '.join(medicine_data['uses'][:3])}")
            response_parts.append(f"\n**Typical Dosage:** {list(medicine_data['dosage'].values())[0]}")
            response_parts.append(f"\n**Key Warnings:** {medicine_data['warnings'][0]}")
        
        # Contraindications
        if medicine_data.get('contraindications'):
            response_parts.append(f"\n**Contraindications:** Do not use if you have:")
            for contra in medicine_data['contraindications']:
                response_parts.append(f"• {contra}")
        
        response_text = '\n'.join(response_parts)
        
        return MedicalResponse(
            text=response_text,
            response_type='medicine_info',
            confidence=query.confidence,
            sources=[f'Medical Database - {medicine_name}'],
            warnings=medicine_data['warnings'][:2],
            disclaimer=self._get_standard_disclaimer()
        )
    
    def _generate_symptom_response(self, query: MedicalQuery) -> MedicalResponse:
        """Generate response for symptom-based queries"""
        response_parts = []
        response_parts.append("Based on your symptoms, here are some treatment options:")
        
        all_medicines = set()
        for symptom in query.symptoms:
            medicines = self.kb.symptoms_to_medicines.get(symptom, [])
            all_medicines.update(medicines)
            
            if medicines:
                response_parts.append(f"\n**For {symptom}:**")
                for medicine in medicines:
                    medicine_data = self.kb.medicines[medicine]
                    response_parts.append(f"• {medicine.capitalize()} - {medicine_data['category']}")
        
        # Add general advice
        response_parts.append(f"\n**General Advice:**")
        response_parts.append("• Start with the lowest effective dose")
        response_parts.append("• Read all package instructions carefully")
        response_parts.append("• Consult a pharmacist or doctor if symptoms persist")
        response_parts.append("• Seek medical attention if symptoms worsen")
        
        response_text = '\n'.join(response_parts)
        
        return MedicalResponse(
            text=response_text,
            response_type='symptom_treatment',
            confidence=query.confidence,
            sources=['Symptom-Medicine Database'],
            warnings=['Consult healthcare provider if symptoms persist or worsen'],
            disclaimer=self._get_standard_disclaimer()
        )
    
    def _generate_general_response(self, query: MedicalQuery) -> MedicalResponse:
        """Generate general medical response"""
        response_text = """
        I can help you with information about common medicines and their uses. I have detailed information about:
        
        • **Pain Relief:** Paracetamol, Ibuprofen, Aspirin
        • **Allergies:** Cetirizine
        • **Acid Reflux:** Omeprazole  
        • **Diabetes:** Metformin
        
        You can ask me about:
        - Uses and indications
        - Dosage information
        - Side effects
        - Warnings and precautions
        - Drug interactions
        
        What specific information would you like to know?
        """
        
        return MedicalResponse(
            text=response_text,
            response_type='general',
            confidence=0.8,
            sources=['General Medical Database'],
            warnings=[],
            disclaimer=self._get_standard_disclaimer()
        )
    
    def _generate_unknown_medicine_response(self, query: MedicalQuery) -> MedicalResponse:
        """Generate response for unknown medicines"""
        response_text = f"""
        I don't have specific information about "{query.medicine}" in my current database.
        
        For accurate information about this medication, I recommend:
        • Consulting your pharmacist
        • Checking the medication package insert
        • Speaking with your healthcare provider
        • Using official medical databases like drugs.com or WebMD
        
        I can provide information about these common medicines:
        {', '.join(self.kb.medicines.keys())}
        """
        
        return MedicalResponse(
            text=response_text,
            response_type='unknown_medicine',
            confidence=0.3,
            sources=['General Medical Guidance'],
            warnings=['Consult healthcare professional for unknown medications'],
            disclaimer=self._get_standard_disclaimer()
        )
    
    def _get_standard_disclaimer(self) -> str:
        """Get standard medical disclaimer"""
        return """
        ⚠️ MEDICAL DISCLAIMER: This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read here.
        """

# Initialize components
knowledge_base = MedicalKnowledgeBase()
query_processor = MedicalQueryProcessor(knowledge_base)
response_generator = MedicalResponseGenerator(knowledge_base)

@app.route('/api/medical-query', methods=['POST'])
def process_medical_query():
    """Process medical query and return response"""
    try:
        data = request.get_json()
        query_text = data.get('query', '')
        
        if not query_text:
            return jsonify({'error': 'No query provided'}), 400
        
        # Log query (without sensitive data)
        logger.info(f"Processing medical query: {query_text[:50]}...")
        
        # Process query
        query = query_processor.analyze_query(query_text)
        response = response_generator.generate_response(query)
        
        # Prepare response
        result = {
            'response': {
                'text': response.text,
                'type': response.response_type,
                'confidence': response.confidence,
                'warnings': response.warnings,
                'disclaimer': response.disclaimer
            },
            'analysis': {
                'intent': query.intent,
                'medicine': query.medicine,
                'symptoms': query.symptoms,
                'query_type': query.query_type,
                'safety_flags': query.safety_flags
            },
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error processing medical query: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'response': {
                'text': 'I apologize, but I encountered an error processing your question. Please try again or consult a healthcare professional.',
                'type': 'error',
                'confidence': 0.0,
                'warnings': ['System error occurred'],
                'disclaimer': 'Please consult a healthcare professional for medical advice.'
            }
        }), 500

@app.route('/api/medicines', methods=['GET'])
def get_medicines():
    """Get list of available medicines"""
    medicines_list = []
    for medicine, data in knowledge_base.medicines.items():
        medicines_list.append({
            'name': medicine,
            'category': data['category'],
            'uses': data['uses'][:3],  # First 3 uses
            'names': data['names']
        })
    
    return jsonify({'medicines': medicines_list})

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

if __name__ == '__main__':
    print("🏥 Medical AI Voice Assistant Backend Starting...")
    print("📋 Available endpoints:")
    print("   POST /api/medical-query - Process medical queries")
    print("   GET  /api/medicines - Get available medicines")
    print("   GET  /api/health - Health check")
    print("\n🔒 Safety features enabled:")
    print("   ✓ Emergency detection")
    print("   ✓ Medical disclaimers")
    print("   ✓ Query logging")
    print("   ✓ Error handling")
    
    app.run(debug=True, host='0.0.0.0', port=5000) 