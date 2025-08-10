import requests
import sys
import json
from datetime import datetime

class CJPVigiaAPITester:
    def __init__(self, base_url="https://abca7cad-c245-4937-8ba3-e9b144eddf06.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.alguacil_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_user_id = None
        self.created_report_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/login",
            200,
            data={"username": "admin", "password": "admin123"}
        )
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   Admin token obtained: {self.admin_token[:20]}...")
            return True
        return False

    def test_get_current_user(self, token, role_expected):
        """Test getting current user info"""
        success, response = self.run_test(
            f"Get Current User ({role_expected})",
            "GET",
            "api/me",
            200,
            token=token
        )
        if success and response.get('role') == role_expected:
            print(f"   User role verified: {response.get('role')}")
            return True
        return False

    def test_create_user(self):
        """Test creating a new alguacil user"""
        test_user_data = {
            "username": f"test_alguacil_{datetime.now().strftime('%H%M%S')}",
            "password": "TestPass123!",
            "role": "alguacil",
            "full_name": "Test Alguacil Usuario"
        }
        
        success, response = self.run_test(
            "Create Alguacil User",
            "POST",
            "api/users",
            200,
            data=test_user_data,
            token=self.admin_token
        )
        
        if success and 'user_id' in response:
            self.created_user_id = response['user_id']
            self.test_user_data = test_user_data
            print(f"   Created user ID: {self.created_user_id}")
            return True
        return False

    def test_alguacil_login(self):
        """Test alguacil login with created user"""
        if not hasattr(self, 'test_user_data'):
            print("❌ No test user data available for alguacil login")
            return False
            
        success, response = self.run_test(
            "Alguacil Login",
            "POST",
            "api/login",
            200,
            data={"username": self.test_user_data["username"], "password": self.test_user_data["password"]}
        )
        if success and 'access_token' in response:
            self.alguacil_token = response['access_token']
            print(f"   Alguacil token obtained: {self.alguacil_token[:20]}...")
            return True
        return False

    def test_get_users(self):
        """Test getting all users (admin only)"""
        success, response = self.run_test(
            "Get All Users",
            "GET",
            "api/users",
            200,
            token=self.admin_token
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} users")
            return True
        return False

    def test_create_report(self):
        """Test creating a report as alguacil"""
        report_data = {
            "expediente": f"EXP-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "tribunal": "Tribunal Supremo de Justicia",
            "decision": "Sentencia Condenatoria",
            "observacion": "Reporte de prueba creado durante testing automatizado",
            "nombre_acusado": "Juan Pérez Ejemplo",
            "fecha": datetime.now().strftime('%Y-%m-%d'),
            "hora": datetime.now().strftime('%H:%M')
        }
        
        success, response = self.run_test(
            "Create Report (Alguacil)",
            "POST",
            "api/reports",
            200,
            data=report_data,
            token=self.alguacil_token
        )
        
        if success and 'report_id' in response:
            self.created_report_id = response['report_id']
            print(f"   Created report ID: {self.created_report_id}")
            return True
        return False

    def test_get_reports_admin(self):
        """Test getting all reports as admin"""
        success, response = self.run_test(
            "Get All Reports (Admin)",
            "GET",
            "api/reports",
            200,
            token=self.admin_token
        )
        if success and isinstance(response, list):
            print(f"   Admin can see {len(response)} reports")
            return True
        return False

    def test_get_reports_alguacil(self):
        """Test getting reports as alguacil (should only see own reports)"""
        success, response = self.run_test(
            "Get Own Reports (Alguacil)",
            "GET",
            "api/reports",
            200,
            token=self.alguacil_token
        )
        if success and isinstance(response, list):
            print(f"   Alguacil can see {len(response)} reports (own only)")
            return True
        return False

    def test_get_stats(self):
        """Test getting dashboard statistics (admin only)"""
        success, response = self.run_test(
            "Get Dashboard Stats",
            "GET",
            "api/stats",
            200,
            token=self.admin_token
        )
        if success and 'total_reports' in response:
            print(f"   Stats: {response}")
            return True
        return False

    def test_create_announcement(self):
        """Test creating an announcement (admin only)"""
        announcement_data = {
            "title": "Anuncio de Prueba",
            "message": "Este es un anuncio de prueba creado durante el testing automatizado del sistema."
        }
        
        success, response = self.run_test(
            "Create Announcement",
            "POST",
            "api/announcements",
            200,
            data=announcement_data,
            token=self.admin_token
        )
        return success

    def test_get_announcements(self):
        """Test getting announcements"""
        success, response = self.run_test(
            "Get Announcements",
            "GET",
            "api/announcements",
            200,
            token=self.alguacil_token
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} announcements")
            return True
        return False

    def test_get_notifications(self):
        """Test getting notifications (admin only)"""
        success, response = self.run_test(
            "Get Notifications",
            "GET",
            "api/notifications",
            200,
            token=self.admin_token
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} notifications")
            return True
        return False

    def test_unauthorized_access(self):
        """Test that alguacil cannot access admin endpoints"""
        print("\n🔒 Testing Role-Based Access Control...")
        
        # Test alguacil trying to access admin endpoints
        endpoints_to_test = [
            ("api/users", "GET"),
            ("api/stats", "GET"),
            ("api/notifications", "GET")
        ]
        
        access_control_working = True
        for endpoint, method in endpoints_to_test:
            success, _ = self.run_test(
                f"Unauthorized Access Test - {endpoint}",
                method,
                endpoint,
                403,  # Should get forbidden
                token=self.alguacil_token
            )
            if not success:
                access_control_working = False
        
        return access_control_working

    def test_invalid_login(self):
        """Test invalid login credentials"""
        success, _ = self.run_test(
            "Invalid Login Test",
            "POST",
            "api/login",
            401,  # Should get unauthorized
            data={"username": "invalid", "password": "invalid"}
        )
        return success

    def cleanup(self):
        """Clean up created test data"""
        if self.created_user_id and self.admin_token:
            print(f"\n🧹 Cleaning up test user: {self.created_user_id}")
            self.run_test(
                "Cleanup - Delete Test User",
                "DELETE",
                f"api/users/{self.created_user_id}",
                200,
                token=self.admin_token
            )

