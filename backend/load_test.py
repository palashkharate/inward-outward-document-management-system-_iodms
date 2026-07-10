import threading
import time
import requests

BASE_URL = "http://localhost:8000"
NUM_THREADS = 50

def run_load_test():
    success_count = 0
    failure_count = 0
    lock = threading.Lock()

    def worker():
        nonlocal success_count, failure_count
        try:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "user_id": "admin",
                "password": "password123"
            })
            
            if response.status_code == 200:
                with lock:
                    success_count += 1
            else:
                with lock:
                    failure_count += 1
        except Exception as e:
            with lock:
                failure_count += 1

    threads = []
    start_time = time.time()

    for _ in range(NUM_THREADS):
        t = threading.Thread(target=worker)
        threads.append(t)
        t.start()

    for t in threads:
        t.join()

    duration = time.time() - start_time
    print(f"--- Load Test Results ---")
    print(f"Total Requests: {NUM_THREADS}")
    print(f"Successful Requests: {success_count}")
    print(f"Failed Requests: {failure_count}")
    print(f"Time Taken: {duration:.2f} seconds")
    print(f"Requests per second: {NUM_THREADS / duration:.2f}")

if __name__ == "__main__":
    run_load_test()
