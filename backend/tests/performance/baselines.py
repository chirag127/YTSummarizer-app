"""
Performance baselines for YouTube Summarizer API.

This module defines performance baselines for the API in resource-constrained
environments and provides functions to verify that the API meets these baselines.
"""

import os
import time
import logging
import asyncio
import psutil
import requests
import statistics
from typing import Dict, Any, List, Optional, Union, Tuple
import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Performance baselines (as specified in requirements)
BASELINES = {
    "memory": {
        "max_usage_mb": 480,  # 93% of 512MB
        "warning_threshold_mb": 450,  # 88% of 512MB
    },
    "cpu": {
        "max_usage_percent": 90,  # 90% of 0.1 cores
        "warning_threshold_percent": 80,  # 80% of 0.1 cores
    },
    "response_time": {
        "health_max_ms": 100,  # 100ms for health endpoint
        "extract_max_ms": 5000,  # 5s for extract endpoint
        "summarize_max_ms": 30000,  # 30s for summarize endpoint
        "qa_max_ms": 20000,  # 20s for Q&A endpoint
        "chat_max_ms": 20000,  # 20s for chat endpoint
    },
    "throughput": {
        "max_requests_per_minute": 30,  # 30 requests per minute
        "warning_threshold_requests_per_minute": 25,  # 25 requests per minute
    }
}