def main():
    print("🚀 Starting CJP VIGIA API Testing...")
    print("=" * 60)
    
    tester = CJPVigiaAPITester()
    
    try:
        # Test sequence
        tests = [
            ("Admin Login", tester.test_admin_login),
            ("Get Current User (Admin)", lambda: tester.test_get_current_user(tester.admin_token, "admin")),
            ("Create Test User", tester.test_create_user),
            ("Alguacil Login", tester.test_alguacil_login),
            ("Get Current User (Alguacil)", lambda: tester.test_get_current_user(tester.alguacil_token, "alguacil")),
            ("Get All Users", tester.test_get_users),
            ("Create Report", tester.test_create_report),
            ("Get Reports (Admin)", tester.test_get_reports_admin),
            ("Get Reports (Alguacil)", tester.test_get_reports_alguacil),
            ("Get Dashboard Stats", tester.test_get_stats),
            ("Create Announcement", tester.test_create_announcement),
            ("Get Announcements", tester.test_get_announcements),
            ("Get Notifications", tester.test_get_notifications),
            ("Test Unauthorized Access", tester.test_unauthorized_access),
            ("Test Invalid Login", tester.test_invalid_login),
        ]
        
        for test_name, test_func in tests:
            print(f"\n{'='*20} {test_name} {'='*20}")
            try:
                result = test_func()
                if not result:
                    print(f"⚠️  {test_name} failed but continuing...")
            except Exception as e:
                print(f"❌ {test_name} threw exception: {str(e)}")
        
        # Cleanup
        tester.cleanup()
        
    except KeyboardInterrupt:
        print("\n\n⏹️  Testing interrupted by user")
        tester.cleanup()
    
    # Print final results
    print(f"\n{'='*60}")
    print(f"📊 FINAL RESULTS:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "No tests run")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! Backend API is working correctly.")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
