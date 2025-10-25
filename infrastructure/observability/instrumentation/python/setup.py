from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="klikkflow-instrumentation",
    version="1.0.0",
    author="KlikkFlow Team",
    author_email="support@klikkflow.com",
    description="OpenTelemetry instrumentation package for KlikkFlow Python applications",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/KlikkAI/klikkflow",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: System :: Monitoring",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-asyncio>=0.21.0",
            "pytest-cov>=4.0.0",
            "black>=23.0.0",
            "isort>=5.12.0",
            "flake8>=6.0.0",
            "mypy>=1.0.0",
            "pre-commit>=3.0.0",
        ],
        "fastapi": [
            "opentelemetry-instrumentation-fastapi>=0.40b0",
        ],
        "django": [
            "opentelemetry-instrumentation-django>=0.40b0",
        ],
        "flask": [
            "opentelemetry-instrumentation-flask>=0.40b0",
        ],
        "celery": [
            "opentelemetry-instrumentation-celery>=0.40b0",
        ],
        "redis": [
            "opentelemetry-instrumentation-redis>=0.40b0",
        ],
        "mongodb": [
            "opentelemetry-instrumentation-pymongo>=0.40b0",
        ],
        "postgresql": [
            "opentelemetry-instrumentation-psycopg2>=0.40b0",
        ],
    },
    entry_points={
        "opentelemetry_instrumentor": [
            "klikkflow = klikkflow_instrumentation:KlikkFlowInstrumentor",
        ],
    },
    keywords=[
        "opentelemetry",
        "tracing",
        "observability",
        "klikkflow",
        "instrumentation",
        "monitoring",
        "telemetry",
    ],
    project_urls={
        "Bug Reports": "https://github.com/KlikkAI/klikkflow/issues",
        "Source": "https://github.com/KlikkAI/klikkflow",
        "Documentation": "https://docs.klikkflow.com",
    },
)