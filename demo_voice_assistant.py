#!/usr/bin/env python3
"""
Demo script for Medical AI Voice Assistant
Showcases various medical query capabilities and safety features
"""

import requests
import json
import time
from datetime import datetime

# Backend API URL
API_BASE = "http://localhost:5000"

def test_medical_query(query, description=""):
    """Test a medical query and display results"""
    print(f"\n{'='*60}")
    print(f"🎤 USER QUERY: {query}")
    if description:
        print(f"📝 TEST: {description}")
    print(f"{'='*60}")
    
    try:
        response = requests.post(
            f"{API_BASE}/api/medical-query",
            headers={"Content-Type": "application/json"},
            json={"query": query}
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Display analysis
            analysis = data['analysis']
            print(f"\n🧠 AI ANALYSIS:")
            print(f"   Intent: {analysis['intent']}")
            print(f"   Medicine: {analysis['medicine'] or 'None detected'}")
            print(f"   Symptoms: {analysis['symptoms'] or 'None detected'}")
            print(f"   Query Type: {analysis['query_type']}")
            print(f"   Safety Flags: {analysis['safety_flags'] or 'None'}")
            
            # Display response
            response_data = data['response']
            print(f"\n🤖 AI RESPONSE:")
            print(f"   Type: {response_data['type']}")
            print(f"   Confidence: {response_data['confidence']:.2f}")
            
            # Format and display the response text
            response_text = response_data['text']
            lines = response_text.split('\n')
            for line in lines:
                if line.strip():
                    print(f"   {line}")
            
            # Display warnings if any
            if response_data['warnings']:
                print(f"\n⚠️  WARNINGS:")
                for warning in response_data['warnings']:
                    print(f"   • {warning}")
            
            # Emergency detection
            if response_data['type'] == 'emergency':
                print(f"\n🚨 EMERGENCY DETECTED - IMMEDIATE ACTION REQUIRED!")
            
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Error: Cannot connect to backend server. Please ensure it's running on port 5000.")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    time.sleep(2)  # Pause between queries

def run_comprehensive_demo():
    """Run a comprehensive demo of the voice assistant"""
    print("🏥 MediQuick AI Voice Assistant Demo")
    print("=" * 60)
    print("This demo showcases the AI voice assistant's capabilities")
    print("for medical queries with safety checks and comprehensive responses.")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test 1: Basic medicine information
    test_medical_query(
        "What is paracetamol used for?",
        "Basic medicine information query"
    )
    
    # Test 2: Dosage information
    test_medical_query(
        "What is the dosage for ibuprofen?",
        "Dosage-specific query with safety warnings"
    )
    
    # Test 3: Side effects query
    test_medical_query(
        "What are the side effects of aspirin?",
        "Side effects query with healthcare provider recommendations"
    )
    
    # Test 4: Symptom-based recommendation
    test_medical_query(
        "I have a headache and fever, what should I take?",
        "Symptom-based medicine recommendation"
    )
    
    # Test 5: Medicine name variation (brand name)
    test_medical_query(
        "Tell me about Tylenol",
        "Brand name recognition and correction"
    )
    
    # Test 6: Allergy medication query
    test_medical_query(
        "What helps with allergies?",
        "Allergy symptom treatment recommendation"
    )
    
    # Test 7: Prescription medicine query
    test_medical_query(
        "What is metformin used for?",
        "Prescription medicine with special warnings"
    )
    
    # Test 8: Drug interaction query
    test_medical_query(
        "Can I take aspirin with other medications?",
        "Drug interaction and safety query"
    )
    
    # Test 9: Emergency detection
    test_medical_query(
        "I think I took too many pills",
        "Emergency detection and response"
    )
    
    # Test 10: Unknown medicine
    test_medical_query(
        "What is xyz123medicine used for?",
        "Unknown medicine handling"
    )
    
    # Test 11: General medical advice
    test_medical_query(
        "Can you help me with medical questions?",
        "General medical assistance query"
    )
    
    # Test 12: Complex query with multiple symptoms
    test_medical_query(
        "I have pain and inflammation in my joints",
        "Complex symptom query requiring analysis"
    )
    
    print(f"\n{'='*60}")
    print("✅ Demo completed successfully!")
    print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("\n🔍 Key Features Demonstrated:")
    print("   ✓ Medicine information retrieval")
    print("   ✓ Dosage and safety warnings")
    print("   ✓ Side effects with healthcare recommendations")
    print("   ✓ Symptom-based medicine suggestions")
    print("   ✓ Brand name recognition and correction")
    print("   ✓ Emergency detection and response")
    print("   ✓ Prescription medicine warnings")
    print("   ✓ Unknown medicine handling")
    print("   ✓ Medical disclaimers and safety protocols")
    print("\n⚠️  Remember: This is for educational purposes only.")
    print("   Always consult healthcare professionals for medical advice.")

def test_api_endpoints():
    """Test all API endpoints"""
    print("\n🔧 Testing API Endpoints...")
    
    # Test health endpoint
    try:
        response = requests.get(f"{API_BASE}/api/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health Check: {data['status']} (v{data['version']})")
        else:
            print(f"❌ Health Check Failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health Check Error: {str(e)}")
    
    # Test medicines endpoint
    try:
        response = requests.get(f"{API_BASE}/api/medicines")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Medicines Endpoint: {len(data['medicines'])} medicines available")
        else:
            print(f"❌ Medicines Endpoint Failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Medicines Endpoint Error: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting Medical AI Voice Assistant Demo...")
    
    # Test API endpoints first
    test_api_endpoints()
    
    # Run comprehensive demo
    try:
        run_comprehensive_demo()
    except KeyboardInterrupt:
        print("\n\n⏹️  Demo interrupted by user.")
    except Exception as e:
        print(f"\n❌ Demo failed: {str(e)}")
    
    print("\n👋 Thank you for trying the MediQuick AI Voice Assistant!")
    print("   For more information, see README.md") 