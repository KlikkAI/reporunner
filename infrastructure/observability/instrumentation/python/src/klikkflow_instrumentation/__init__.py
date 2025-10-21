"""
KlikkFlow OpenTelemetry Instrumentation

This package provides comprehensive observability instrumentation for KlikkFlow
Python applications including tracing, metrics, and logging.
"""

import os
import logging
from typing import Dict, List, Optional, Any, Sequence
from dataclasses import dataclass, field

from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, SpanExporter
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import MetricExporter, PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION, DEPLOYMENT_ENVIRONMENT
from opentelemetry.instrumentation.instrumentor import BaseInstrumentor
from opentelemetry.instrumentation.utils import unwrap
from opentelemetry.propagate import set_global_textmap
from opentelemetry.propagators.composite import CompositePropagator
from opentelemetry.propagators.b3 import B3MultiFormat
from opentelemetry.propagators.jaeger import JaegerPropagator
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
from opentelemetry.baggage.propagation import W3CBaggagePropagator

# Exporters
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.exporter.prometheus import PrometheusMetricReader

# Resource detectors
from opentelemetry.resource.detector.docker import DockerResourceDetector
from opentelemetry.resource.detector.gcp import GoogleCloudResourceDetector

# Instrumentations
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.urllib import URLLibInstrumentor
from opentelemetry.instrumentation.urllib3 import URLLib3Instrumentor
from opentelemetry.instrumentation.logging import LoggingInstrumentor

try:
    from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
except ImportError:
    HTTPXClientInstrumentor = None

try:
    from opentelemetry.instrumentation.aiohttp_client import AioHttpClientInstrumentor
except ImportError:
    AioHttpClientInstrumentor = None

try:
    from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
except ImportError:
    SQLAlchemyInstrumentor = None

try:
    from opentelemetry.instrumentation.pymongo import PymongoInstrumentor
except ImportError:
    PymongoInstrumentor = None

try:
    from opentelemetry.instrumentation.redis import RedisInstrumentor
except ImportError:
    RedisInstrumentor = None

try:
    from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor
except ImportError:
    Psycopg2Instrumentor = None

# Web framework instrumentations
try:
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
except ImportError:
    FastAPIInstrumentor = None

try:
    from opentelemetry.instrumentation.django import DjangoInstrumentor
except ImportError:
    DjangoInstrumentor = None

try:
    from opentelemetry.instrumentation.flask import FlaskInstrumentor
except ImportError:
    FlaskInstrumentor = None

try:
    from opentelemetry.instrumentation.celery import CeleryInstrumentor
except ImportError:
    CeleryInstrumentor = None

__version__ = "1.0.0"

logger = logging.getLogger(__name__)


@dataclass
class TracingConfig:
    """Configuration for tracing"""
    enabled: bool = True
    jaeger_endpoint: Optional[str] = None
    otlp_endpoint: Optional[str] = None
    otlp_headers: Optional[Dict[str, str]] = None
    sampling_rate: float = 0.1


@dataclass
class MetricsConfig:
    """Configuration for metrics"""
    enabled: bool = True
    prometheus_port: int = 9464
    prometheus_endpoint: str = "/metrics"
    otlp_endpoint: Optional[str] = None
    otlp_headers: Optional[Dict[str, str]] = None


@dataclass
class LoggingConfig:
    """Configuration for logging"""
    enabled: bool = True
    correlation: bool = True
    format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"


@dataclass
class InstrumentationConfig:
    """Main configuration for KlikkFlow instrumentation"""
    service_name: str
    service_version: str = "1.0.0"
    environment: str = "development"
    tracing: TracingConfig = field(default_factory=TracingConfig)
    metrics: MetricsConfig = field(default_factory=MetricsConfig)
    logging: LoggingConfig = field(default_factory=LoggingConfig)
    custom_attributes: Optional[Dict[str, str]] = None
    exclude_urls: Optional[List[str]] = None