class PerformanceTest:
    """
    Performance test for YouTube Summarizer API.

    This class provides methods to test the performance of the API against
    the defined baselines.
    """

    def __init__(self, api_url: str = "http://localhost:8000"):
        """
        Initialize the performance test.

        Args:
            api_url: URL of the API to test
        """
        self.api_url = api_url
        self.results: Dict[str, Any] = {}
        self.start_time = time.time()

    def run_memory_test(self, duration_seconds: int = 60) -> Dict[str, Any]:
        """
        Test memory usage over time.

        Args:
            duration_seconds: Duration of the test in seconds

        Returns:
            Test results
        """
        logger.info(f"Running memory test for {duration_seconds} seconds")

        # Initialize results
        memory_samples = []
        timestamps = []

        # Get process information
        process = psutil.Process(os.getpid())

        # Sample memory usage over time
        start_time = time.time()
        end_time = start_time + duration_seconds

        while time.time() < end_time:
            # Get memory usage
            memory_info = process.memory_info()
            memory_mb = memory_info.rss / (1024 * 1024)

            # Record sample
            memory_samples.append(memory_mb)
            timestamps.append(time.time() - start_time)

            # Wait before next sample
            time.sleep(1)

        # Calculate statistics
        max_memory = max(memory_samples)
        avg_memory = statistics.mean(memory_samples)
        min_memory = min(memory_samples)

        # Check against baselines
        max_memory_baseline = BASELINES["memory"]["max_usage_mb"]
        warning_threshold = BASELINES["memory"]["warning_threshold_mb"]

        status = "pass"
        if max_memory > max_memory_baseline:
            status = "fail"
        elif max_memory > warning_threshold:
            status = "warning"

        # Store results
        results = {
            "max_memory_mb": max_memory,
            "avg_memory_mb": avg_memory,
            "min_memory_mb": min_memory,
            "baseline_max_mb": max_memory_baseline,
            "warning_threshold_mb": warning_threshold,
            "status": status,
            "samples": memory_samples,
            "timestamps": timestamps
        }

        self.results["memory"] = results

        logger.info(f"Memory test completed: {status.upper()}")
        logger.info(f"Max memory: {max_memory:.2f}MB (baseline: {max_memory_baseline}MB)")

        return results

    def run_cpu_test(self, duration_seconds: int = 60) -> Dict[str, Any]:
        """
        Test CPU usage over time.

        Args:
            duration_seconds: Duration of the test in seconds

        Returns:
            Test results
        """
        logger.info(f"Running CPU test for {duration_seconds} seconds")

        # Initialize results
        cpu_samples = []
        timestamps = []

        # Get process information
        process = psutil.Process(os.getpid())

        # Sample CPU usage over time
        start_time = time.time()
        end_time = start_time + duration_seconds

        while time.time() < end_time:
            # Get CPU usage
            cpu_percent = process.cpu_percent(interval=1.0)

            # Record sample
            cpu_samples.append(cpu_percent)
            timestamps.append(time.time() - start_time)

        # Calculate statistics
        max_cpu = max(cpu_samples)
        avg_cpu = statistics.mean(cpu_samples)
        min_cpu = min(cpu_samples)

        # Check against baselines
        max_cpu_baseline = BASELINES["cpu"]["max_usage_percent"]
        warning_threshold = BASELINES["cpu"]["warning_threshold_percent"]

        status = "pass"
        if max_cpu > max_cpu_baseline:
            status = "fail"
        elif max_cpu > warning_threshold:
            status = "warning"

        # Store results
        results = {
            "max_cpu_percent": max_cpu,
            "avg_cpu_percent": avg_cpu,
            "min_cpu_percent": min_cpu,
            "baseline_max_percent": max_cpu_baseline,
            "warning_threshold_percent": warning_threshold,
            "status": status,
            "samples": cpu_samples,
            "timestamps": timestamps
        }

        self.results["cpu"] = results

        logger.info(f"CPU test completed: {status.upper()}")
        logger.info(f"Max CPU: {max_cpu:.2f}% (baseline: {max_cpu_baseline}%)")

        return results

    def run_response_time_test(self, endpoint: str, method: str = "GET", data: Optional[Dict[str, Any]] = None, samples: int = 10) -> Dict[str, Any]:
        """
        Test response time for an endpoint.

        Args:
            endpoint: API endpoint to test
            method: HTTP method to use
            data: Request data for POST requests
            samples: Number of samples to collect

        Returns:
            Test results
        """
        logger.info(f"Running response time test for {endpoint} ({samples} samples)")

        # Initialize results
        response_times = []

        # Make requests and measure response time
        for i in range(samples):
            start_time = time.time()

            try:
                if method.upper() == "GET":
                    response = requests.get(f"{self.api_url}{endpoint}", timeout=60)
                elif method.upper() == "POST":
                    response = requests.post(f"{self.api_url}{endpoint}", json=data, timeout=60)
                else:
                    raise ValueError(f"Unsupported HTTP method: {method}")

                # Calculate response time
                response_time = (time.time() - start_time) * 1000  # Convert to milliseconds

                # Check if request was successful
                if response.status_code == 200:
                    response_times.append(response_time)
                else:
                    logger.warning(f"Request failed with status code {response.status_code}")
            except Exception as e:
                logger.error(f"Error making request: {e}")

            # Wait before next request
            time.sleep(2)

        # Calculate statistics
        if response_times:
            max_time = max(response_times)
            avg_time = statistics.mean(response_times)
            min_time = min(response_times)

            # Get baseline for this endpoint
            endpoint_name = endpoint.strip("/").split("/")[-1]
            baseline_key = f"{endpoint_name}_max_ms"

            if baseline_key in BASELINES["response_time"]:
                max_time_baseline = BASELINES["response_time"][baseline_key]
            else:
                max_time_baseline = BASELINES["response_time"]["extract_max_ms"]  # Default

            # Check against baseline
            status = "pass"
            if max_time > max_time_baseline:
                status = "fail"
            elif max_time > max_time_baseline * 0.8:
                status = "warning"
        else:
            max_time = 0
            avg_time = 0
            min_time = 0
            max_time_baseline = 0
            status = "fail"

        # Store results
        results = {
            "endpoint": endpoint,
            "method": method,
            "max_time_ms": max_time,
            "avg_time_ms": avg_time,
            "min_time_ms": min_time,
            "baseline_max_ms": max_time_baseline,
            "status": status,
            "samples": response_times
        }

        if "response_time" not in self.results:
            self.results["response_time"] = {}

        self.results["response_time"][endpoint] = results

        logger.info(f"Response time test for {endpoint} completed: {status.upper()}")
        logger.info(f"Max response time: {max_time:.2f}ms (baseline: {max_time_baseline}ms)")

        return results

    def run_throughput_test(self, endpoint: str, method: str = "GET", data: Optional[Dict[str, Any]] = None, duration_seconds: int = 60) -> Dict[str, Any]:
        """
        Test throughput for an endpoint.

        Args:
            endpoint: API endpoint to test
            method: HTTP method to use
            data: Request data for POST requests
            duration_seconds: Duration of the test in seconds

        Returns:
            Test results
        """
        logger.info(f"Running throughput test for {endpoint} ({duration_seconds} seconds)")

        # Initialize results
        request_count = 0
        successful_count = 0
        failed_count = 0
        response_times = []

        # Make requests for the specified duration
        start_time = time.time()
        end_time = start_time + duration_seconds

        while time.time() < end_time:
            request_start_time = time.time()

            try:
                if method.upper() == "GET":
                    response = requests.get(f"{self.api_url}{endpoint}", timeout=10)
                elif method.upper() == "POST":
                    response = requests.post(f"{self.api_url}{endpoint}", json=data, timeout=10)
                else:
                    raise ValueError(f"Unsupported HTTP method: {method}")

                # Calculate response time
                response_time = (time.time() - request_start_time) * 1000  # Convert to milliseconds

                # Check if request was successful
                if response.status_code == 200:
                    successful_count += 1
                    response_times.append(response_time)
                else:
                    failed_count += 1
                    logger.warning(f"Request failed with status code {response.status_code}")
            except Exception as e:
                failed_count += 1
                logger.error(f"Error making request: {e}")

            request_count += 1

            # Wait a short time before next request
            time.sleep(0.1)

        # Calculate statistics
        elapsed_time = time.time() - start_time
        requests_per_minute = (request_count / elapsed_time) * 60
        success_rate = (successful_count / request_count) * 100 if request_count > 0 else 0

        if response_times:
            avg_response_time = statistics.mean(response_times)
        else:
            avg_response_time = 0

        # Check against baseline
        max_throughput_baseline = BASELINES["throughput"]["max_requests_per_minute"]
        warning_threshold = BASELINES["throughput"]["warning_threshold_requests_per_minute"]

        status = "pass"
        if requests_per_minute < warning_threshold:
            status = "warning"
        if requests_per_minute < max_throughput_baseline * 0.5:  # Less than 50% of baseline
            status = "fail"

        # Store results
        results = {
            "endpoint": endpoint,
            "method": method,
            "requests_per_minute": requests_per_minute,
            "success_rate_percent": success_rate,
            "avg_response_time_ms": avg_response_time,
            "baseline_requests_per_minute": max_throughput_baseline,
            "warning_threshold_requests_per_minute": warning_threshold,
            "status": status,
            "total_requests": request_count,
            "successful_requests": successful_count,
            "failed_requests": failed_count
        }

        if "throughput" not in self.results:
            self.results["throughput"] = {}

        self.results["throughput"][endpoint] = results

        logger.info(f"Throughput test for {endpoint} completed: {status.upper()}")
        logger.info(f"Requests per minute: {requests_per_minute:.2f} (baseline: {max_throughput_baseline})")
        logger.info(f"Success rate: {success_rate:.2f}%")

        return results

    def generate_report(self, output_dir: str = "./reports") -> str:
        """
        Generate a performance test report.

        Args:
            output_dir: Directory to save the report

        Returns:
            Path to the generated report
        """
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)

        # Generate report filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_filename = f"performance_report_{timestamp}.html"
        report_path = os.path.join(output_dir, report_filename)

        # Generate HTML report
        with open(report_path, "w") as f:
            f.write("<html><head><title>Performance Test Report</title>")
            f.write("<style>body{font-family:Arial,sans-serif;margin:20px;}")
            f.write("table{border-collapse:collapse;width:100%;}")
            f.write("th,td{border:1px solid #ddd;padding:8px;text-align:left;}")
            f.write("th{background-color:#f2f2f2;}")
            f.write(".pass{color:green;}.warning{color:orange;}.fail{color:red;}")
            f.write("</style></head><body>")

            # Report header
            f.write(f"<h1>Performance Test Report</h1>")
            f.write(f"<p>Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>")
            f.write(f"<p>API URL: {self.api_url}</p>")

            # Memory test results
            if "memory" in self.results:
                memory = self.results["memory"]
                f.write("<h2>Memory Usage</h2>")
                f.write(f"<p class='{memory['status']}'>Status: {memory['status'].upper()}</p>")
                f.write("<table>")
                f.write("<tr><th>Metric</th><th>Value</th><th>Baseline</th></tr>")
                f.write(f"<tr><td>Max Memory</td><td>{memory['max_memory_mb']:.2f} MB</td><td>{memory['baseline_max_mb']} MB</td></tr>")
                f.write(f"<tr><td>Avg Memory</td><td>{memory['avg_memory_mb']:.2f} MB</td><td>N/A</td></tr>")
                f.write(f"<tr><td>Min Memory</td><td>{memory['min_memory_mb']:.2f} MB</td><td>N/A</td></tr>")
                f.write("</table>")

            # CPU test results
            if "cpu" in self.results:
                cpu = self.results["cpu"]
                f.write("<h2>CPU Usage</h2>")
                f.write(f"<p class='{cpu['status']}'>Status: {cpu['status'].upper()}</p>")
                f.write("<table>")
                f.write("<tr><th>Metric</th><th>Value</th><th>Baseline</th></tr>")
                f.write(f"<tr><td>Max CPU</td><td>{cpu['max_cpu_percent']:.2f}%</td><td>{cpu['baseline_max_percent']}%</td></tr>")
                f.write(f"<tr><td>Avg CPU</td><td>{cpu['avg_cpu_percent']:.2f}%</td><td>N/A</td></tr>")
                f.write(f"<tr><td>Min CPU</td><td>{cpu['min_cpu_percent']:.2f}%</td><td>N/A</td></tr>")
                f.write("</table>")

            # Response time test results
            if "response_time" in self.results:
                f.write("<h2>Response Time</h2>")
                f.write("<table>")
                f.write("<tr><th>Endpoint</th><th>Max Time</th><th>Avg Time</th><th>Min Time</th><th>Baseline</th><th>Status</th></tr>")

                for endpoint, results in self.results["response_time"].items():
                    f.write(f"<tr>")
                    f.write(f"<td>{endpoint}</td>")
                    f.write(f"<td>{results['max_time_ms']:.2f} ms</td>")
                    f.write(f"<td>{results['avg_time_ms']:.2f} ms</td>")
                    f.write(f"<td>{results['min_time_ms']:.2f} ms</td>")
                    f.write(f"<td>{results['baseline_max_ms']} ms</td>")
                    f.write(f"<td class='{results['status']}'>{results['status'].upper()}</td>")
                    f.write(f"</tr>")

                f.write("</table>")

            # Throughput test results
            if "throughput" in self.results:
                f.write("<h2>Throughput</h2>")
                f.write("<table>")
                f.write("<tr><th>Endpoint</th><th>Requests/min</th><th>Success Rate</th><th>Avg Response Time</th><th>Baseline</th><th>Status</th></tr>")

                for endpoint, results in self.results["throughput"].items():
                    f.write(f"<tr>")
                    f.write(f"<td>{endpoint}</td>")
                    f.write(f"<td>{results['requests_per_minute']:.2f}</td>")
                    f.write(f"<td>{results['success_rate_percent']:.2f}%</td>")
                    f.write(f"<td>{results['avg_response_time_ms']:.2f} ms</td>")
                    f.write(f"<td>{results['baseline_requests_per_minute']}</td>")
                    f.write(f"<td class='{results['status']}'>{results['status'].upper()}</td>")
                    f.write(f"</tr>")

                f.write("</table>")

            f.write("</body></html>")

        logger.info(f"Performance report generated: {report_path}")

        return report_path

# Example usage
if __name__ == "__main__":
    # Create performance test
    test = PerformanceTest(api_url="http://localhost:8000")

    # Run memory and CPU tests
    test.run_memory_test(duration_seconds=30)
    test.run_cpu_test(duration_seconds=30)

    # Run response time tests
    test.run_response_time_test("/health", method="GET", samples=5)
    test.run_response_time_test("/api/v1/extract", method="GET", data={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}, samples=3)

    # Run throughput test
    test.run_throughput_test("/health", method="GET", duration_seconds=30)

    # Generate report
    report_path = test.generate_report()
    print(f"Report generated: {report_path}")
