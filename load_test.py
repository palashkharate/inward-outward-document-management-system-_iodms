import concurrent.futures
import time
import httpx

BASE_URL = "http://localhost:8000"
# Increase timeouts for load testing
timeout = httpx.Timeout(30.0)

def test_login(user_id):
    try:
        start_time = time.time()
        # Admin account is seeded automatically by seed.py
        with httpx.Client(timeout=timeout) as client:
            response = client.post(f"{BASE_URL}/api/auth/login", json={
                "user_id": "admin",
                "password": "admin123"
            })
        end_time = time.time()
        
        if response.status_code == 200:
            return True, end_time - start_time
        else:
            return False, response.text
    except Exception as e:
        return False, str(e)

def test_next_no(user_id):
    try:
        start_time = time.time()
        # Requires a FolderType to exist. We'll use 'Su-30' assuming it exists from seed/previous usage.
        with httpx.Client(timeout=timeout) as client:
            response = client.get(f"{BASE_URL}/api/inward/next-no?folder_id=Su-30")
        end_time = time.time()
        
        if response.status_code == 200:
            return True, response.json().get("inward_no")
        else:
            return False, response.text
    except Exception as e:
        return False, str(e)

if __name__ == "__main__":
    print("--- IODMS Load & Concurrency Test ---")
    print("Simulating NFR-006: 10 Concurrent Sessions")
    
    users = [f"user_{i}" for i in range(10)]
    
    # 1. Concurrent Logins
    print("\n[1] Starting 10 Concurrent Login Requests...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(test_login, users))
        
    successes = [r for r in results if r[0] == True]
    failures = [r for r in results if r[0] == False]
    
    print(f"Login Successes: {len(successes)}/10")
    if successes:
        avg_time = sum([r[1] for r in successes]) / len(successes)
        print(f"Average Login Response Time: {avg_time:.3f} seconds")
    if failures:
        print("Login Failures:", [r[1] for r in failures])

    # 2. Concurrent Number Generation
    print("\n[2] Starting 10 Concurrent Next-Number Requests (Testing Race Conditions)...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(test_next_no, users))
        
    successes = [r for r in results if r[0] == True]
    failures = [r for r in results if r[0] == False]
    
    print(f"Next-No Successes: {len(successes)}/10")
    if successes:
        numbers = [r[1] for r in successes]
        print(f"Numbers Retrieved: {numbers}")
        # Note: In a true concurrent environment with purely 'GET' requests, 
        # multiple requests might get the same number because the number isn't 'reserved' 
        # until the record is actually inserted. We just want to ensure it doesn't crash.
    if failures:
        print("Next-No Failures:", [r[1] for r in failures])
    
    print("\n--- Load Test Complete ---")