class KlikkFlowInstrumentor(BaseInstrumentor):
    """
    OpenTelemetry instrumentor for KlikkFlow applications
    """

    def __init__(self):
        super().__init__()
        self._config: Optional[InstrumentationConfig] = None
        self._instrumentors: List[BaseInstrumentor] = []

    def instrumentation_dependencies(self) -> Sequence[str]:
        return []

    def _instrument(self, **kwargs):
        """Start instrumentation"""
        config = kwargs.get("config")
        if not config:
            raise ValueError("Configuration is required for instrumentation")

        self._config = config
        self._setup_resource()
        self._setup_tracing()
        self._setup_metrics()
        self._setup_logging()
        self._setup_propagators()
        self._instrument_libraries()

        logger.info(f"🔍 KlikkFlow instrumentation started for {config.service_name}")
        logger.info(f"📊 Tracing enabled: {config.tracing.enabled}")
        logger.info(f"📈 Metrics enabled: {config.metrics.enabled}")

    def _uninstrument(self, **kwargs):
        """Stop instrumentation"""
        for instrumentor in self._instrumentors:
            try:
                instrumentor.uninstrument()
            except Exception as e:
                logger.warning(f"Failed to uninstrument {instrumentor.__class__.__name__}: {e}")

        self._instrumentors.clear()
        logger.info("🛑 KlikkFlow instrumentation stopped")

    def _setup_resource(self):
        """Setup OpenTelemetry resource"""
        if not self._config:
            return

        resource_attributes = {
            SERVICE_NAME: self._config.service_name,
            SERVICE_VERSION: self._config.service_version,
            DEPLOYMENT_ENVIRONMENT: self._config.environment,
            "service.namespace": "klikkflow",
            "klikkflow.component": self._get_component_type(),
        }

        if self._config.custom_attributes:
            resource_attributes.update(self._config.custom_attributes)

        # Create base resource
        resource = Resource.create(resource_attributes)

        # Detect additional resource attributes
        detectors = [DockerResourceDetector(), GoogleCloudResourceDetector()]
        for detector in detectors:
            try:
                detected_resource = detector.detect()
                resource = resource.merge(detected_resource)
            except Exception as e:
                logger.debug(f"Failed to detect resource with {detector.__class__.__name__}: {e}")

        self._resource = resource

    def _setup_tracing(self):
        """Setup tracing with configured exporters"""
        if not self._config or not self._config.tracing.enabled:
            return

        # Create tracer provider
        tracer_provider = TracerProvider(resource=self._resource)
        trace.set_tracer_provider(tracer_provider)

        # Setup span exporters
        exporters = []

        if self._config.tracing.jaeger_endpoint:
            jaeger_exporter = JaegerExporter(
                agent_host_name="localhost",
                agent_port=6831,
                collector_endpoint=self._config.tracing.jaeger_endpoint,
            )
            exporters.append(jaeger_exporter)

        if self._config.tracing.otlp_endpoint:
            otlp_exporter = OTLPSpanExporter(
                endpoint=self._config.tracing.otlp_endpoint,
                headers=self._config.tracing.otlp_headers,
            )
            exporters.append(otlp_exporter)

        # Add batch span processors
        for exporter in exporters:
            span_processor = BatchSpanProcessor(exporter)
            tracer_provider.add_span_processor(span_processor)

    def _setup_metrics(self):
        """Setup metrics with configured exporters"""
        if not self._config or not self._config.metrics.enabled:
            return

        metric_readers = []

        # Prometheus metrics
        if self._config.metrics.prometheus_port:
            prometheus_reader = PrometheusMetricReader(
                preferred_temporality={},
                preferred_aggregation={}
            )
            metric_readers.append(prometheus_reader)

        # OTLP metrics
        if self._config.metrics.otlp_endpoint:
            otlp_metric_exporter = OTLPMetricExporter(
                endpoint=self._config.metrics.otlp_endpoint,
                headers=self._config.metrics.otlp_headers,
            )
            otlp_reader = PeriodicExportingMetricReader(
                exporter=otlp_metric_exporter,
                export_interval_millis=30000,  # 30 seconds
            )
            metric_readers.append(otlp_reader)

        # Create meter provider
        if metric_readers:
            meter_provider = MeterProvider(
                resource=self._resource,
                metric_readers=metric_readers,
            )
            metrics.set_meter_provider(meter_provider)

    def _setup_logging(self):
        """Setup logging instrumentation"""
        if not self._config or not self._config.logging.enabled:
            return

        if self._config.logging.correlation:
            LoggingInstrumentor().instrument(set_logging_format=True)

    def _setup_propagators(self):
        """Setup trace context propagators"""
        propagators = [
            TraceContextTextMapPropagator(),
            W3CBaggagePropagator(),
            B3MultiFormat(),
            JaegerPropagator(),
        ]

        set_global_textmap(CompositePropagator(propagators))

    def _instrument_libraries(self):
        """Instrument common libraries"""
        if not self._config:
            return

        exclude_urls = self._config.exclude_urls or [
            "/health",
            "/metrics",
            "/ping",
            "/favicon.ico"
        ]

        # HTTP client instrumentations
        instrumentors = [
            (RequestsInstrumentor, {}),
            (URLLibInstrumentor, {}),
            (URLLib3Instrumentor, {}),
        ]

        if HTTPXClientInstrumentor:
            instrumentors.append((HTTPXClientInstrumentor, {}))

        if AioHttpClientInstrumentor:
            instrumentors.append((AioHttpClientInstrumentor, {}))

        # Database instrumentations
        if SQLAlchemyInstrumentor:
            instrumentors.append((SQLAlchemyInstrumentor, {}))

        if PymongoInstrumentor:
            instrumentors.append((PymongoInstrumentor, {}))

        if RedisInstrumentor:
            instrumentors.append((RedisInstrumentor, {}))

        if Psycopg2Instrumentor:
            instrumentors.append((Psycopg2Instrumentor, {}))

        # Web framework instrumentations
        if FastAPIInstrumentor:
            instrumentors.append((FastAPIInstrumentor, {
                "excluded_urls": ",".join(exclude_urls)
            }))

        if DjangoInstrumentor:
            instrumentors.append((DjangoInstrumentor, {}))

        if FlaskInstrumentor:
            instrumentors.append((FlaskInstrumentor, {}))

        if CeleryInstrumentor:
            instrumentors.append((CeleryInstrumentor, {}))

        # Instrument all available libraries
        for instrumentor_class, kwargs in instrumentors:
            try:
                instrumentor = instrumentor_class()
                if not instrumentor.is_instrumented_by_opentelemetry:
                    instrumentor.instrument(**kwargs)
                    self._instrumentors.append(instrumentor)
                    logger.debug(f"Instrumented {instrumentor_class.__name__}")
            except Exception as e:
                logger.warning(f"Failed to instrument {instrumentor_class.__name__}: {e}")

    def _get_component_type(self) -> str:
        """Get component type based on service name"""
        if not self._config:
            return "service"

        service_name = self._config.service_name.lower()

        if "backend" in service_name or "api" in service_name:
            return "backend"
        elif "frontend" in service_name or "ui" in service_name:
            return "frontend"
        elif "worker" in service_name or "queue" in service_name:
            return "worker"
        elif "database" in service_name or "db" in service_name:
            return "database"
        else:
            return "service"


