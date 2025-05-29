#!/usr/bin/env python3
"""
Test suite for Medical AI Voice Assistant Backend
Tests for accuracy, safety, and proper medical responses
"""

import pytest
import json
from medical_ai_backend import app, knowledge_base, query_processor, response_generator

@pytest.fixture
def client():
    """Create test client"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

class TestMedicalQueryProcessor:
    """Test medical query processing functionality"""
    
    def test_clean_query_removes_filler_words(self):
        """Test that filler words are removed from queries"""
        query = "um, what is, like, paracetamol used for, you know?"
        cleaned = query_processor.clean_query(query)
        assert "um" not in cleaned
        assert "like" not in cleaned
        assert "you know" not in cleaned
        assert "paracetamol" in cleaned
    
    def test_medicine_name_correction(self):
        """Test that common medicine name variations are corrected"""
        test_cases = [
            ("tylenol", "paracetamol"),
            ("advil", "ibuprofen"),
            ("motrin", "ibuprofen"),
            ("zyrtec", "cetirizine")
        ]
        
        for input_name, expected in test_cases:
            query = f"what is {input_name} for"
            analysis = query_processor.analyze_query(query)
            assert analysis.medicine == expected
    
    def test_safety_flag_detection(self):
        """Test that dangerous keywords are detected"""
        dangerous_queries = [
            "I took an overdose of paracetamol",
            "Having chest pain and shortness of breath",
            "Severe allergic reaction with swelling"
        ]
        
        for query in dangerous_queries:
            analysis = query_processor.analyze_query(query)
            assert len(analysis.safety_flags) > 0
    
    def test_symptom_extraction(self):
        """Test that symptoms are correctly extracted"""
        query = "I have a headache and fever, what should I take?"
        analysis = query_processor.analyze_query(query)
        assert "headache" in analysis.symptoms
        assert "fever" in analysis.symptoms
    
    def test_query_type_classification(self):
        """Test that query types are correctly classified"""
        test_cases = [
            ("What are the side effects of ibuprofen?", "side_effects"),
            ("What is the dosage for paracetamol?", "dosage"),
            ("What is aspirin used for?", "uses"),
            ("Are there any warnings for omeprazole?", "warnings")
        ]
        
        for query, expected_type in test_cases:
            analysis = query_processor.analyze_query(query)
            assert analysis.query_type == expected_type

class TestMedicalResponseGenerator:
    """Test medical response generation"""
    
    def test_emergency_response_generation(self):
        """Test that emergency responses are generated for dangerous queries"""
        from medical_ai_backend import MedicalQuery
        
        emergency_query = MedicalQuery(
            original_text="I took too many pills",
            cleaned_text="took too many pills",
            intent="emergency",
            medicine=None,
            symptoms=[],
            query_type="emergency",
            confidence=1.0,
            safety_flags=["overdose"]
        )
        
        response = response_generator.generate_response(emergency_query)
        assert response.response_type == "emergency"
        assert "MEDICAL EMERGENCY" in response.text
        assert "911" in response.text or "emergency services" in response.text
    
    def test_medicine_information_response(self):
        """Test that accurate medicine information is provided"""
        from medical_ai_backend import MedicalQuery
        
        paracetamol_query = MedicalQuery(
            original_text="What is paracetamol used for?",
            cleaned_text="what is paracetamol used for",
            intent="medicine_info",
            medicine="paracetamol",
            symptoms=[],
            query_type="uses",
            confidence=0.9,
            safety_flags=[]
        )
        
        response = response_generator.generate_response(paracetamol_query)
        assert response.response_type == "medicine_info"
        assert "paracetamol" in response.text.lower()
        assert "pain relief" in response.text.lower()
        assert len(response.warnings) > 0
        assert response.disclaimer is not None
    
    def test_dosage_information_accuracy(self):
        """Test that dosage information is accurate and includes warnings"""
        from medical_ai_backend import MedicalQuery
        
        dosage_query = MedicalQuery(
            original_text="What is the dosage for ibuprofen?",
            cleaned_text="what is the dosage for ibuprofen",
            intent="medicine_info",
            medicine="ibuprofen",
            symptoms=[],
            query_type="dosage",
            confidence=0.9,
            safety_flags=[]
        )
        
        response = response_generator.generate_response(dosage_query)
        assert "200-400mg" in response.text
        assert "maximum" in response.text.lower()
        assert "doctor" in response.text.lower() or "instructions" in response.text.lower()
    
    def test_side_effects_warning_inclusion(self):
        """Test that side effects responses include appropriate warnings"""
        from medical_ai_backend import MedicalQuery
        
        side_effects_query = MedicalQuery(
            original_text="What are the side effects of aspirin?",
            cleaned_text="what are the side effects of aspirin",
            intent="medicine_info",
            medicine="aspirin",
            symptoms=[],
            query_type="side_effects",
            confidence=0.9,
            safety_flags=[]
        )
        
        response = response_generator.generate_response(side_effects_query)
        assert response.response_type == "medicine_info"
        assert "side effects" in response.text.lower()
        assert "healthcare provider" in response.text.lower()
        assert len(response.warnings) > 0
    
    def test_unknown_medicine_handling(self):
        """Test handling of unknown medicines"""
        from medical_ai_backend import MedicalQuery
        
        unknown_query = MedicalQuery(
            original_text="What is xyz123medicine used for?",
            cleaned_text="what is xyz123medicine used for",
            intent="medicine_info",
            medicine="xyz123medicine",
            symptoms=[],
            query_type="uses",
            confidence=0.3,
            safety_flags=[]
        )
        
        response = response_generator.generate_response(unknown_query)
        assert response.response_type == "unknown_medicine"
        assert "don't have specific information" in response.text.lower()
        assert "pharmacist" in response.text.lower()
        assert "healthcare provider" in response.text.lower()

class TestAPIEndpoints:
    """Test API endpoints"""
    
    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get('/api/health')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
        assert 'timestamp' in data
    
    def test_medicines_endpoint(self, client):
        """Test medicines list endpoint"""
        response = client.get('/api/medicines')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'medicines' in data
        assert len(data['medicines']) > 0
        
        # Check structure of first medicine
        first_medicine = data['medicines'][0]
        assert 'name' in first_medicine
        assert 'category' in first_medicine
        assert 'uses' in first_medicine
        assert 'names' in first_medicine
    
    def test_medical_query_endpoint_valid_query(self, client):
        """Test medical query endpoint with valid query"""
        query_data = {
            'query': 'What is paracetamol used for?'
        }
        
        response = client.post('/api/medical-query', 
                             data=json.dumps(query_data),
                             content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        # Check response structure
        assert 'response' in data
        assert 'analysis' in data
        assert 'timestamp' in data
        
        # Check response content
        response_data = data['response']
        assert 'text' in response_data
        assert 'type' in response_data
        assert 'confidence' in response_data
        assert 'warnings' in response_data
        assert 'disclaimer' in response_data
        
        # Check analysis content
        analysis_data = data['analysis']
        assert 'intent' in analysis_data
        assert 'medicine' in analysis_data
        assert 'symptoms' in analysis_data
        assert 'query_type' in analysis_data
        assert 'safety_flags' in analysis_data
    
    def test_medical_query_endpoint_emergency(self, client):
        """Test medical query endpoint with emergency query"""
        query_data = {
            'query': 'I think I took an overdose of pills'
        }
        
        response = client.post('/api/medical-query',
                             data=json.dumps(query_data),
                             content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        # Should detect emergency
        assert data['analysis']['safety_flags']
        assert data['response']['type'] == 'emergency'
        assert 'emergency' in data['response']['text'].lower()
    
    def test_medical_query_endpoint_empty_query(self, client):
        """Test medical query endpoint with empty query"""
        query_data = {
            'query': ''
        }
        
        response = client.post('/api/medical-query',
                             data=json.dumps(query_data),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data

class TestSafetyFeatures:
    """Test safety and ethical features"""
    
    def test_disclaimer_always_included(self):
        """Test that medical disclaimer is always included"""
        from medical_ai_backend import MedicalQuery
        
        queries = [
            MedicalQuery("", "", "medicine_info", "paracetamol", [], "uses", 0.9, []),
            MedicalQuery("", "", "symptom_treatment", None, ["headache"], "general", 0.7, []),
            MedicalQuery("", "", "general_medical", None, [], "general", 0.5, [])
        ]
        
        for query in queries:
            response = response_generator.generate_response(query)
            assert response.disclaimer is not None
            assert len(response.disclaimer) > 0
            assert "not a substitute for professional medical advice" in response.disclaimer.lower()
    
    def test_prescription_medicine_warnings(self):
        """Test that prescription medicines include appropriate warnings"""
        from medical_ai_backend import MedicalQuery
        
        metformin_query = MedicalQuery(
            original_text="What is metformin used for?",
            cleaned_text="what is metformin used for",
            intent="medicine_info",
            medicine="metformin",
            symptoms=[],
            query_type="uses",
            confidence=0.9,
            safety_flags=[]
        )
        
        response = response_generator.generate_response(metformin_query)
        assert "prescription" in response.text.lower()
        assert len(response.warnings) > 0
    
    def test_contraindication_information(self):
        """Test that contraindications are included when relevant"""
        from medical_ai_backend import MedicalQuery
        
        aspirin_query = MedicalQuery(
            original_text="Tell me about aspirin warnings",
            cleaned_text="tell me about aspirin warnings",
            intent="medicine_info",
            medicine="aspirin",
            symptoms=[],
            query_type="warnings",
            confidence=0.9,
            safety_flags=[]
        )
        
        response = response_generator.generate_response(aspirin_query)
        assert "children under 16" in response.text.lower() or "contraindications" in response.text.lower()

class TestAccuracyAndReliability:
    """Test accuracy and reliability of medical information"""
    
    def test_paracetamol_information_accuracy(self):
        """Test accuracy of paracetamol information"""
        medicine_data = knowledge_base.medicines['paracetamol']
        
        # Check essential information is present
        assert 'pain relief' in [use.lower() for use in medicine_data['uses']]
        assert 'fever reduction' in [use.lower() for use in medicine_data['uses']]
        assert any('4g' in dosage or '4000mg' in dosage for dosage in medicine_data['dosage'].values())
        assert any('liver' in warning.lower() for warning in medicine_data['warnings'])
    
    def test_ibuprofen_information_accuracy(self):
        """Test accuracy of ibuprofen information"""
        medicine_data = knowledge_base.medicines['ibuprofen']
        
        # Check essential information
        assert 'nsaid' in medicine_data['category'].lower()
        assert any('stomach' in warning.lower() for warning in medicine_data['warnings'])
        assert any('food' in warning.lower() for warning in medicine_data['warnings'])
    
    def test_aspirin_age_restrictions(self):
        """Test that aspirin age restrictions are properly handled"""
        medicine_data = knowledge_base.medicines['aspirin']
        
        # Should have age restriction warnings
        assert any('16' in warning for warning in medicine_data['warnings'])
        assert any('children' in warning.lower() for warning in medicine_data['warnings'])

def run_comprehensive_tests():
    """Run all tests and generate report"""
    print("🧪 Running Medical AI Voice Assistant Tests...")
    print("=" * 60)
    
    # Run pytest
    pytest.main([__file__, '-v', '--tb=short'])
    
    print("\n" + "=" * 60)
    print("✅ Test Suite Completed")
    print("\n🔍 Manual Verification Checklist:")
    print("   □ Emergency responses trigger immediately")
    print("   □ Medical disclaimers are always present")
    print("   □ Dosage information includes safety warnings")
    print("   □ Prescription medicines are clearly marked")
    print("   □ Side effects include severity indicators")
    print("   □ Contraindications are clearly stated")
    print("   □ Drug interactions are mentioned when relevant")

if __name__ == '__main__':
    run_comprehensive_tests() 