class WorkflowTracing:
    """Utility class for workflow-specific tracing"""

    @staticmethod
    def get_tracer():
        return trace.get_tracer("klikkflow-workflow")

    @classmethod
    def start_workflow_execution(cls, workflow_id: str, execution_id: str):
        """Start a span for workflow execution"""
        tracer = cls.get_tracer()
        return tracer.start_span(
            "workflow.execution",
            attributes={
                "klikkflow.workflow.id": workflow_id,
                "klikkflow.execution.id": execution_id,
                "klikkflow.operation": "workflow_execution",
            }
        )

    @classmethod
    def start_node_execution(cls, node_id: str, node_type: str, execution_id: str):
        """Start a span for node execution"""
        tracer = cls.get_tracer()
        return tracer.start_span(
            "workflow.node.execution",
            attributes={
                "klikkflow.node.id": node_id,
                "klikkflow.node.type": node_type,
                "klikkflow.execution.id": execution_id,
                "klikkflow.operation": "node_execution",
            }
        )

    @classmethod
    def start_integration_call(cls, integration: str, operation: str):
        """Start a span for integration call"""
        tracer = cls.get_tracer()
        return tracer.start_span(
            "integration.call",
            attributes={
                "klikkflow.integration.name": integration,
                "klikkflow.integration.operation": operation,
                "klikkflow.operation": "integration_call",
            }
        )

    @classmethod
    def record_workflow_metrics(cls, workflow_id: str, status: str, duration: float):
        """Record workflow execution metrics"""
        meter = metrics.get_meter("klikkflow-workflow")

        execution_counter = meter.create_counter(
            "klikkflow_workflow_executions_total",
            description="Total number of workflow executions",
        )

        execution_duration = meter.create_histogram(
            "klikkflow_workflow_execution_duration_seconds",
            description="Workflow execution duration in seconds",
        )

        execution_counter.add(1, {
            "workflow_id": workflow_id,
            "status": status,
        })

        execution_duration.record(duration, {
            "workflow_id": workflow_id,
            "status": status,
        })


def get_default_config(service_name: str) -> InstrumentationConfig:
    """Get default configuration from environment variables"""
    return InstrumentationConfig(
        service_name=service_name,
        service_version=os.getenv("SERVICE_VERSION", "1.0.0"),
        environment=os.getenv("ENVIRONMENT", os.getenv("DEPLOYMENT_ENVIRONMENT", "development")),
        tracing=TracingConfig(
            enabled=os.getenv("TRACING_ENABLED", "true").lower() == "true",
            jaeger_endpoint=os.getenv("JAEGER_ENDPOINT", "http://localhost:14268/api/traces"),
            otlp_endpoint=os.getenv("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT", "http://localhost:4318/v1/traces"),
            otlp_headers=_parse_headers(os.getenv("OTEL_EXPORTER_OTLP_HEADERS", "")),
            sampling_rate=float(os.getenv("TRACING_SAMPLING_RATE", "0.1")),
        ),
        metrics=MetricsConfig(
            enabled=os.getenv("METRICS_ENABLED", "true").lower() == "true",
            prometheus_port=int(os.getenv("PROMETHEUS_PORT", "9464")),
            prometheus_endpoint=os.getenv("PROMETHEUS_ENDPOINT", "/metrics"),
            otlp_endpoint=os.getenv("OTEL_EXPORTER_OTLP_METRICS_ENDPOINT", "http://localhost:4318/v1/metrics"),
            otlp_headers=_parse_headers(os.getenv("OTEL_EXPORTER_OTLP_HEADERS", "")),
        ),
        logging=LoggingConfig(
            enabled=os.getenv("LOGGING_ENABLED", "true").lower() == "true",
            correlation=os.getenv("LOG_CORRELATION", "true").lower() == "true",
        ),
        exclude_urls=os.getenv("EXCLUDE_URLS", "/health,/metrics,/ping,/favicon.ico").split(","),
    )


def _parse_headers(headers_str: str) -> Optional[Dict[str, str]]:
    """Parse headers from environment variable string"""
    if not headers_str:
        return None

    headers = {}
    for header in headers_str.split(","):
        if "=" in header:
            key, value = header.split("=", 1)
            headers[key.strip()] = value.strip()

    return headers if headers else None


def init_instrumentation(config: InstrumentationConfig) -> KlikkFlowInstrumentor:
    """Initialize KlikkFlow instrumentation with the given configuration"""
    instrumentor = KlikkFlowInstrumentor()
    instrumentor.instrument(config=config)
    return instrumentor


# Convenience function for quick setup
def auto_instrument(service_name: str, **kwargs) -> KlikkFlowInstrumentor:
    """Automatically instrument with default configuration"""
    config = get_default_config(service_name)

    # Override defaults with provided kwargs
    for key, value in kwargs.items():
        if hasattr(config, key):
            setattr(config, key, value)

    return init_instrumentation(config)


__all__ = [
    "KlikkFlowInstrumentor",
    "InstrumentationConfig",
    "TracingConfig",
    "MetricsConfig",
    "LoggingConfig",
    "WorkflowTracing",
    "get_default_config",
    "init_instrumentation",
    "auto_instrument",
]